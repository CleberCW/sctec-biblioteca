import { Pokemon } from '../models/pokemon'
import { BoxService } from '../services/box.service'

export class BoxController {
  constructor(private readonly boxService: BoxService) {}

  list() {
    return this.boxService.list()
  }

  add(pokemon: Pokemon) {
    return this.boxService.add(pokemon)
  }

  remove(id: number) {
    return this.boxService.remove(id)
  }

  filter(criteria: { type?: string; name?: string }) {
    return this.boxService.filter(criteria)
  }
}
