import { ConsoleView } from './console.view'
import { assertNever } from '../@common/result/result'
import { BoxController } from '../controllers/box.controller'
import { PokeApiController } from '../controllers/poke-api.controller'
import { PokemonSliceDto } from '../dtos/pokemon-slice.dto'
import { FatalViewException } from '../errors/fatal-view.exception'
import { Pokemon } from '../models/pokemon'

export class ExploreView extends ConsoleView {
  private currentOffset = 0

  private slice = new PokemonSliceDto({
    next: { offset: 0 },
    previous: null,
    results: []
  })

  constructor(
    private readonly pokeApiController: PokeApiController,
    private readonly boxController: BoxController
  ) {
    super()
  }

  private renderPage(): void {
    this.display('\n=== Explorar Pokémons ===')

    this.slice.results.forEach((r, i) => {
      this.display(`${String(i + 1 + this.currentOffset)}. ${r.name}`)
    })

    this.display('=========================')

    const hasPrev = this.slice.previous !== null
    const hasNext = this.slice.next !== null

    const footer = [hasPrev ? '[P] Anterior' : '', hasNext ? '[N] Próxima' : '']
      .filter((s) => s !== '')
      .join(' | ')

    this.display(footer !== '' ? footer : 'Página única')
    this.display('[C] Capturar  [B] Voltar')
  }

  private async handleNext(): Promise<void> {
    if (this.slice.next === null) {
      this.display('Não há próxima página.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    const nextOffset = this.slice.next.offset
    const result = await this.pokeApiController
      .getPokemons(nextOffset)
      .catch((e: unknown) => e as Error)

    // TODO: O meu pensamento aqui é. Aqui é a view, ela não possui regra de domínio. Erros só importam se o domínio precisa agir neles, o resto pode ser decidido por contrato de API com documentação de códigos de erro. Tipos exaustivos são inúteis fora do domínio pois geralmente os sistemas são distribuídos e conversam através de algum tipo de serialização. A view é inteiramente responsável por garantir que ela não colapse seja qual for o erro jogado pelo controller. As camadas abaixo dele só deveriam se preocupar se o domínio tem algo a dizer sobre o Erro. Ou não? O try catch é feio mas isso é problema da view, envelopar com .catch no final da chamada não é tão mais custoso do que o switch case exaustivo
    if (result instanceof Error) {
      this.reportTechnicalError(result, 'Falha ao carregar a página anterior.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.currentOffset = nextOffset
    this.slice = result
  }

  private async handlePrevious(): Promise<void> {
    if (this.slice.previous === null) {
      this.display('Não há página anterior.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    const prevOffset = this.slice.previous.offset
    const result = await this.pokeApiController
      .getPokemons(prevOffset)
      .catch((e: unknown) => e as Error)

    if (result instanceof Error) {
      this.reportTechnicalError(result, 'Falha ao carregar a página anterior.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.currentOffset = prevOffset
    this.slice = result
  }

  private async handleCatch(): Promise<void> {
    const input = await this.prompt('Nome ou id do Pokémon: ')

    const catchResult = await this.pokeApiController.catchPokemon(input.trim())

    switch (catchResult.kind) {
      case 'Ok':
        await this.addToBox(catchResult.value)
        break
      case 'not-found':
        this.display('Pokémon não encontrado.')
        break
      default:
        assertNever(catchResult)
    }

    await this.prompt('Pressione ENTER para continuar:')
  }

  private async addToBox(pokemon: Pokemon): Promise<void> {
    const addResult = await this.boxController.add(pokemon)

    const kind = addResult.kind
    switch (kind) {
      case 'Ok':
        this.display(`${pokemon.name} capturado!`)
        break
      case 'duplicate':
        this.display(`${pokemon.name} já está na box.`)
        break
      default:
        assertNever(kind)
    }

    await this.prompt('Pressione ENTER para continuar:')
  }

  protected async onEnter(): Promise<void> {
    await super.onEnter()

    const result = await this.pokeApiController
      .getPokemons(this.currentOffset)
      .catch((e: unknown) => e)

    if (!(result instanceof PokemonSliceDto)) {
      throw new FatalViewException('Erro ao carregar a lista de pokemons')
    }

    this.slice = result
  }

  protected async onExit(): Promise<void> {
    this.currentOffset = 0
    return super.onExit()
  }

  protected async update(): Promise<void> {
    this.renderPage()

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'N':
        await this.handleNext()
        break
      case 'P':
        await this.handlePrevious()
        break
      case 'C':
        await this.handleCatch()
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
