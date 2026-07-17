import { ConsoleView } from './console.view'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { BookService } from '../services/book.service'
import { BookValidator } from '../validators/BookValidator'

export class BooksAddView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly bookService: BookService) {
    super()
  }

  private async registerManually(
    initial?: Partial<CreateBookInputDTO>
  ): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')

    const book: CreateBookInputDTO = {
      name: '',
      author: '',
      description: undefined,
      publishYear: undefined,
      edition: undefined,
      numPages: undefined,
      ...initial
    }

    book.name = await this.askName(book.name)
    book.author = await this.askAuthor(book.author)
    book.description = await this.askDescription(book.description)
    book.publishYear = await this.askPublishYear(book.publishYear)
    book.edition = await this.askEdition(book.edition)
    book.numPages = await this.askNumPages(book.numPages)

    await this.confirmBook(book)
  }

  private async askName(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Nome${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (BookValidator.validateName(value)) {
        return value
      }

      this.display('Nome inválido.\n')
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

  private async confirmBook(book: CreateBookInputDTO): Promise<void> {
    this.display(`
        =============================================================

        Nome: ${book.name},
        Autor: ${book.author},
        Descrição: ${book.description ?? 'N/A'},
        Ano de publicação: ${String(book.publishYear ?? 'N/A')},
        Edição: ${String(book.edition ?? 'N/A')},
        Número de páginas: ${String(book.numPages ?? 'N/A')},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        await this.bookService.add(book)
        this.display('Livro cadastrado com sucesso!')
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

  private async registerByIsbn(): Promise<void> {
    this.display('\n=== Cadastrar Livro por ISBN ===\n')

    const isbn = (await this.prompt('ISBN: ')).trim()

    if (!BookValidator.validateIsbn(isbn)) {
      this.display('ISBN inválido.\n')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    const metadata = await this.bookService.findMetadata(isbn)

    if (!metadata) {
      this.display('Nenhum livro encontrado para o ISBN informado.\n')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.display(`
        =============================================================

        Título: ${metadata.title}${metadata.subtitle ? ` (${metadata.subtitle})` : ''},
        Autor: ${metadata.authors[0] ?? 'Desconhecido'},
        Descrição: ${metadata.synopsis ?? 'N/A'},
        Ano de publicação: ${metadata.year ? String(metadata.year) : 'N/A'}, 
        Número de páginas: ${metadata.pageCount ? String(metadata.pageCount) : 'N/A'},
        Assunto(s): ${metadata.subjects.join(', ')},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar | [E] Editar manualmente`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C': {
        const bookToAdd: CreateBookInputDTO = {
          name: metadata.title,
          author: metadata.authors[0] ?? 'Desconhecido',
          description: metadata.synopsis ?? undefined,
          publishYear: metadata.year ?? undefined,
          edition: undefined,
          numPages: metadata.pageCount ?? undefined
        }
        await this.bookService.add(bookToAdd)
        this.display('Livro cadastrado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
      }
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break

      case 'E':
        await this.registerManually({
          name: metadata.title,
          author: metadata.authors[0] ?? 'Desconhecido',
          description: metadata.synopsis ?? undefined,
          publishYear: metadata.year ?? undefined,
          edition: undefined,
          numPages: metadata.pageCount ?? undefined
        })
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }

    this.exit()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')
    this.display('[1] Buscar por ISBN')
    this.display('[2] Cadastrar manualmente')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case '1':
        await this.registerByIsbn()
        break

      case '2':
        await this.registerManually()
        break

      case 'Q':
        this.exit()
        break

      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
