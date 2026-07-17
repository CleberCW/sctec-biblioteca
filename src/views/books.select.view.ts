import { ConsoleView } from './console.view'
import { Book } from '../models/Book'

export class SelectBooksView extends ConsoleView {
  constructor(private readonly book: Book) {
    super()
  }

  protected async update(): Promise<void> {
    this.display('\n=== Livro ===')
    this.display(`Título: ${this.book.name}`)
    this.display(`Código: ${this.book.barcode}`)
    this.display(`Descrição: ${this.book.description ?? 'Sem descrição'}`)

    this.display('')
    this.display('[1] Emprestar')
    this.display('[2] Editar')
    this.display('[3] Remover')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha: ')).trim().toUpperCase()

    switch (option) {
      case '1':
        await this.loanBook()
        break

      case '2':
        await this.editBook()
        break

      case '3':
        await this.removeBook()
        break

      case 'Q':
        this.exit()
        return

      default:
        this.display('Opção inválida.')
    }
  }

  private async loanBook(): Promise<void> {
    // usa this.book.id
  }

  private async editBook(): Promise<void> {
    // usa this.book
  }

  private async removeBook(): Promise<void> {
    // usa this.book.id
  }
}
