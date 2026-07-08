import { BaseException } from '../errors/base.exception'
import { FatalViewException } from '../errors/fatal-view.exception'
import { defer } from '../utils/common.util'
import { LoggerUtil } from '../utils/logger.util'
import { ReadlineInterfaceUtil } from '../utils/readline-interface.util'

export abstract class ConsoleView {
  protected static readonly ABORT_SENTINEL = '\x00ABORT'

  protected isInView = true

  private aborted = false

  private readlineInterface = ReadlineInterfaceUtil.readlineInterface

  constructor(private readonly isRootView = false) {}

  protected abstract update(): void | Promise<void>

  protected async prompt(message: string): Promise<string> {
    if (this.aborted) {
      return ConsoleView.ABORT_SENTINEL
    }

    const controller = new AbortController()

    const onSigint = (): void => {
      controller.abort()
    }

    this.readlineInterface.once('SIGINT', onSigint)

    try {
      return await this.readlineInterface.question(message, {
        signal: controller.signal
      })
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error &&
          'code' in error &&
          error.code === 'ERR_USE_AFTER_CLOSE')
      ) {
        this.aborted = true
        this.exit()
        return ConsoleView.ABORT_SENTINEL
      }

      throw error
    } finally {
      this.readlineInterface.removeListener('SIGINT', onSigint)
    }
  }

  protected display(message: string): void {
    console.log(message)
  }

  /**
   * Report a *technical* failure: log the real error (stderr, for the dev) and
   * show the user a curated, non-leaking message. Never pass `error.message`
   * straight to `display` — it can carry internals (contract JSON, stack). Only
   * for technical errors; domain outcomes are shown directly, never logged.
   */
  protected reportTechnicalError(
    error: unknown,
    userMessage = 'Algo deu errado. Tente novamente.'
  ): void {
    LoggerUtil.error(error)
    this.display(userMessage)
  }

  protected showError(error: string | Error): void {
    if (error instanceof FatalViewException) {
      this.display(error.viewMessage)
    }
    LoggerUtil.error(error)
  }

  protected clear(): void {
    console.clear()
  }

  protected onEnter(): void | Promise<void> {
    this.clear()
  }

  protected onExit(): void | Promise<void> {
    return void 0
  }

  protected async onUpdateError(error: unknown): Promise<void> {
    // Most-specific first: FatalViewException IS a BaseException, so it must be
    // matched before the recoverable branch or it would never be reached.
    if (error instanceof FatalViewException) {
      // Fatal to this view: surface the curated message, pause so the user can
      // read it, then tear the view down (back to the parent view).
      this.exit(error)
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    if (error instanceof BaseException) {
      LoggerUtil.error(error)
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    throw error
  }

  protected exit(reason?: Error): void {
    this.isInView = false
    if (reason) {
      this.showError(reason)
    }
  }

  private resetState(): void {
    this.isInView = true
    this.aborted = false
  }

  async start(): Promise<void> {
    this.resetState()

    using _ = this.isRootView
      ? defer(() => {
          this.readlineInterface.close()
        })
      : undefined

    try {
      await this.onEnter()

      while (this.isInView) {
        try {
          this.clear()
          await this.update()
        } catch (error: unknown) {
          await this.onUpdateError(error)
        }
      }

      await this.onExit()
    } catch (error) {
      if (error instanceof Error) {
        this.showError(error)
      }
      await this.prompt('Press ENTER to continue:')
    }
  }
}
