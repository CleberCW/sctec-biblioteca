import { ConsoleView } from './console.view'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { BookService } from '../services/book.service'
import { BookValidator } from '../validators/BookValidator'

export class BooksAddView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly bookService: BookService) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')

    const book: CreateBookInputDTO = {
      name: '',
      author: '',
      description: '',
      publishYear: undefined,
      edition: undefined,
      numPages: undefined
    }

    while (!BookValidator.validateName(book.name)) {
      book.name = (await this.prompt('Nome: ')).trim()

      if (!BookValidator.validateName(book.name)) {
        this.display('Nome inválido.\n')
      }
    }

    while (!BookValidator.validadeAuthor(book.author)) {
      book.author = (await this.prompt('Autor: ')).trim()

      if (!BookValidator.validadeAuthor(book.author)) {
        this.display('Autor inválido.\n')
      }
    }

    book.description =
      (await this.prompt('Descrição: ')).trim() === ''
        ? undefined
        : book.description

    do {
      book.publishYear =
        (await this.prompt('Ano de publicação: ')).trim() === ''
          ? undefined
          : Number(book.publishYear)

      if (!BookValidator.validatePublishYear(book.publishYear)) {
        this.display('Ano inválido.\n')
      }
    } while (
      this.isInView &&
      !BookValidator.validatePublishYear(book.publishYear)
    )

    do {
      book.edition =
        (await this.prompt('Edição (opcional): ')).trim() === ''
          ? undefined
          : Number(book.edition)

      if (!BookValidator.validateEdition(book.edition)) {
        this.display('Edição inválida.\n')
      }
    } while (this.isInView && !BookValidator.validateEdition(book.edition))

    do {
      book.numPages =
        (await this.prompt('Número de páginas (opcional): ')).trim() === ''
          ? undefined
          : Number(book.numPages)

      if (!BookValidator.validateNumPages(book.numPages)) {
        this.display('Número de páginas inválido.\n')
      }
    } while (this.isInView && !BookValidator.validateNumPages(book.numPages))

    this.display(`
        =============================================================

        Nome: ${book.name},
        Autor: ${book.author},
        Descrição: ${book.description ?? 'N/A'},
        Ano de publicação: ${book.publishYear ? String(book.publishYear) : 'N/A'}, 
        Edição: ${book.edition ? `${String(book.edition)}ª` : 'N/A'},
        Número de páginas: ${book.numPages ? String(book.numPages) : 'N/A'},

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
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }

    this.exit()
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
