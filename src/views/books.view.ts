import { BooksAddView } from './books.add.view'
import { BooksListView } from './books.explorer.view'
import { BooksSearchView } from './books.search.view'
import { ConsoleView } from './console.view'

export class BooksView extends ConsoleView {
  constructor(
    private readonly booksListView: BooksListView,
    private readonly booksAddView: BooksAddView,
    private readonly booksSearchView: BooksSearchView
  ) {
    super()
  }

  protected async update(): Promise<void> {
    this.display('\n=== Livros ===\n')
    this.display('1. Pesquisar Livro')
    this.display('2. Listar Livros')
    this.display('3. Cadastrar Livro')
    this.display('4. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        await this.booksSearchView.start()
        break
      case '2':
        await this.booksListView.start()
        break
      case '3':
        await this.booksAddView.start()
        break
      case '4':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
