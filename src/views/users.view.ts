import { ConsoleView } from './console.view'

export class UsersView extends ConsoleView {
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
        break
      case '2':
        break
      case '3':
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
