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
import { PokeApiController } from '../../src/controllers/poke-api.controller'
import { PokemonSliceDto } from '../../src/dtos/pokemon-slice.dto'
import { FatalViewException } from '../../src/errors/fatal-view.exception'
import { Pokemon } from '../../src/models/pokemon'
import { LoggerUtil } from '../../src/utils/logger.util'
import { ExploreView } from '../../src/views/explore.view'

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return new Pokemon({
    id: 1,
    name: 'bulbasaur',
    types: ['grass'],
    height: 7,
    weight: 69,
    ...overrides
  })
}

function makeSlice(overrides: Partial<PokemonSliceDto> = {}): PokemonSliceDto {
  return new PokemonSliceDto({
    next: { offset: 20 },
    previous: null,
    results: [{ name: 'bulbasaur' }, { name: 'ivysaur' }],
    ...overrides
  })
}

let logSpy: ReturnType<typeof vi.spyOn>
let pokeApiController: {
  getPokemons: ReturnType<typeof vi.fn>
  catchPokemon: ReturnType<typeof vi.fn>
}
let boxController: { add: ReturnType<typeof vi.fn> }
let view: ExploreView

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
  vi.spyOn(LoggerUtil, 'error').mockImplementation(() => undefined)

  pokeApiController = { getPokemons: vi.fn(), catchPokemon: vi.fn() }
  boxController = { add: vi.fn() }
  view = new ExploreView(
    pokeApiController as unknown as PokeApiController,
    boxController as unknown as BoxController
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExploreView.onEnter', () => {
  it('loads the first page into the current slice', async () => {
    const slice = makeSlice()
    pokeApiController.getPokemons.mockResolvedValue(slice)

    await view['onEnter']()

    expect(pokeApiController.getPokemons).toHaveBeenCalledWith(0)
    expect(view['slice']).toBe(slice)
  })

  it('throws a FatalViewException when the first page fails to load', async () => {
    pokeApiController.getPokemons.mockRejectedValue(new Error('boom'))

    await expect(view['onEnter']()).rejects.toBeInstanceOf(FatalViewException)
  })

  it('throws a FatalViewException when the payload is not a real slice', async () => {
    // The catch returns the raw value; only a genuine PokemonSliceDto is trusted.
    pokeApiController.getPokemons.mockResolvedValue({ results: [] })

    await expect(view['onEnter']()).rejects.toBeInstanceOf(FatalViewException)
  })
})

describe('ExploreView.start with a failing first load', () => {
  it('surfaces the curated fatal message and does not enter the menu loop', async () => {
    pokeApiController.getPokemons.mockRejectedValue(new Error('boom'))

    await view.start()

    expect(loggedLines()).toContain('Erro ao carregar a lista de pokemons')
    // The menu prompt ("Escolha uma opção: ") is never reached.
    const prompts = fakeReadline.question.mock.calls.map((c) => c[0])
    expect(prompts).not.toContain('Escolha uma opção: ')
  })
})

describe('ExploreView pagination', () => {
  it('advances to the next page and updates the offset', async () => {
    view['slice'] = makeSlice({ next: { offset: 20 } })
    const nextSlice = makeSlice({ next: { offset: 40 }, previous: { offset: 0 } })
    pokeApiController.getPokemons.mockResolvedValue(nextSlice)

    await view['handleNext']()

    expect(pokeApiController.getPokemons).toHaveBeenCalledWith(20)
    expect(view['slice']).toBe(nextSlice)
    expect(view['currentOffset']).toBe(20)
  })

  it('refuses to advance when there is no next page', async () => {
    view['slice'] = makeSlice({ next: null })
    answers.push('')

    await view['handleNext']()

    expect(loggedLines()).toContain('Não há próxima página.')
    expect(pokeApiController.getPokemons).not.toHaveBeenCalled()
  })

  it('reports a technical error and keeps the current slice when paging fails', async () => {
    const current = makeSlice({ next: { offset: 20 } })
    view['slice'] = current
    pokeApiController.getPokemons.mockRejectedValue(new Error('network'))
    answers.push('')

    await view['handleNext']()

    expect(LoggerUtil.error).toHaveBeenCalled()
    expect(loggedLines()).toContain('Falha ao carregar a página anterior.')
    expect(view['slice']).toBe(current)
    expect(view['currentOffset']).toBe(0)
  })

  it('refuses to go back when there is no previous page', async () => {
    view['slice'] = makeSlice({ previous: null })
    answers.push('')

    await view['handlePrevious']()

    expect(loggedLines()).toContain('Não há página anterior.')
    expect(pokeApiController.getPokemons).not.toHaveBeenCalled()
  })
})

describe('ExploreView catching', () => {
  it('adds a caught pokemon to the box', async () => {
    const pokemon = makePokemon({ name: 'pikachu' })
    pokeApiController.catchPokemon.mockResolvedValue(Result.ok(pokemon))
    boxController.add.mockResolvedValue(Result.void())
    answers.push('pikachu', '')

    await view['handleCatch']()

    expect(pokeApiController.catchPokemon).toHaveBeenCalledWith('pikachu')
    expect(boxController.add).toHaveBeenCalledWith(pokemon)
    expect(loggedLines()).toContain('pikachu capturado!')
  })

  it('reports a duplicate without re-capturing', async () => {
    const pokemon = makePokemon({ name: 'pikachu' })
    pokeApiController.catchPokemon.mockResolvedValue(Result.ok(pokemon))
    boxController.add.mockResolvedValue(Result.fail('duplicate'))
    answers.push('pikachu', '')

    await view['handleCatch']()

    expect(loggedLines()).toContain('pikachu já está na box.')
  })

  it('reports when the pokemon is not found', async () => {
    pokeApiController.catchPokemon.mockResolvedValue(Result.fail('not-found'))
    answers.push('missingno', '')

    await view['handleCatch']()

    expect(loggedLines()).toContain('Pokémon não encontrado.')
    expect(boxController.add).not.toHaveBeenCalled()
  })
})

describe('ExploreView menu routing', () => {
  it('exits on "B"', async () => {
    view['slice'] = makeSlice()
    answers.push('B')

    await view['update']()

    expect(view['isInView']).toBe(false)
  })

  it('warns on an invalid option', async () => {
    view['slice'] = makeSlice()
    answers.push('z', '')

    await view['update']()

    expect(loggedLines()).toContain('Opção inválida.')
  })
})
