import { ConsoleView } from './console.view'
import { ViewFactory } from '../factories/view.factories'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'

export class BooksSearchView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly bookService: BookService,
    private readonly viewFactory: ViewFactory
  ) {
    super()
  }

  private async renderMenu(): Promise<void> {
    this.display('\n=== Buscar Livro ===\n')
    this.display('[1] Buscar por ISBN')
    this.display('[2] Buscar por título')
    this.display('[3] Buscar por autor')
    this.display('[4] Buscar por palavra-chave')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case '1': {
        const isbn = await this.prompt('Digite o ISBN: ')
        const results = await this.bookService.searchByIsbn(isbn)
        await this.renderResults(results)
        break
      }

      case '2': {
        const title = await this.prompt('Digite o título: ')
        const results = await this.bookService.searchByTitle(title)
        await this.renderResults(results)
        break
      }
      case '3': {
        const author = await this.prompt('Digite o autor: ')
        const results = await this.bookService.searchByAuthor(author)
        await this.renderResults(results)
        break
      }

      case '4': {
        const keyword = await this.prompt('Digite a palavra-chave: ')
        const results = await this.bookService.searchByKeyword(keyword)
        await this.renderResults(results)
        break
      }

      case 'Q':
        this.exit()
        break

      default:
        this.display('Opção inválida.')
    }
  }

  private formatBooks(b: BookSearchResult): string {
    return [
      String(b.id).padEnd(6),
      b.title.slice(0, 60).padEnd(60),
      (b.isbn ?? 'Sem ISBN').padEnd(20),
      b.author.slice(0, 20).padEnd(20),
      (b.description ?? 'Sem descrição').slice(0, 50).padEnd(50)
    ].join(' | ')
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Title'.padEnd(60),
    'Barcode'.padEnd(20),
    'Author'.padEnd(20),
    'Description'.padEnd(50)
  ].join(' | ')

  private center(text: string, width: number, fill = '='): string {
    const left = Math.floor((width - text.length) / 2)
    return text.padStart(left + text.length, fill).padEnd(width, fill)
  }

  private async renderResults(results: BookSearchResult[]): Promise<void> {
    this.display(this.center(' Resultado da pesquisa ', this.header.length))

    this.display(this.header)
    this.display('='.repeat(this.header.length))

    if (results.length === 0) {
      this.display('Nenhum livro encontrado.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    results.forEach((book) => {
      this.display(this.formatBooks(book))
    })

    for (;;) {
      const input = await this.prompt(
        '\nDigite o ID do livro ou Q para voltar: '
      )

      if (input === 'Q' || input === 'q' || input === '') {
        return
      }

      const id = Number(input)

      if (Number.isNaN(id)) {
        this.display('ID inválido.')
        continue
      }

      const book = results.find((b) => b.id === id)

      if (!book) {
        this.display('Livro não encontrado.')
        continue
      }

      this.exit()
      await this.viewFactory.createSelectBooksView(book).start()
      return
    }
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
