import { ConsoleView } from './console.view'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'
import { BookValidator } from '../validators/BookValidator'

export class BookEditView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly book: BookSearchResult,
    private readonly bookService: BookService
  ) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')

    console.log(this.book)

    const book: CreateBookInputDTO = {
      isbn: this.book.isbn ?? undefined,
      title: this.book.title,
      author: this.book.author,
      description: this.book.description ?? undefined,
      publish_year: this.book.publish_year ?? undefined,
      edition: this.book.edition ?? undefined,
      numPages: this.book.num_pages ?? undefined
    }

    book.isbn = await this.askIsbn(book.isbn)
    book.title = await this.askTitle(book.title)
    book.author = await this.askAuthor(book.author)
    book.description = await this.askDescription(book.description)
    book.publish_year = await this.askPublishYear(book.publish_year)
    book.edition = await this.askEdition(book.edition)
    book.numPages = await this.askNumPages(book.numPages)

    await this.confirmBook(book)
  }

  private async askIsbn(current?: string): Promise<string | undefined> {
    const input = (
      await this.prompt(`ISBN${current ? ` [${current}]` : ''} (opcional): `)
    ).trim()

    return input === '' ? current : input
  }

  private async askTitle(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Título${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (BookValidator.validateTitle(value)) {
        return value
      }

      this.display('Título inválido.\n')
    }
  }

  private async askAuthor(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Autor${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (BookValidator.validadeAuthor(value)) {
        return value
      }

      this.display('Autor inválido.\n')
    }
  }

  private async askDescription(current?: string): Promise<string | undefined> {
    const input = (
      await this.prompt(
        `Descrição${current ? ` [${current}]` : ''} (opcional): `
      )
    ).trim()

    return input === '' ? current : input
  }

  private async askPublishYear(current?: number): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Ano de publicação${current ? ` [${String(current)}]` : ''} (opcional): `
        )
      ).trim()

      if (input === '') {
        return current
      }

      const value = Number(input)

      if (BookValidator.validatePublishYear(value)) {
        return value
      }

      this.display('Ano de publicação inválido.\n')
    }
  }

  private async askEdition(current?: number): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Edição${current ? ` [${String(current)}]` : ''} (opcional) (somente o número): `
        )
      ).trim()

      if (input === '') {
        return current
      }

      const value = Number(input)

      if (BookValidator.validateEdition(value)) {
        return value
      }

      this.display('Edição inválida.\n')
    }
  }

  private async askNumPages(current?: number): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Número de páginas${current ? ` [${String(current)}]` : ''} (opcional): `
        )
      ).trim()

      if (input === '') {
        return current
      }

      const value = Number(input)

      if (BookValidator.validateNumPages(value)) {
        return value
      }
    }
  }

  private async confirmBook(info: EditBookInputDTO): Promise<void> {
    this.display(`
        =============================================================

        ISBN: ${info.isbn ?? 'N/A'}
        Nome: ${info.title},
        Autor: ${info.author},
        Descrição: ${info.description ?? 'N/A'},
        Ano de publicação: ${String(info.publish_year ?? 'N/A')},
        Edição: ${String(info.edition ?? 'N/A')},
        Número de páginas: ${String(info.num_pages ?? 'N/A')},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        await this.bookService.editBook(this.book.id, info)
        this.display('Livro editado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
    }
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
