import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoggerUtil } from '../../src/utils/logger.util'

describe('LoggerUtil.error', () => {
  const originalDebug = process.env.DEBUG

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalDebug === undefined) {
      delete process.env.DEBUG
    } else {
      process.env.DEBUG = originalDebug
    }
  })

  it('does not write to stderr when DEBUG is unset', () => {
    delete process.env.DEBUG

    LoggerUtil.error(new Error('boom'))

    expect(console.error).not.toHaveBeenCalled()
  })

  it('writes the error to stderr when DEBUG is set', () => {
    process.env.DEBUG = '1'
    const error = new Error('boom')

    LoggerUtil.error(error)

    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(error)
  })
})
