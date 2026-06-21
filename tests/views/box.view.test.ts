import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fakeReadline, answers } = vi.hoisted(() => {
  const answers: string[] = []
  return {
    answers,
    fakeReadline: {
      question: vi.fn((_msg: string) => Promise.resolve(answers.shift() ?? '')),
      once: vi.fn(),
      removeListener: vi.fn(),
      close: vi.fn()
    }
  }
})

vi.mock('../../src/utils/readline-interface.util', () => ({
  ReadlineInterfaceUtil: { readlineInterface: fakeReadline }
}))

import { Result } from '../../src/@common/result/result'
import { BoxController } from '../../src/controllers/box.controller'
import { Pokemon } from '../../src/models/pokemon'
import { BoxView } from '../../src/views/box.view'

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return new Pokemon({
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    height: 7,
    weight: 69,
    ...overrides
  })
}

let logSpy: ReturnType<typeof vi.spyOn>
let controller: {
  list: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  filter: ReturnType<typeof vi.fn>
  add: ReturnType<typeof vi.fn>
}
let view: BoxView

function loggedLines(): string {
  return logSpy.mock.calls.map((c) => String(c[0])).join('\n')
}

beforeEach(() => {
  answers.length = 0
  fakeReadline.question.mockReset()
  fakeReadline.question.mockImplementation((_msg: string) =>
    Promise.resolve(answers.shift() ?? '')
  )
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'clear').mockImplementation(() => undefined)

  controller = {
    list: vi.fn(),
    remove: vi.fn(),
    filter: vi.fn(),
    add: vi.fn()
  }
  view = new BoxView(controller as unknown as BoxController)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BoxView listing', () => {
  it('renders a type tally and a formatted line per pokemon', async () => {
    controller.list.mockResolvedValue([
      makePokemon({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] }),
      makePokemon({ id: 4, name: 'charmander', types: ['fire'] })
    ])
    answers.push('L', '')

    await view['update']()

    const output = loggedLines()
    expect(output).toContain('Tipos na box: grass: 1 | poison: 1 | fire: 1')
    expect(output).toContain(
      '#1 - bulbasaur | Tipos: grass, poison | Altura: 7 | Peso: 69'
    )
    expect(output).toContain('#4 - charmander | Tipos: fire | Altura: 7 | Peso: 69')
  })

  it('shows the empty-box messages when there is nothing captured', async () => {
    controller.list.mockResolvedValue([])
    answers.push('L', '')

    await view['update']()

    const output = loggedLines()
    expect(output).toContain('Tipos na box: (vazia)')
    expect(output).toContain('Nenhum Pokémon capturado.')
  })
})

describe('BoxView freeing a pokemon', () => {
  it('rejects a non-numeric id without calling the controller', async () => {
    answers.push('F', 'abc', '')

    await view['update']()

    expect(loggedLines()).toContain('Id inválido.')
    expect(controller.remove).not.toHaveBeenCalled()
  })

  it('removes a pokemon when the id is valid and present', async () => {
    controller.remove.mockResolvedValue(Result.void())
    answers.push('F', '7', '')

    await view['update']()

    expect(controller.remove).toHaveBeenCalledWith(7)
  })

  it('reports when the pokemon is not in the box', async () => {
    controller.remove.mockResolvedValue(Result.fail('not-found'))
    answers.push('F', '999')

    await view['update']()

    expect(loggedLines()).toContain('Pokémon #999 não está na box.')
  })
})

describe('BoxView filtering', () => {
  it('passes trimmed criteria (empty becomes undefined) to the controller', async () => {
    controller.filter.mockResolvedValue([makePokemon({ name: 'charmander' })])
    answers.push('T', '  fire  ', '', '')

    await view['update']()

    expect(controller.filter).toHaveBeenCalledWith({
      type: 'fire',
      name: undefined
    })
  })

  it('shows "Nenhum resultado." when the filter returns nothing', async () => {
    controller.filter.mockResolvedValue([])
    answers.push('T', '', '', '')

    await view['update']()

    expect(loggedLines()).toContain('Nenhum resultado.')
  })
})

describe('BoxView menu routing', () => {
  it('exits on "B"', async () => {
    answers.push('B')

    await view['update']()

    expect(view['isInView']).toBe(false)
  })

  it('warns on an invalid option', async () => {
    answers.push('z', '')

    await view['update']()

    expect(loggedLines()).toContain('Opção inválida.')
  })
})
