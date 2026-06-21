import { readFile, writeFile } from 'node:fs/promises'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BaseException } from '../../src/errors/base.exception'
import { Pokemon } from '../../src/models/pokemon'
import { BoxFileRepository } from '../../src/repositories/box-file.repository'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn()
}))

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return new Pokemon({
    id: 1,
    name: 'bulbasaur',
    types: ['grass'],
    height: 7,
    weight: 69,
    ...overrides
  })
}

function enoent(): NodeJS.ErrnoException {
  const error = new Error('not found') as NodeJS.ErrnoException
  error.code = 'ENOENT'
  return error
}

// Read back what was persisted, decoupled from JSON key ordering / formatting.
function persistedBox(): unknown {
  expect(writeFileMock).toHaveBeenCalledTimes(1)
  const [path, contents, encoding] = writeFileMock.mock.calls[0]
  expect(path).toBe('pc_box.json')
  expect(encoding).toBe('utf-8')
  return JSON.parse(contents as string)
}

describe('BoxFileRepository', () => {
  let repository: BoxFileRepository

  beforeEach(() => {
    repository = new BoxFileRepository()
    writeFileMock.mockResolvedValue(undefined)
  })

  describe('list', () => {
    it('reads and parses the pokemon stored in pc_box.json', async () => {
      const stored = [
        makePokemon({ id: 4, name: 'charmander', types: ['fire'] })
      ]
      readFileMock.mockResolvedValue(JSON.stringify(stored))

      const result = await repository.list()

      expect(readFileMock).toHaveBeenCalledWith('pc_box.json', 'utf-8')
      expect(result).toEqual(stored)
    })

    it('returns an empty box when the file does not exist (ENOENT)', async () => {
      readFileMock.mockRejectedValue(enoent())

      const result = await repository.list()

      expect(result).toEqual([])
    })

    it('throws a BaseException when reading fails for a non-ENOENT reason', async () => {
      readFileMock.mockRejectedValue(new Error('EACCES'))

      await expect(repository.list()).rejects.toBeInstanceOf(BaseException)
    })

    it('throws a BaseException (ACL) when the stored JSON is not a pokemon array', async () => {
      readFileMock.mockResolvedValue(JSON.stringify([{ id: 'not a number' }]))

      await expect(repository.list()).rejects.toBeInstanceOf(BaseException)
    })

    it('throws a BaseException (ACL) when the file holds malformed JSON', async () => {
      readFileMock.mockResolvedValue('{ not json')

      await expect(repository.list()).rejects.toBeInstanceOf(BaseException)
    })
  })

  describe('addPokemon', () => {
    it('appends the pokemon to the existing box and persists it', async () => {
      const existing = makePokemon({ id: 1 })
      readFileMock.mockResolvedValue(JSON.stringify([existing]))
      const added = makePokemon({
        id: 25,
        name: 'pikachu',
        types: ['electric']
      })

      await repository.addPokemon(added)

      expect(persistedBox()).toEqual([{ ...existing }, { ...added }])
    })

    it('throws a BaseException when persisting fails', async () => {
      readFileMock.mockResolvedValue('[]')
      writeFileMock.mockRejectedValue(new Error('disk full'))

      await expect(repository.addPokemon(makePokemon())).rejects.toBeInstanceOf(
        BaseException
      )
    })
  })

  describe('removePokemon', () => {
    it('persists the box without the removed id', async () => {
      const keep = makePokemon({ id: 1 })
      const drop = makePokemon({ id: 25, name: 'pikachu' })
      readFileMock.mockResolvedValue(JSON.stringify([keep, drop]))

      await repository.removePokemon(25)

      expect(persistedBox()).toEqual([{ ...keep }])
    })

    it('persists the box unchanged when the id is not present', async () => {
      const keep = makePokemon({ id: 1 })
      readFileMock.mockResolvedValue(JSON.stringify([keep]))

      await repository.removePokemon(999)

      expect(persistedBox()).toEqual([{ ...keep }])
    })
  })
})
