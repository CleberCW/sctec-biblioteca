import { Pokemon } from '../../models/pokemon'

export interface BoxRepository {
  list(): Promise<Pokemon[]>
  addPokemon(pokemon: Pokemon): Promise<void>
  removePokemon(id: number): Promise<void>
}
