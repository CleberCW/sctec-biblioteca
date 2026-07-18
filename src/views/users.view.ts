import { ConsoleView } from './console.view'
import { UserAddView } from './users.add.view'
import { UsersListView } from './users.explorer.view'
import { UserSearchView } from './users.search.view'

export class UsersView extends ConsoleView {
  constructor(
    private readonly usersListView: UsersListView,
    private readonly usersSearchView: UserSearchView,
    private readonly usersAddView: UserAddView
  ) {
    super()
  }

  protected async update(): Promise<void> {
    this.display('\n=== Usuários ===\n')
    this.display('1. Pesquisar Usuário')
    this.display('2. Listar Usuários')
    this.display('3. Cadastrar Usuário')
    this.display('4. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        await this.usersSearchView.start()
        break
      case '2':
        await this.usersListView.start()
        break
      case '3':
        await this.usersAddView.start()
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
