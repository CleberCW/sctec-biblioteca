import { BaseException } from '../../errors/base.exception'

interface Ok<T> {
  readonly kind: 'Ok'
  readonly value: T
}
interface Fail<K extends string> {
  readonly kind: K
}
interface Err {
  readonly kind: 'Err'
  readonly error: BaseException
}

export type Result<T, E extends string = never> = Ok<T> | Fail<E>

/**
 * When a function returns this type, it should never throw consciously. Unwanted throws are a bugs
 */
export type Outcome<T, E extends string = never> = Ok<T> | Fail<E> | Err

export const Result = {
  ok: <T>(value: T): Ok<T> => ({ kind: 'Ok', value }),
  void: (): Ok<void> => ({ kind: 'Ok', value: void 0 }),
  fail: <E extends string>(kind: E): Fail<E> => ({ kind })
} as const

export const Outcome = {
  ok: <T>(value: T): Ok<T> => ({ kind: 'Ok', value }),
  fail: <E extends string>(kind: E): Fail<E> => ({ kind }),
  err: (error: BaseException): Err => ({ kind: 'Err', error })
} as const

/**
 * Compile-time exhaustiveness guard for discriminated-union domain outcomes.
 * If a `switch` does not handle every variant, the value reaching here is not
 * `never` and this call fails to type-check. Makes domain outcomes *checkable*
 * (TS cannot force a caller to switch, so this is the bolt that compensates).
 */
export function assertNever(value: never): never {
  throw new BaseException({
    cause: `Unhandled variant: ${JSON.stringify(value)}`
  })
}
