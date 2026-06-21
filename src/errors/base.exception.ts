/**  | Error
  | string
  | Record<string | number | symbol, unknown>
  | Record<string | number | symbol, unknown>[] */
export type ErrorCause = unknown

export interface BaseExceptionConstructorOptions {
  code?: string
  cause: ErrorCause
  messagePrefix?: string
}

/**
 * Base exception class
 *
 * This class is meant to be used as an Error class for all other exceptions.
 *
 */
export class BaseException extends Error {
  protected code?: string

  constructor(options?: BaseExceptionConstructorOptions) {
    super()
    this.name = this.constructor.name
    if (!options) {
      return this
    }

    this.code = options.code

    if (options.cause instanceof Error) {
      this.stack = options.cause.stack
    }

    this.message = `${options.messagePrefix ?? ''}${BaseException.formatCause(options.cause)}`
  }

  protected static formatCause(cause: ErrorCause): string {
    if (typeof cause === 'string') {
      return cause
    }

    if (cause instanceof Error) {
      return `Cause - ${cause.name}: ${cause.message}`
    }

    try {
      return JSON.stringify(cause, null, 2)
    } catch {
      return 'unidentifiable cause'
    }
  }

  static isError(error: unknown): error is BaseException {
    return error instanceof BaseException
  }

  static fromError(
    error: Error,
    options?: Omit<BaseExceptionConstructorOptions, 'cause'>
  ) {
    return new BaseException({
      cause: error,
      ...options
    })
  }

  static fromUnknown(
    unknown: unknown,
    options?: Omit<BaseExceptionConstructorOptions, 'cause'>
  ) {
    return new BaseException({
      cause: unknown,
      ...options
    })
  }
}
