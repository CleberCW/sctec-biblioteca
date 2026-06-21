import { HttpClientError } from '../@common/http/http-client.error'
import { HttpService } from '../@common/http/http.service'
import { Result } from '../@common/result/result'
import { PokemonSliceDto } from '../dtos/pokemon-slice.dto'
import { BaseException } from '../errors/base.exception'
import { Pokemon } from '../models/pokemon'
import {
  GetPokemonsResponse,
  GetPokemonsValidator
} from '../validators/poke-api/get-pokemon.validator'
import { PokemonDetailValidator } from '../validators/poke-api/pokemon-detail.validator'

export class PokeApiService {
  constructor(private readonly httpService: HttpService) {}

  private getSliceBoundaries(response: GetPokemonsResponse) {
    const nextOffset = response.next
      ? new URL(response.next).searchParams.get('offset')
      : null

    const previousOffset = response.previous
      ? new URL(response.previous).searchParams.get('offset')
      : null

    return {
      next: nextOffset !== null ? { offset: Number(nextOffset) } : null,
      previous:
        previousOffset !== null ? { offset: Number(previousOffset) } : null
    }
  }

  async getPokemons(offset?: number, limit = 20): Promise<PokemonSliceDto> {
    const resolvedOffset = offset ?? 0
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${String(limit)}&offset=${String(resolvedOffset)}`

    const response = await this.httpService
      .get<unknown>(url)
      .catch((e: unknown) => e as HttpClientError)

    if (HttpClientError.isError(response)) {
      // Traduz para domínio pois é a fronteira mais próxima e a que sabe o que o erro significa. O domínio (e suas fronteiras próximas) tem como se recuperar desse erro? Não, então joga
      throw BaseException.fromError(response)
    }

    if (!GetPokemonsValidator.isValid(response.data)) {
      throw new BaseException({
        cause: response.data,
        messagePrefix: 'POKEAPI CONTRACT (list): resposta inesperada. '
      })
    }

    const data = response.data

    return new PokemonSliceDto({
      ...this.getSliceBoundaries(data),
      results: data.results.map((result) => ({
        name: result.name
      }))
    })
  }

  async getPokemonDetail(
    nameOrId: string
  ): Promise<Result<Pokemon, 'not-found'>> {
    const encoded = encodeURIComponent(nameOrId.trim().toLowerCase())
    const url = `https://pokeapi.co/api/v2/pokemon/${encoded}`

    const response = await this.httpService
      .get<unknown>(url)
      .catch((e: unknown) => e as HttpClientError)

    if (HttpClientError.isError(response)) {
      if (response.status === 404) {
        return Result.fail('not-found')
      }

      throw BaseException.fromError(response)
    }

    if (!PokemonDetailValidator.isValid(response.data)) {
      throw new BaseException({
        cause: response.data,
        messagePrefix: 'POKEAPI CONTRACT (detail): resposta inesperada. '
      })
    }

    const data = response.data

    return Result.ok(
      new Pokemon({
        id: data.id,
        name: data.name,
        height: data.height,
        weight: data.weight,
        types: data.types.map((t) => t.type.name)
      })
    )
  }
}
