import { BookFormView } from './book.form.view'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookCondition } from '../enums/BookCondition'
import { BookStatus } from '../enums/BookStatus'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'

export class BookEditView extends BookFormView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly book: BookSearchResult,
    private readonly bookService: BookService
  ) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Editar Livro ===\n')

    const book: EditBookInputDTO = {
      isbn: this.book.isbn ?? undefined,
      title: this.book.title,
      author: this.book.author,
      description: this.book.description ?? undefined,
      publish_year: this.book.publish_year ?? undefined,
      edition: this.book.edition ?? undefined,
      num_pages: this.book.num_pages ?? undefined,
      status: this.book.status,
      condition: this.book.condition,
      tagNames: this.book.tags
        ? this.book.tags.split(',').map((tag) => tag.trim())
        : []
    }

    await this.fillBookData(book)

    book.condition = await this.askCondition(book.condition)
    book.status = await this.askStatus(book.status)
    book.tagNames = await this.askTags(book.tagNames.map((tag) => tag))

    await this.confirmBook(book)
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

  private async askTags(current: string[] = []): Promise<string[]> {
    for (;;) {
      const input = (
        await this.prompt(
          `Tags${current.length ? ` [${current.join(', ')}]` : ''} (separadas por vírgula): `
        )
      ).trim()

      this.checkCancelled(input)

      if (input === '') {
        return current
      }

      const tags = input
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')

      if (tags.length === 0) {
        this.display('Informe ao menos uma tag válida.')
        continue
      }

      return [...new Set(tags)]
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
        Tags: ${info.tagNames.length ? info.tagNames.join(', ') : 'N/A'}
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
