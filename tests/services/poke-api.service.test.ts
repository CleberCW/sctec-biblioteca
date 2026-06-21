import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpClientError } from '../../src/@common/http/http-client.error'
import { HttpResponse, HttpService } from '../../src/@common/http/http.service'
import { BaseException } from '../../src/errors/base.exception'
import { Pokemon } from '../../src/models/pokemon'
import { PokeApiService } from '../../src/services/poke-api.service'

function makeHttpService(): HttpService {
  return {
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}

function okResponse<T>(data: T): HttpResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    requestOptions: { url: '', method: 'GET' }
  }
}

describe('PokeApiService', () => {
  let httpService: HttpService
  let service: PokeApiService

  beforeEach(() => {
    httpService = makeHttpService()
    service = new PokeApiService(httpService)
  })

  describe('getPokemons', () => {
    it('defaults offset to 0 and uses limit 20 in the request URL', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({ next: null, previous: null, count: 0, results: [] })
      )

      await service.getPokemons()

      expect(httpService.get).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon?limit=20&offset=0'
      )
    })

    it('maps results to names and derives next/previous offsets from the URLs', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({
          next: 'https://pokeapi.co/api/v2/pokemon?offset=40&limit=20',
          previous: 'https://pokeapi.co/api/v2/pokemon?offset=0&limit=20',
          count: 1302,
          results: [
            { name: 'bulbasaur', url: 'x' },
            { name: 'ivysaur', url: 'y' }
          ]
        })
      )

      const slice = await service.getPokemons(20)

      expect(slice.results).toEqual([{ name: 'bulbasaur' }, { name: 'ivysaur' }])
      expect(slice.next).toEqual({ offset: 40 })
      expect(slice.previous).toEqual({ offset: 0 })
    })

    it('returns null boundaries when next/previous are null', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({ next: null, previous: null, count: 0, results: [] })
      )

      const slice = await service.getPokemons()

      expect(slice.next).toBeNull()
      expect(slice.previous).toBeNull()
    })

    it('throws a BaseException when the HTTP call fails', async () => {
      vi.mocked(httpService.get).mockRejectedValue(
        new HttpClientError({ error: 'network', requestFired: false })
      )

      await expect(service.getPokemons()).rejects.toBeInstanceOf(BaseException)
    })

    it('rejects (ACL) a payload missing the top-level contract fields', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({ unexpected: true })
      )

      await expect(service.getPokemons()).rejects.toThrow(/CONTRACT \(list\)/)
    })

    it('rejects (ACL) a payload whose results contain a malformed item', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({
          next: null,
          previous: null,
          count: 1,
          results: [{ name: 'bulbasaur' /* missing url */ }]
        })
      )

      await expect(service.getPokemons()).rejects.toThrow(/CONTRACT \(list\)/)
    })
  })

  describe('getPokemonDetail', () => {
    const detailPayload = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      types: [
        { slot: 1, type: { name: 'grass', url: 'x' } },
        { slot: 2, type: { name: 'poison', url: 'y' } }
      ]
    }

    it('normalizes the input and requests the encoded name/id', async () => {
      vi.mocked(httpService.get).mockResolvedValue(okResponse(detailPayload))

      await service.getPokemonDetail('  Bulbasaur  ')

      expect(httpService.get).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon/bulbasaur'
      )
    })

    it('returns Ok with a Pokemon built from the payload', async () => {
      vi.mocked(httpService.get).mockResolvedValue(okResponse(detailPayload))

      const result = await service.getPokemonDetail('bulbasaur')

      expect(result.kind).toBe('Ok')
      if (result.kind === 'Ok') {
        expect(result.value).toBeInstanceOf(Pokemon)
        expect(result.value).toEqual(
          new Pokemon({
            id: 1,
            name: 'bulbasaur',
            height: 7,
            weight: 69,
            types: ['grass', 'poison']
          })
        )
      }
    })

    it('returns a "not-found" failure on a 404 response', async () => {
      vi.mocked(httpService.get).mockRejectedValue(
        new HttpClientError({
          error: 'not found',
          status: 404,
          requestFired: true
        })
      )

      const result = await service.getPokemonDetail('missingno')

      expect(result).toEqual({ kind: 'not-found' })
    })

    it('throws a BaseException on a non-404 HTTP failure', async () => {
      vi.mocked(httpService.get).mockRejectedValue(
        new HttpClientError({ error: 'server', status: 500, requestFired: true })
      )

      await expect(service.getPokemonDetail('bulbasaur')).rejects.toBeInstanceOf(
        BaseException
      )
    })

    it('rejects (ACL) a payload with the wrong scalar types', async () => {
      vi.mocked(httpService.get).mockResolvedValue(okResponse({ id: 'nope' }))

      await expect(service.getPokemonDetail('bulbasaur')).rejects.toThrow(
        /CONTRACT \(detail\)/
      )
    })

    it('rejects (ACL) a payload whose types entry is missing type.name', async () => {
      vi.mocked(httpService.get).mockResolvedValue(
        okResponse({
          id: 1,
          name: 'bulbasaur',
          height: 7,
          weight: 69,
          types: [{ slot: 1, type: { url: 'x' /* missing name */ } }]
        })
      )

      await expect(service.getPokemonDetail('bulbasaur')).rejects.toThrow(
        /CONTRACT \(detail\)/
      )
    })
  })
})
