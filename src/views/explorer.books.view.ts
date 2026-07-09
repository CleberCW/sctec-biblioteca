import { ConsoleView } from './console.view'
import { Book } from '../models/Book'
import { BookService } from '../services/book.service'
import { BookListPage } from '../types/BookListPage'

export class BooksListView extends ConsoleView {
  private currentOffset = 0

  private pageSize = 10

  private bookListPage?: BookListPage

  constructor(private readonly bookService: BookService) {
    super()
  }

  private formatBooks(b: Book): string {
    return `#${String(b.id)} - ${b.name} | OpenLibraryID: ${b.openLibraryId} | Autor: ${String(b.authorId)} | Descrição: ${(b.description ?? 'Sem descrição').slice(0, 50)}.`
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Listar Livros ===')

    this.bookListPage = await this.bookService.getPage(
      this.pageSize,
      this.currentOffset
    )

    if (this.bookListPage.books.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      this.display('Foram encontrados os livros:')
      this.bookListPage.books.forEach((b) => {
        this.display(this.formatBooks(b))
      })
    }

    this.display('=========================')

    const hasPrev = this.bookListPage.page > 1
    const hasNext = this.bookListPage.page < this.bookListPage.totalPages

    const footer = [hasPrev ? '[P] Anterior' : '', hasNext ? '[N] Próxima' : '']
      .filter((s) => s !== '')
      .join(' | ')

    this.display(footer !== '' ? footer : 'Página única')
    this.display('[1] Selecionar  [2] Voltar')
  }

  private async handleNext(): Promise<void> {
    if (!this.bookListPage) return

    const hasNext = this.bookListPage.page < this.bookListPage.totalPages

    if (!hasNext) {
      this.display('Não há próxima página.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.currentOffset += this.pageSize

    this.bookListPage = await this.bookService.getPage(
      this.pageSize,
      this.currentOffset
    )

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

    this.currentOffset -= this.pageSize

    this.bookListPage = await this.bookService.getPage(
      this.pageSize,
      this.currentOffset
    )

    await this.renderPage()
  }

  protected async onExit(): Promise<void> {
    this.currentOffset = 0
    return super.onExit()
  }

  protected async update(): Promise<void> {
    await this.renderPage()

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'N':
        await this.handleNext()
        break
      case 'P':
        await this.handlePrevious()
        break
      case '1':
        break
      case '2':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
