import { PokeApiService } from '../services/poke-api.service'

export class PokeApiController {
  constructor(private readonly pokeApiService: PokeApiService) {}

  getPokemons(offset?: number) {
    return this.pokeApiService.getPokemons(offset)
  }

  catchPokemon(nameOrId: string) {
    return this.pokeApiService.getPokemonDetail(nameOrId)
  }
}
