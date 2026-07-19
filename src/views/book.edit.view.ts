import { ConsoleView } from './console.view'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookCondition } from '../enums/BookCondition'
import { BookStatus } from '../enums/BookStatus'
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
    this.display('\n=== Editar Livro ===\n')

    console.log(this.book)

    const book: EditBookInputDTO = {
      isbn: this.book.isbn ?? undefined,
      title: this.book.title,
      author: this.book.author,
      description: this.book.description ?? undefined,
      publish_year: this.book.publish_year ?? undefined,
      edition: this.book.edition ?? undefined,
      num_pages: this.book.num_pages ?? undefined,
      status: this.book.status,
      condition: this.book.condition
    }

    book.isbn = await this.askIsbn(book.isbn)
    book.title = await this.askTitle(book.title)
    book.author = await this.askAuthor(book.author)
    book.description = await this.askDescription(book.description)
    book.publish_year = await this.askPublishYear(book.publish_year)
    book.edition = await this.askEdition(book.edition)
    book.num_pages = await this.askNumPages(book.num_pages)
    book.condition = await this.askCondition(book.condition)
    book.status = await this.askStatus(book.status)

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

  private async askCondition(current?: BookCondition): Promise<BookCondition> {
    const options = [
      BookCondition.GOOD,
      BookCondition.AVERAGE,
      BookCondition.POOR
    ]

    for (;;) {
      this.display('\nCondição do livro:')

      options.forEach((condition, index) => {
        this.display(`[${String(index + 1)}] ${condition}`)
      })

      const input = (
        await this.prompt(
          `Escolha uma opção${current ? ` [${current}]` : ''}: `
        )
      ).trim()

      if (input === '' && current) {
        return current
      }

      const index = Number(input) - 1

      if (index >= 0 && index < options.length) {
        return options[index]
      }

      this.display('Condição inválida.\n')
    }
  }

  private async askStatus(current?: BookStatus): Promise<BookStatus> {
    if (current === BookStatus.LOANED) {
      return current
    }
    const options = [
      BookStatus.AVAILABLE,
      BookStatus.MAINTENANCE,
      BookStatus.LOST
    ]

    for (;;) {
      this.display('\nStatus do livro:')

      options.forEach((status, index) => {
        this.display(`[${String(index + 1)}] ${status}`)
      })

      const input = (
        await this.prompt(
          `Escolha uma opção${current ? ` [${current}]` : ''}: `
        )
      ).trim()

      if (input === '' && current) {
        return current
      }

      const index = Number(input) - 1

      if (index >= 0 && index < options.length) {
        return options[index]
      }

      this.display('Status inválido.\n')
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
        Condição: ${info.condition}
        Status: ${info.status}

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
