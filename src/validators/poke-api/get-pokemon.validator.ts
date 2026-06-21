export interface GetPokemonsResponse {
  next: string | null
  previous: string | null
  count: number
  results: { name: string; url: string }[]
}
export class GetPokemonsValidator {
  static isValid(value: unknown): value is GetPokemonsResponse {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    const v = value as Record<string, unknown>

    const boundariesOk =
      (v.next === null || typeof v.next === 'string') &&
      (v.previous === null || typeof v.previous === 'string') &&
      typeof v.count === 'number'

    if (!boundariesOk || !Array.isArray(v.results)) {
      return false
    }

    return v.results.every((r: unknown) => {
      if (typeof r !== 'object' || r === null) {
        return false
      }

      const item = r as Record<string, unknown>

      return typeof item.name === 'string' && typeof item.url === 'string'
    })
  }
}
