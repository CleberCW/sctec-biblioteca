import { ConsoleView } from './console.view'
import { assertNever } from '../@common/result/result'
import { BoxController } from '../controllers/box.controller'
import { Pokemon } from '../models/pokemon'

export class BoxView extends ConsoleView {
  constructor(private readonly boxController: BoxController) {
    super()
  }

  private formatPokemon(p: Pokemon): string {
    return `#${String(p.id)} - ${p.name} | Tipos: ${p.types.join(', ')} | Altura: ${String(p.height)} | Peso: ${String(p.weight)}`
  }

  private buildTypeTally(pokemons: Pokemon[]): string {
    const tally = pokemons.reduce<Record<string, number>>((acc, p) => {
      p.types.forEach((t) => {
        acc[t] = (acc[t] ?? 0) + 1
      })

      return acc
    }, {})

    const entries = Object.entries(tally)

    if (entries.length === 0) {
      return 'Tipos na box: (vazia)'
    }

    const summary = entries
      .map(([type, count]) => `${type}: ${String(count)}`)
      .join(' | ')

    return `Tipos na box: ${summary}`
  }

  private async handleList(): Promise<void> {
    const result = await this.boxController.list()

    this.display(this.buildTypeTally(result))
    this.display('=================================================')

    if (result.length === 0) {
      this.display('Nenhum Pokémon capturado.')
    } else {
      result.forEach((p) => {
        this.display(this.formatPokemon(p))
      })
    }

    this.display('=================================================')
    await this.prompt('Pressione ENTER para continuar:')
  }

  private async handleFree(): Promise<void> {
    const input = await this.prompt('Digite o id do Pokémon a liberar: ')
    const id = Number(input)

    if (!Number.isFinite(id) || !Number.isInteger(id)) {
      this.display('Id inválido.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    const result = await this.boxController.remove(id)

    switch (result.kind) {
      case 'Ok':
        await this.prompt('Pressione ENTER para continuar:')
        break
      case 'not-found':
        this.display(`Pokémon #${String(id)} não está na box.`)
        await this.prompt('Pressione ENTER para continuar:')
        return
      default:
        assertNever(result)
    }
  }

  private async handleFilter(): Promise<void> {
    const typeInput = await this.prompt(
      'Filtrar por tipo (deixe vazio para ignorar): '
    )
    const nameInput = await this.prompt(
      'Filtrar por nome (deixe vazio para ignorar): '
    )

    const type = typeInput.trim() === '' ? undefined : typeInput.trim()
    const name = nameInput.trim() === '' ? undefined : nameInput.trim()

    const result = await this.boxController.filter({ type, name })

    this.display('=================================================')

    if (result.length === 0) {
      this.display('Nenhum resultado.')
    } else {
      result.forEach((p) => {
        this.display(this.formatPokemon(p))
      })
    }

    this.display('=================================================')
    await this.prompt('Pressione ENTER para continuar:')
  }

  protected async update(): Promise<void> {
    this.display('\n=== Gerenciar Box ===')
    this.display('L. Listar Pokémons')
    this.display('F. Liberar por id')
    this.display('T. Filtrar Pokémons')
    this.display('B. Voltar')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'L':
        await this.handleList()
        break
      case 'F':
        await this.handleFree()
        break
      case 'T':
        await this.handleFilter()
        break
      case 'B':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
