import { ConsoleView } from './console.view'
import { ViewFactory } from '../factories/view.factories'
import { User } from '../models/User'

export class SelectUserView extends ConsoleView {
  constructor(
    private readonly user: User,
    private readonly viewFactory: ViewFactory
  ) {
    super()
  }

  protected async renderMenu(): Promise<void> {
    this.display('\n=== Usuário ===')
    this.display(`Nome: ${this.user.name}`)
    this.display(`CPF: ${this.user.cpf}`)
    this.display(`Email: ${this.user.email}`)
    this.display(`Telefone: ${this.user.phone}`)

    this.display('')
    this.display('[1] Emprestar')
    this.display('[2] Editar')
    this.display('[3] Remover')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha: ')).trim().toUpperCase()

    switch (option) {
      case '1':
        await this.loanUser()
        break

      case '2':
        this.editUser()
        break

      case '3':
        this.removeUser()
        break

      case 'Q':
        this.exit()
        return

      default:
        this.display('Opção inválida.')
    }
  }

  private async loanUser() {
    await this.viewFactory.createLoanAddView().start({
      cpf: this.user.cpf
    })
  }

  private editUser() {
    this.exit()
  }

  private removeUser() {
    this.exit()
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
