import { describe, expect, it } from 'vitest'

import { GetPokemonsValidator } from '../../../src/validators/poke-api/get-pokemon.validator'

function validPayload(): unknown {
  return {
    next: 'https://pokeapi.co/api/v2/pokemon?offset=40&limit=20',
    previous: null,
    count: 1302,
    results: [{ name: 'bulbasaur', url: 'x' }]
  }
}

describe('GetPokemonsValidator.isValid', () => {
  it('accepts a well-formed list payload', () => {
    expect(GetPokemonsValidator.isValid(validPayload())).toBe(true)
  })

  it('accepts null next/previous boundaries', () => {
    expect(
      GetPokemonsValidator.isValid({
        next: null,
        previous: null,
        count: 0,
        results: []
      })
    ).toBe(true)
  })

  it.each([null, undefined, 'string', 42, []])(
    'rejects non-object payloads: %s',
    (value) => {
      expect(GetPokemonsValidator.isValid(value)).toBe(false)
    }
  )

  it('rejects a payload with a non-string, non-null boundary', () => {
    expect(GetPokemonsValidator.isValid({ ...validPayload(), next: 42 })).toBe(
      false
    )
  })

  it('rejects a payload whose count is not a number', () => {
    expect(
      GetPokemonsValidator.isValid({ ...validPayload(), count: '1302' })
    ).toBe(false)
  })

  it('rejects a payload whose results is not an array', () => {
    expect(
      GetPokemonsValidator.isValid({ ...validPayload(), results: {} })
    ).toBe(false)
  })

  it('rejects a payload whose results contain a malformed entry', () => {
    expect(
      GetPokemonsValidator.isValid({
        ...validPayload(),
        results: [{ name: 'bulbasaur' }]
      })
    ).toBe(false)
  })
})
