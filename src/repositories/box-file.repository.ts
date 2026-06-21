import { readFile, writeFile } from 'node:fs/promises'

import { BaseException } from '../errors/base.exception'
import { Pokemon } from '../models/pokemon'
import { parseJSON } from '../utils/common.util'
import { BoxRepository } from './domain/box.repository'

function isPokemonArray(value: unknown): value is Pokemon[] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return false
    }

    const v = item as Record<string, unknown>

    return (
      typeof v.id === 'number' &&
      typeof v.name === 'string' &&
      Array.isArray(v.types) &&
      (v.types as unknown[]).every((t) => typeof t === 'string') &&
      typeof v.height === 'number' &&
      typeof v.weight === 'number'
    )
  })
}

export class BoxFileRepository implements BoxRepository {
  private async readBox(): Promise<string> {
    try {
      return await readFile('pc_box.json', 'utf-8')
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return '[]'
      }
      throw BaseException.fromUnknown(error, {
        messagePrefix: 'READ PC_BOX.JSON: '
      })
    }
  }

  private async writeBox(box: Pokemon[]): Promise<void> {
    try {
      await writeFile('pc_box.json', JSON.stringify(box), 'utf-8')
    } catch (error) {
      throw BaseException.fromUnknown(error, {
        messagePrefix: 'WRITE PC_BOX.JSON: '
      })
    }
  }

  private async getBox(): Promise<Pokemon[]> {
    const box = await this.readBox()

    const result = parseJSON<Pokemon[]>(box, isPokemonArray)

    if (result.kind === 'Err') {
      throw result.error
    }

    return result.value
  }

  async list(): Promise<Pokemon[]> {
    return this.getBox()
  }

  async addPokemon(pokemon: Pokemon): Promise<void> {
    const box = await this.getBox()

    box.push(pokemon)

    await this.writeBox(box)
  }

  async removePokemon(id: number): Promise<void> {
    const box = await this.getBox()

    const filtered = box.filter((p) => p.id !== id)

    await this.writeBox(filtered)
  }
}
