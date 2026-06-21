import { Outcome } from '../@common/result/result'
import { BaseException } from '../errors/base.exception'

export function parseJSON<T>(
  json: unknown,
  guard: (value: unknown) => value is T
): Outcome<T> {
  try {
    if (typeof json !== 'string') {
      return Outcome.err(
        new BaseException({
          cause: 'JSON PARSE ERROR: Cannot parse a non-string'
        })
      )
    }

    const parsed: unknown = JSON.parse(json)

    if (!guard(parsed)) {
      return Outcome.err(
        new BaseException({
          cause: 'JSON PARSE ERROR: parsed value failed the type guard'
        })
      )
    }

    return Outcome.ok(parsed)
  } catch (error) {
    return Outcome.err(
      BaseException.fromUnknown(error, { messagePrefix: 'JSON PARSE: ' })
    )
  }
}

export function defer(fn: () => void) {
  return {
    [Symbol.dispose]: fn
  }
}
