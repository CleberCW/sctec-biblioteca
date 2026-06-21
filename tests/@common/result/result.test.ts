import { describe, expect, it } from 'vitest'

import { assertNever, Outcome, Result } from '../../../src/@common/result/result'
import { BaseException } from '../../../src/errors/base.exception'

describe('Result', () => {
  it('ok wraps a value under the Ok discriminant', () => {
    expect(Result.ok(42)).toEqual({ kind: 'Ok', value: 42 })
  })

  it('void produces an Ok carrying undefined', () => {
    expect(Result.void()).toEqual({ kind: 'Ok', value: undefined })
  })

  it('fail produces a bare domain discriminant with no value', () => {
    const failure = Result.fail('not-found')

    expect(failure).toEqual({ kind: 'not-found' })
    expect('value' in failure).toBe(false)
  })
})

describe('Outcome', () => {
  it('ok and fail mirror Result', () => {
    expect(Outcome.ok('x')).toEqual({ kind: 'Ok', value: 'x' })
    expect(Outcome.fail('duplicate')).toEqual({ kind: 'duplicate' })
  })

  it('err carries a BaseException under the dedicated Err channel', () => {
    const error = new BaseException({ cause: 'boom' })

    const outcome = Outcome.err(error)

    expect(outcome).toEqual({ kind: 'Err', error })
  })
})

describe('assertNever', () => {
  it('throws a BaseException describing the unhandled variant', () => {
    // Cast through unknown: the whole point is to exercise the runtime guard
    // that compensates for a non-exhaustive switch reaching this call.
    const stray = { kind: 'surprise' } as unknown as never

    expect(() => assertNever(stray)).toThrow(BaseException)
    expect(() => assertNever(stray)).toThrow(/surprise/)
  })
})
