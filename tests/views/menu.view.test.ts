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

import { BoxView } from '../../src/views/box.view'
import { ExploreView } from '../../src/views/explore.view'
import { MenuView } from '../../src/views/menu.view'

const ABORT_SENTINEL = '\x00ABORT'

let logSpy: ReturnType<typeof vi.spyOn>
let exploreView: ExploreView
let boxView: BoxView
let view: MenuView

beforeEach(() => {
  answers.length = 0
  fakeReadline.question.mockReset()
  fakeReadline.question.mockImplementation((_msg: string) =>
    Promise.resolve(answers.shift() ?? '')
  )
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'clear').mockImplementation(() => undefined)

  exploreView = { start: vi.fn().mockResolvedValue(undefined) } as unknown as ExploreView
  boxView = { start: vi.fn().mockResolvedValue(undefined) } as unknown as BoxView
  view = new MenuView(exploreView, boxView)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MenuView.update', () => {
  it('starts the explore view for option "1"', async () => {
    answers.push('1')

    await view['update']()

    expect(exploreView.start).toHaveBeenCalledTimes(1)
    expect(boxView.start).not.toHaveBeenCalled()
  })

  it('starts the box view for option "2"', async () => {
    answers.push('2')

    await view['update']()

    expect(boxView.start).toHaveBeenCalledTimes(1)
    expect(exploreView.start).not.toHaveBeenCalled()
  })

  it('exits on the quit symbol (case-insensitive)', async () => {
    answers.push('q')

    await view['update']()

    expect(view['isInView']).toBe(false)
    expect(exploreView.start).not.toHaveBeenCalled()
  })

  it('exits when the prompt is aborted', async () => {
    answers.push(ABORT_SENTINEL)

    await view['update']()

    expect(view['isInView']).toBe(false)
  })

  it('warns and re-prompts on an invalid option', async () => {
    answers.push('x', '')

    await view['update']()

    expect(logSpy).toHaveBeenCalledWith(
      'x não é uma opção válida. Aperte ENTER para continuar.'
    )
    expect(exploreView.start).not.toHaveBeenCalled()
    expect(boxView.start).not.toHaveBeenCalled()
  })
})

describe('MenuView lifecycle hooks', () => {
  it('greets the user on enter', () => {
    view['onEnter']()

    expect(logSpy).toHaveBeenCalledWith('Bem vindo ao Mini Projeto!')
  })

  it('says goodbye on exit', () => {
    view['onExit']()

    expect(logSpy).toHaveBeenCalledWith('Finalizando... Até mais!')
  })
})
