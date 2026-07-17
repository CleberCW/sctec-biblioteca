import { ConsoleView } from './console.view'
import { Book } from '../models/Book'
import { BookService } from '../services/book.service'

export class BooksSearchView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly bookService: BookService) {
    super()
  }

  private async renderMenu(): Promise<void> {
    this.display('\n=== Buscar Livro ===\n')
    this.display('[1] Buscar por código de barras')
    this.display('[2] Buscar por título')
    this.display('[3] Buscar por autor')
    this.display('[4] Buscar por palavra-chave')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case '1': {
        const barcode = await this.prompt('Digite o código de barras: ')
        const result = await this.bookService.searchByBarcode(barcode)
        this.renderResults([result].filter((b): b is Book => b !== null))
        break
      }

      case '2': {
        const title = await this.prompt('Digite o título: ')
        const results = await this.bookService.searchByTitle(title)
        this.renderResults(results)
        break
      }
      case '3': {
        const author = await this.prompt('Digite o autor: ')
        const results = await this.bookService.searchByAuthor(author)
        this.renderResults(results)
        break
      }

      case '4': {
        const keyword = await this.prompt('Digite a palavra-chave: ')
        const results = await this.bookService.searchByKeyword(keyword)
        this.renderResults(results)
        break
      }

      case 'Q':
        this.exit()
        break

      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }

    await this.prompt('Pressione ENTER para continuar:')
  }

  private formatBooks(b: Book): string {
    return `#${String(b.id)} - ${b.name} | Barcode: ${b.barcode} | Autor: ${String(b.authorId)} | Descrição: ${(b.description ?? 'Sem descrição').slice(0, 50)}...`
  }

  private renderResults(results: Book[]): void {
    this.display('\n=== Resultado da Pesquisa ===')

    if (results.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      results.forEach((b) => {
        this.display(this.formatBooks(b))
      })
    }

    this.display('=========================')
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
