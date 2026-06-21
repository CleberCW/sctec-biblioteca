import {
  BaseException,
  BaseExceptionConstructorOptions
} from './base.exception'

export class FatalViewException extends BaseException {
  constructor(
    public readonly viewMessage: string,
    options?: BaseExceptionConstructorOptions
  ) {
    super(options)
  }

  static fromUnknown(viewMessage: string, error: unknown) {
    return new FatalViewException(viewMessage, { cause: error })
  }
}
