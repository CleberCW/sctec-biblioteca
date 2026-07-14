import { ConsoleView } from './console.view'
import { Book } from '../models/Book'
import { BookService } from '../services/book.service'
import { BookListPage } from '../types/BookListPage'

export class BooksListView extends ConsoleView {
  private pageSize = 10

  private page = 1

  private bookListPage?: BookListPage

  constructor(private readonly bookService: BookService) {
    super()
  }

  private formatBooks(b: Book): string {
    return `#${String(b.id)} - ${b.name} | OpenLibraryID: ${b.openLibraryId} | Autor: ${String(b.authorId)} | Descrição: ${(b.description ?? 'Sem descrição').slice(0, 50)}.`
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Listar Livros ===')

    this.bookListPage = await this.bookService.getPage(this.page, this.pageSize)

    if (this.bookListPage.books.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      this.bookListPage.books.forEach((b) => {
        this.display(this.formatBooks(b))
      })
    }

    this.display('=========================')

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

    const hasPrevious = this.bookListPage.page < this.bookListPage.totalPages

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
