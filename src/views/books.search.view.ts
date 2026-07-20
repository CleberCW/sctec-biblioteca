import { ConsoleView } from './console.view'
import { BaseException } from '../errors/base.exception'
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

  private async executeSearch(
    action: () => Promise<BookSearchResult[] | null>
  ): Promise<void> {
    try {
      const results = await action()
      if (!results) {
        this.display('Input inválido')
        await this.prompt('Pressione ENTER para continuar:')
        return
      }
      await this.renderResults(results)
    } catch (err) {
      if (err instanceof BaseException) {
        this.display(err.message)
        await this.prompt('Pressione ENTER para continuar:')
        return
      }

      throw err
    }
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
      case '1':
        await this.executeSearch(async () => {
          const isbn = (await this.prompt('Digite o ISBN: ')).trim()
          return this.bookService.searchByIsbn(isbn)
        })
        break

      case '2': {
        await this.executeSearch(async () => {
          const title = (await this.prompt('Digite o título do livro: ')).trim()
          return this.bookService.searchByTitle(title)
        })
        break
      }
      case '3':
        await this.executeSearch(async () => {
          const author = (await this.prompt('Digite o autor: ')).trim()
          return this.bookService.searchByAuthor(author)
        })
        break

      case '4':
        await this.executeSearch(async () => {
          const keyword = (await this.prompt('Digite a palavra-chave: ')).trim()
          return this.bookService.searchByKeyword(keyword)
        })
        break

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
      b.status.slice(0, 20).padEnd(20),
      b.author.slice(0, 20).padEnd(20),
      (b.description ?? 'Sem descrição').slice(0, 50).padEnd(50),
      (b.tags ?? 'N/A').slice(0, 50).padEnd(50)
    ].join(' | ')
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Título'.padEnd(60),
    'ISBN'.padEnd(20),
    'Status'.padEnd(20),
    'Autor'.padEnd(20),
    'Descrição'.padEnd(50),
    'Tags'.padEnd(50)
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
