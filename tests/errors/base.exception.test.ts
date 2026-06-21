import { describe, expect, it } from 'vitest'

import { BaseException } from '../../src/errors/base.exception'

describe('BaseException', () => {
  it('is a real Error whose name matches the class', () => {
    const error = new BaseException({ cause: 'boom' })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('BaseException')
  })

  it('uses a string cause verbatim as the message', () => {
    const error = new BaseException({ cause: 'plain reason' })

    expect(error.message).toBe('plain reason')
  })

  it('prefixes the message when a messagePrefix is given', () => {
    const error = new BaseException({
      cause: 'reason',
      messagePrefix: 'CONTEXT: '
    })

    expect(error.message).toBe('CONTEXT: reason')
  })

  it('formats an Error cause as "Cause - <name>: <message>" and adopts its stack', () => {
    const cause = new Error('underlying')

    const error = new BaseException({ cause })

    expect(error.message).toBe('Cause - Error: underlying')
    expect(error.stack).toBe(cause.stack)
  })

  it('serializes an object cause as pretty JSON', () => {
    const error = new BaseException({ cause: { code: 418, teapot: true } })

    expect(error.message).toBe(JSON.stringify({ code: 418, teapot: true }, null, 2))
  })

  it('isError narrows only genuine BaseException instances', () => {
    expect(BaseException.isError(new BaseException({ cause: 'x' }))).toBe(true)
    expect(BaseException.isError(new Error('x'))).toBe(false)
    expect(BaseException.isError('x')).toBe(false)
  })

  it('fromError wraps an Error and keeps it as the cause', () => {
    const error = BaseException.fromError(new Error('down'), {
      messagePrefix: 'WRAPPED: '
    })

    expect(error).toBeInstanceOf(BaseException)
    expect(error.message).toBe('WRAPPED: Cause - Error: down')
  })

  it('fromUnknown accepts a non-Error value', () => {
    const error = BaseException.fromUnknown('weird', { messagePrefix: 'X: ' })

    expect(error.message).toBe('X: weird')
  })
})
