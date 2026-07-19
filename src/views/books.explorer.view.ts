import { ConsoleView } from './console.view'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'
import { BookListPage } from '../types/BookListPage'

export class BooksListView extends ConsoleView {
  private pageSize = 20

  private page = 1

  private bookListPage?: BookListPage

  constructor(private readonly bookService: BookService) {
    super()
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

  private async renderPage(): Promise<void> {
    this.display(this.header)
    this.display('='.repeat(this.header.length))
    this.bookListPage = await this.bookService.getPage(this.page, this.pageSize)

    if (this.bookListPage.books.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      this.bookListPage.books.forEach((b) => {
        this.display(this.formatBooks(b))
      })
    }

    this.display(this.header)

    const hasPrev = this.bookListPage.page > 1
    const hasNext = this.bookListPage.page < this.bookListPage.totalPages

    const footer = [hasPrev ? '[A] Anterior' : '', hasNext ? '[S] Próxima' : '']
      .filter((s) => s !== '')
      .join(' | ')

    this.display(footer !== '' ? footer : 'Página única')
    this.display('[C] Selecionar  [Q] Voltar')
  }

  private async handleNext(): Promise<void> {
    if (!this.bookListPage) return

    const hasNext = this.bookListPage.page < this.bookListPage.totalPages

    if (!hasNext) {
      this.display('Não há próxima página.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.page++

    this.bookListPage = await this.bookService.getPage(this.page, this.pageSize)

    await this.renderPage()
  }

  private async handlePrevious(): Promise<void> {
    if (!this.bookListPage) return

    const hasPrevious = this.bookListPage.page > 1

    if (!hasPrevious) {
      this.display('Não há página amterior.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.page--

    this.bookListPage = await this.bookService.getPage(this.page, this.pageSize)

    await this.renderPage()
  }

  protected async onExit(): Promise<void> {
    this.page = 1
    return super.onExit()
  }

  protected async update(): Promise<void> {
    await this.renderPage()

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'S':
        await this.handleNext()
        break
      case 'A':
        await this.handlePrevious()
        break
      case 'C':
        break
      case 'Q':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
