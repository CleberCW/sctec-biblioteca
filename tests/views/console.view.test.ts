import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The readline singleton is created at import time against the real stdin, which
// would hang the test runner. Replace the whole module with a controllable fake.
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

import { ConsoleView } from '../../src/views/console.view'
import { BaseException } from '../../src/errors/base.exception'
import { FatalViewException } from '../../src/errors/fatal-view.exception'
import { LoggerUtil } from '../../src/utils/logger.util'

const ABORT_SENTINEL = '\x00ABORT'

class TestView extends ConsoleView {
  enterSpy = vi.fn()

  exitSpy = vi.fn()

  updateBehavior: () => void | Promise<void> = () => {
    this.exit()
  }

  constructor(isRoot = false) {
    super(isRoot)
  }

  protected async onEnter(): Promise<void> {
    await super.onEnter()
    this.enterSpy()
  }

  protected onExit(): void {
    this.exitSpy()
  }

  protected async update(): Promise<void> {
    await this.updateBehavior()
  }
}

let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  answers.length = 0
  fakeReadline.question.mockReset()
  fakeReadline.question.mockImplementation((_msg: string) =>
    Promise.resolve(answers.shift() ?? '')
  )
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'clear').mockImplementation(() => undefined)
  vi.spyOn(LoggerUtil, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ConsoleView.prompt', () => {
  it('returns the readline answer and manages the SIGINT listener', async () => {
    answers.push('pikachu')
    const view = new TestView()

    const result = await view['prompt']('Name? ')

    expect(result).toBe('pikachu')
    expect(fakeReadline.question).toHaveBeenCalledWith('Name? ', expect.anything())
    expect(fakeReadline.once).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(fakeReadline.removeListener).toHaveBeenCalledWith(
      'SIGINT',
      expect.any(Function)
    )
  })

  it('treats ERR_USE_AFTER_CLOSE as an abort: exits and returns the sentinel', async () => {
    const view = new TestView()
    fakeReadline.question.mockRejectedValueOnce(
      Object.assign(new Error('closed'), { code: 'ERR_USE_AFTER_CLOSE' })
    )

    const result = await view['prompt']('Name? ')

    expect(result).toBe(ABORT_SENTINEL)
    expect(view['isInView']).toBe(false)
  })

  it('short-circuits to the sentinel once aborted, without re-reading input', async () => {
    const view = new TestView()
    fakeReadline.question.mockRejectedValueOnce(
      Object.assign(new Error('closed'), { code: 'ERR_USE_AFTER_CLOSE' })
    )
    await view['prompt']('first')
    fakeReadline.question.mockClear()

    const result = await view['prompt']('second')

    expect(result).toBe(ABORT_SENTINEL)
    expect(fakeReadline.question).not.toHaveBeenCalled()
  })

  it('rethrows unexpected errors', async () => {
    const view = new TestView()
    fakeReadline.question.mockRejectedValueOnce(new Error('unexpected'))

    await expect(view['prompt']('Name? ')).rejects.toThrow('unexpected')
  })
})

describe('ConsoleView.reportTechnicalError', () => {
  it('logs the real error and displays a curated user message', () => {
    const view = new TestView()
    const error = new Error('internal detail')

    view['reportTechnicalError'](error, 'Algo deu errado.')

    expect(LoggerUtil.error).toHaveBeenCalledWith(error)
    expect(logSpy).toHaveBeenCalledWith('Algo deu errado.')
  })
})

describe('ConsoleView.start', () => {
  it('runs onEnter, the update loop, then onExit on a clean exit', async () => {
    const view = new TestView()

    await view.start()

    expect(view.enterSpy).toHaveBeenCalledTimes(1)
    expect(view.exitSpy).toHaveBeenCalledTimes(1)
  })

  it('recovers from a BaseException via onUpdateError and keeps looping', async () => {
    const view = new TestView()
    let calls = 0
    view.updateBehavior = () => {
      calls += 1
      if (calls === 1) {
        throw new BaseException({ cause: 'transient' })
      }
      view['exit']()
    }

    await view.start()

    expect(calls).toBe(2)
    expect(LoggerUtil.error).toHaveBeenCalled()
  })

  it('terminates the loop cleanly when a FatalViewException is thrown during update', async () => {
    const view = new TestView()
    let calls = 0
    view.updateBehavior = () => {
      calls += 1
      throw new FatalViewException('Falha fatal', { cause: 'x' })
    }

    await view.start()

    expect(calls).toBe(1) // the view did not loop again on the fatal error
    expect(view.exitSpy).toHaveBeenCalledTimes(1) // onExit ran: clean teardown
    expect(logSpy).toHaveBeenCalledWith('Falha fatal')
  })

  it('logs and stops (no infinite loop) when a non-BaseException escapes update', async () => {
    const view = new TestView()
    const fatal = new Error('fatal')
    view.updateBehavior = () => {
      throw fatal
    }

    await view.start()

    // The outer handler logged the technical error and prompted once, instead of
    // spinning forever on the failing update.
    expect(LoggerUtil.error).toHaveBeenCalledWith(fatal)
    expect(fakeReadline.question).toHaveBeenCalledWith(
      'Press ENTER to continue:',
      expect.anything()
    )
  })
})

describe('ConsoleView.onUpdateError', () => {
  it('swallows a BaseException (logs and prompts) so the loop can continue', async () => {
    const view = new TestView()

    await expect(
      view['onUpdateError'](new BaseException({ cause: 'transient' }))
    ).resolves.toBeUndefined()

    expect(LoggerUtil.error).toHaveBeenCalled()
    expect(fakeReadline.question).toHaveBeenCalledWith(
      'Pressione ENTER para continuar:',
      expect.anything()
    )
  })

  it('rethrows a plain Error so it bubbles to the outer handler', async () => {
    const view = new TestView()

    await expect(view['onUpdateError'](new Error('boom'))).rejects.toThrow('boom')
  })

  it('exits the view and surfaces the curated message for a FatalViewException', async () => {
    const view = new TestView()
    const fatal = new FatalViewException('Tela quebrou', { cause: 'internal' })

    await expect(view['onUpdateError'](fatal)).resolves.toBeUndefined()

    expect(view['isInView']).toBe(false)
    expect(logSpy).toHaveBeenCalledWith('Tela quebrou')
    expect(LoggerUtil.error).toHaveBeenCalledWith(fatal)
    expect(fakeReadline.question).toHaveBeenCalledWith(
      'Pressione ENTER para continuar:',
      expect.anything()
    )
  })
})

describe('ConsoleView.showError', () => {
  it('surfaces the curated viewMessage of a FatalViewException to the user', () => {
    const view = new TestView()
    const fatal = new FatalViewException('Algo falhou ao carregar', {
      cause: 'internal'
    })

    view['showError'](fatal)

    expect(logSpy).toHaveBeenCalledWith('Algo falhou ao carregar')
    expect(LoggerUtil.error).toHaveBeenCalledWith(fatal)
  })

  it('logs a plain Error without leaking it to the user', () => {
    const view = new TestView()
    const error = new Error('internal detail')

    view['showError'](error)

    expect(LoggerUtil.error).toHaveBeenCalledWith(error)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
