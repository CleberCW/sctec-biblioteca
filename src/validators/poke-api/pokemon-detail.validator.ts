interface GetPokemonDetailResponse {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: { name: string; url: string } }[]
}

export class PokemonDetailValidator {
  static isValid(value: unknown): value is GetPokemonDetailResponse {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    const v = value as Record<string, unknown>

    const scalarsOk =
      typeof v.id === 'number' &&
      typeof v.name === 'string' &&
      typeof v.height === 'number' &&
      typeof v.weight === 'number'

    if (!scalarsOk || !Array.isArray(v.types)) {
      return false
    }

    return v.types.every((t: unknown) => {
      if (typeof t !== 'object' || t === null) {
        return false
      }

      const type = (t as Record<string, unknown>).type

      if (typeof type !== 'object' || type === null) {
        return false
      }

      return typeof (type as Record<string, unknown>).name === 'string'
    })
  }
}
