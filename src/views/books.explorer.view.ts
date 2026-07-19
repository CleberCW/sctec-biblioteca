import { PaginatedConsoleView } from './paginated.view'
import { ViewFactory } from '../factories/view.factories'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'
import { BookListPage } from '../types/BookListPage'

export class BooksListView extends PaginatedConsoleView<
  BookSearchResult,
  BookListPage
> {
  constructor(
    private readonly bookService: BookService,
    private readonly viewFactory: ViewFactory
  ) {
    super()
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Title'.padEnd(60),
    'Barcode'.padEnd(20),
    'Author'.padEnd(20),
    'Description'.padEnd(50),
    'Tags'.padEnd(50)
  ].join(' | ')

  protected override async fetchPage(
    page: number,
    pageSize: number
  ): Promise<BookListPage> {
    return this.bookService.getPage(page, pageSize)
  }

  protected override getItems(page: BookListPage): BookSearchResult[] {
    return page.books
  }

  protected override getCurrentPage(page: BookListPage): number {
    return page.page
  }

  protected override getTotalPages(page: BookListPage): number {
    return page.totalPages
  }

  protected override formatItem(book: BookSearchResult): string {
    return [
      String(book.id).padEnd(6),
      book.title.slice(0, 60).padEnd(60),
      (book.isbn ?? 'Sem ISBN').padEnd(20),
      book.author.slice(0, 20).padEnd(20),
      (book.description ?? 'Sem descrição').slice(0, 50).padEnd(50),
      (book.tags ?? 'Sem tags').slice(0, 50).padEnd(50)
    ].join(' | ')
  }

  protected override getHeader(): string {
    return this.header
  }

  protected override renderFooter(
    hasPrevious: boolean,
    hasNext: boolean
  ): void {
    const footer = [
      hasPrevious ? '[A] Anterior' : '',
      hasNext ? '[S] Próxima' : ''
    ]
      .filter(Boolean)
      .join(' | ')

    this.display(footer || 'Página única')
    this.display('[C] Selecionar  [Q] Voltar')
  }

  protected async handleCustomOption(option: string): Promise<void> {
    if (option === 'C') {
      await this.selectBook()
    }
  }

  private async selectBook(): Promise<void> {
    const input = await this.prompt(
      'Digite o ID do livro ou pressione Q para voltar: '
    )

    if (input.trim().toUpperCase() === 'Q' || input === '') {
      return
    }

    const id = Number(input)

    if (Number.isNaN(id)) {
      this.display('ID inválido.')
      return
    }

    const book = await this.bookService.searchById(id)

    if (!book) {
      this.display('Livro não encontrado.')
      return
    }

    await this.viewFactory.createSelectBooksView(book).start()
  }
}
