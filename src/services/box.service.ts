import { Result } from '../@common/result/result'
import { Pokemon } from '../models/pokemon'
import { BoxRepository } from '../repositories/domain/box.repository'

export class BoxService {
  constructor(private readonly boxRepository: BoxRepository) {}

  async list(): Promise<Pokemon[]> {
    return this.boxRepository.list()
  }

  async add(pokemon: Pokemon): Promise<Result<void, 'duplicate'>> {
    const box = await this.boxRepository.list()

    const isDuplicate = box.some((p) => p.id === pokemon.id)

    if (isDuplicate) {
      return Result.fail('duplicate')
    }

    await this.boxRepository.addPokemon(pokemon)

    return Result.void()
  }

  async remove(id: number): Promise<Result<void, 'not-found'>> {
    const box = await this.boxRepository.list()

    const exists = box.some((p) => p.id === id)

    if (!exists) {
      return Result.fail('not-found')
    }

    await this.boxRepository.removePokemon(id)

    return Result.void()
  }

  async filter(criteria: { type?: string; name?: string }): Promise<Pokemon[]> {
    const box = await this.boxRepository.list()

    const { type, name } = criteria

    return box.filter((p) => {
      const typeMatch =
        type === undefined || p.types.some((t) => t === type.toLowerCase())

      const nameMatch =
        name === undefined || p.name.includes(name.toLowerCase())

      return typeMatch && nameMatch
    })
  }
}
