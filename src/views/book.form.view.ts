import { ConsoleView } from './console.view'
import { UserCancelledException } from '../errors/user.canceled.exception'
import { BookValidator } from '../validators/BookValidator'

export abstract class BookFormView extends ConsoleView {
  protected async fillBookData<
    T extends {
      isbn?: string
      title: string
      author: string
      description?: string
      publish_year?: number
      edition?: number
      num_pages?: number
    }
  >(book: T): Promise<T> {
    book.isbn = await this.askIsbn(book.isbn)
    book.title = await this.askTitle(book.title)
    book.author = await this.askAuthor(book.author)
    book.description = await this.askDescription(book.description)
    book.publish_year = await this.askPublishYear(book.publish_year)
    book.edition = await this.askEdition(book.edition)
    book.num_pages = await this.askNumPages(book.num_pages)

    return book
  }

  protected async askIsbn(current?: string): Promise<string | undefined> {
    const input = (
      await this.prompt(`ISBN${current ? ` [${current}]` : ''} (opcional): `)
    ).trim()

    this.checkCancelled(input)

    return input === '' ? current : input
  }

  protected async askTitle(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Título${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (BookValidator.validateTitle(value)) {
        return value
      }

      this.display('Título inválido.\n')
    }
  }

  protected async askAuthor(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Autor${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (BookValidator.validadeAuthor(value)) {
        return value
      }

      this.display('Autor inválido.\n')
    }
  }

  protected async askDescription(
    current?: string
  ): Promise<string | undefined> {
    const input = (
      await this.prompt(
        `Descrição${current ? ` [${current}]` : ''} (opcional): `
      )
    ).trim()
    this.checkCancelled(input)

    return input === '' ? current : input
  }

  protected async askPublishYear(
    current?: number
  ): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Ano de publicação${current ? ` [${String(current)}]` : ''} (opcional): `
        )
      ).trim()

      this.checkCancelled(input)
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

  protected async askEdition(current?: number): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Edição${current ? ` [${String(current)}]` : ''} (opcional) (somente o número): `
        )
      ).trim()

      this.checkCancelled(input)

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

  protected async askNumPages(current?: number): Promise<number | undefined> {
    for (;;) {
      const input = (
        await this.prompt(
          `Número de páginas${current ? ` [${String(current)}]` : ''} (opcional): `
        )
      ).trim()

      this.checkCancelled(input)

      if (input === '') {
        return current
      }

      const value = Number(input)

      if (BookValidator.validateNumPages(value)) {
        return value
      }

      this.display('Número de páginas inválido.\n')
    }
  }

  protected checkCancelled(input: string): void {
    if (input.trim().toUpperCase() === 'Q') {
      throw new UserCancelledException()
    }
  }
}
