import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Pokemon } from '../../src/models/pokemon'
import { BoxRepository } from '../../src/repositories/domain/box.repository'
import { BoxService } from '../../src/services/box.service'

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return new Pokemon({
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    height: 7,
    weight: 69,
    ...overrides
  })
}

function makeRepository(box: Pokemon[]): BoxRepository {
  return {
    list: vi.fn().mockResolvedValue(box),
    addPokemon: vi.fn().mockResolvedValue(undefined),
    removePokemon: vi.fn().mockResolvedValue(undefined)
  }
}

describe('BoxService', () => {
  describe('list', () => {
    it('delegates to the repository and returns its result', async () => {
      const box = [makePokemon()]
      const repository = makeRepository(box)
      const service = new BoxService(repository)

      const result = await service.list()

      expect(result).toBe(box)
      expect(repository.list).toHaveBeenCalledTimes(1)
    })
  })

  describe('add', () => {
    it('adds the pokemon and returns Ok when it is not already in the box', async () => {
      const repository = makeRepository([])
      const service = new BoxService(repository)
      const pokemon = makePokemon()

      const result = await service.add(pokemon)

      expect(result).toEqual({ kind: 'Ok', value: undefined })
      expect(repository.addPokemon).toHaveBeenCalledWith(pokemon)
    })

    it('returns a "duplicate" failure and does not write when the id already exists', async () => {
      const existing = makePokemon({ id: 25, name: 'pikachu' })
      const repository = makeRepository([existing])
      const service = new BoxService(repository)

      const result = await service.add(makePokemon({ id: 25, name: 'pikachu' }))

      expect(result).toEqual({ kind: 'duplicate' })
      expect(repository.addPokemon).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('removes the pokemon and returns Ok when the id exists', async () => {
      const repository = makeRepository([makePokemon({ id: 7 })])
      const service = new BoxService(repository)

      const result = await service.remove(7)

      expect(result).toEqual({ kind: 'Ok', value: undefined })
      expect(repository.removePokemon).toHaveBeenCalledWith(7)
    })

    it('returns a "not-found" failure and does not write when the id is absent', async () => {
      const repository = makeRepository([makePokemon({ id: 7 })])
      const service = new BoxService(repository)

      const result = await service.remove(999)

      expect(result).toEqual({ kind: 'not-found' })
      expect(repository.removePokemon).not.toHaveBeenCalled()
    })
  })

  describe('filter', () => {
    let service: BoxService

    beforeEach(() => {
      const box = [
        makePokemon({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] }),
        makePokemon({ id: 4, name: 'charmander', types: ['fire'] }),
        makePokemon({ id: 7, name: 'squirtle', types: ['water'] })
      ]
      service = new BoxService(makeRepository(box))
    })

    it('returns the whole box when no criteria are given', async () => {
      const result = await service.filter({})

      expect(result.map((p) => p.name)).toEqual([
        'bulbasaur',
        'charmander',
        'squirtle'
      ])
    })

    it('filters by type case-insensitively', async () => {
      const result = await service.filter({ type: 'FIRE' })

      expect(result.map((p) => p.name)).toEqual(['charmander'])
    })

    it('matches a type exactly, not as a substring', async () => {
      // "fir" must NOT match the "fire" type — type comparison is equality.
      const result = await service.filter({ type: 'fir' })

      expect(result).toEqual([])
    })

    it('filters by name as a case-insensitive substring match', async () => {
      const result = await service.filter({ name: 'SAUR' })

      expect(result.map((p) => p.name)).toEqual(['bulbasaur'])
    })

    it('applies type and name criteria together (AND semantics)', async () => {
      const result = await service.filter({ type: 'water', name: 'squi' })

      expect(result.map((p) => p.name)).toEqual(['squirtle'])
    })

    it('returns an empty array when the AND criteria cannot both hold', async () => {
      const result = await service.filter({ type: 'water', name: 'char' })

      expect(result).toEqual([])
    })
  })
})
