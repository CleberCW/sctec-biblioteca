import { describe, expect, it } from 'vitest'

import { PokemonDetailValidator } from '../../../src/validators/poke-api/pokemon-detail.validator'

function validPayload(): unknown {
  return {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    types: [{ slot: 1, type: { name: 'grass', url: 'x' } }]
  }
}

describe('PokemonDetailValidator.isValid', () => {
  it('accepts a well-formed detail payload', () => {
    expect(PokemonDetailValidator.isValid(validPayload())).toBe(true)
  })

  it.each([null, undefined, 'string', 42])(
    'rejects non-object payloads: %s',
    (value) => {
      expect(PokemonDetailValidator.isValid(value)).toBe(false)
    }
  )

  it('rejects a payload with a wrong scalar type', () => {
    expect(PokemonDetailValidator.isValid({ ...validPayload(), id: '1' })).toBe(
      false
    )
  })

  it('rejects a payload whose types is not an array', () => {
    expect(
      PokemonDetailValidator.isValid({ ...validPayload(), types: 'grass' })
    ).toBe(false)
  })

  it('rejects a payload whose type entry is missing the nested type object', () => {
    expect(
      PokemonDetailValidator.isValid({
        ...validPayload(),
        types: [{ slot: 1 }]
      })
    ).toBe(false)
  })

  it('rejects a payload whose nested type is missing its name', () => {
    expect(
      PokemonDetailValidator.isValid({
        ...validPayload(),
        types: [{ slot: 1, type: { url: 'x' } }]
      })
    ).toBe(false)
  })
})
