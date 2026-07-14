import { ConsoleView } from './console.view'
import { BookService } from '../services/book.service'
import { BookValidator } from '../validators/BookValidator'

export class BooksAddView extends ConsoleView {
  constructor(private readonly bookService: BookService) {
    super()
  }

  private checkYear(year: number): boolean {
    if (isNaN(year)) {
      return false
    }

    if (year < 0 || year > new Date().getFullYear()) {
      return false
    }

    if (!Number.isInteger(year)) {
      return false
    }

    return true
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')

    const book = {
      name: '',
      author: '',
      description: '',
      publishYear: null as number | null,
      edition: null as number | null
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

    book.description = (await this.prompt('Descrição: ')).trim()

    do {
      book.publishYear = Number(
        (await this.prompt('Ano de publicação: ')).trim()
      )

      if (!BookValidator.validatePublishYear(book.publishYear)) {
        this.display('Ano inválido.\n')
      }
    } while (!BookValidator.validatePublishYear(book.publishYear))

    do {
      const editionInput = (await this.prompt('Edição (opcional): ')).trim()

      if (editionInput === '') {
        book.edition = null
        break
      }

      book.edition = Number(editionInput)

      if (!BookValidator.validateEdition(book.edition)) {
        this.display('Edição inválida.\n')
      }
    } while (!BookValidator.validateEdition(book.edition))

    this.display(`
        =============================================================

        Nome: ${book.name},
        Autor: ${book.author},
        Descrição: ${book.description},
        Ano de publicação: ${book.publishYear ? String(book.publishYear) : 'N/A'}, 
        Edição: ${book.edition ? `${String(book.edition)}ª` : 'N/A'},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar`)
  }

  protected async update(): Promise<void> {
    await this.renderPage()

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        this.display('Livro adicionado!')
        await this.prompt('Pressione ENTER para continuar:')
        break
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
