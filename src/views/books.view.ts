import { BooksAddView } from './add.books.view'
import { ConsoleView } from './console.view'
import { BooksListView } from './explorer.books.view'

export class BooksView extends ConsoleView {
  constructor(
    private readonly booksListView: BooksListView,
    private readonly booksAddView: BooksAddView
  ) {
    super()
  }

  protected async update(): Promise<void> {
    this.display('\n=== Livros ===\n')
    this.display('1. Pesquisar Livro')
    this.display('2. Listar Livros')
    this.display('3. Cadastrar Livro')
    this.display('4. Remover Livro')
    this.display('5. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        break
      case '2':
        await this.booksListView.start()
        break
      case '3':
        await this.booksAddView.start()
        break
      case '4':
        break
      case '5':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
