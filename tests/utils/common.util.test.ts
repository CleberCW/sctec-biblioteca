import { describe, expect, it, vi } from 'vitest'

import { BaseException } from '../../src/errors/base.exception'
import { defer, parseJSON } from '../../src/utils/common.util'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

describe('parseJSON', () => {
  it('returns Ok with the parsed value when the JSON is valid and matches the guard', () => {
    const result = parseJSON('["a","b"]', isStringArray)

    expect(result.kind).toBe('Ok')
    // narrow via the discriminant before reading `value`
    if (result.kind === 'Ok') {
      expect(result.value).toEqual(['a', 'b'])
    }
  })

  it('returns an Err when the input is not a string', () => {
    const result = parseJSON({ not: 'a string' }, isStringArray)

    expect(result.kind).toBe('Err')
    if (result.kind === 'Err') {
      expect(result.error).toBeInstanceOf(BaseException)
      expect(result.error.message).toContain('non-string')
    }
  })

  it('returns an Err when the parsed value fails the guard', () => {
    const result = parseJSON('[1, 2, 3]', isStringArray)

    expect(result.kind).toBe('Err')
    if (result.kind === 'Err') {
      expect(result.error.message).toContain('type guard')
    }
  })

  it('returns an Err wrapping the thrown error when JSON.parse fails', () => {
    const result = parseJSON('{ invalid json', isStringArray)

    expect(result.kind).toBe('Err')
    if (result.kind === 'Err') {
      expect(result.error).toBeInstanceOf(BaseException)
      expect(result.error.message).toContain('JSON PARSE:')
    }
  })
})

describe('defer', () => {
  it('returns an object whose Symbol.dispose invokes the given function', () => {
    const fn = vi.fn()

    const disposable = defer(fn)

    expect(fn).not.toHaveBeenCalled()
    disposable[Symbol.dispose]()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('runs the deferred function at the end of a `using` block', () => {
    const fn = vi.fn()

    {
      using _ = defer(fn)
      expect(fn).not.toHaveBeenCalled()
    }

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
