import { ConsoleView } from './console.view'
import { ViewFactory } from '../factories/view.factories'
import { BookSearchResult } from '../models/BookSearchResult'

export class SelectBooksView extends ConsoleView {
  constructor(
    private readonly book: BookSearchResult,
    private readonly viewFactory: ViewFactory
  ) {
    super()
  }

  protected async renderMenu(): Promise<void> {
    this.display('\n=== Livro ===')
    this.display(`Título: ${this.book.title}`)
    this.display(`ID: ${String(this.book.id)}`)
    this.display(
      `Descrição: ${(this.book.description ?? 'Sem descrição').slice(0, 100)}...`
    )
    this.display(`Status: ${this.book.status}`)

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
        this.removeBook()
        break

      case 'Q':
        this.exit()
        return

      default:
        this.display('Opção inválida.')
    }
  }

  private async loanBook() {
    await this.viewFactory.createLoanAddView().start({
      bookId: String(this.book.id)
    })
  }

  private async editBook() {
    await this.viewFactory.createEditBookView(this.book).start()
  }

  private removeBook() {
    this.exit()
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
