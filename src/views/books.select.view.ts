import { ConsoleView } from './console.view'
import { ViewFactory } from '../factories/view.factories'
import { BookSearchResult } from '../models/BookSearchResult'
import { BookService } from '../services/book.service'

export class SelectBooksView extends ConsoleView {
  constructor(
    private readonly book: BookSearchResult,
    private readonly viewFactory: ViewFactory,
    private readonly bookService: BookService
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
        await this.removeBook()
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
    this.exit()
  }

  private async editBook() {
    await this.viewFactory.createEditBookView(this.book).start()
    this.exit()
  }

  private async removeBook() {
    this.display(
      'Tem certeza que deseja remover o livro? (só é possível remover livros que não tenham tido nenhum empréstimo)'
    )
    this.display(`[S] Sim [N] Não\n`)

    const option = await this.prompt('Digite a opção: ')

    if (option.toUpperCase() === 'S') {
      await this.bookService.remove(this.book.id)
      this.display('Livro removido com sucesso')
      await this.prompt('Pressione ENTER para cotinuar')
    }

    this.exit()
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
