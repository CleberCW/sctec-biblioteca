import { UserFormView } from './user.form.view'
import { EditUserInputDTO } from '../dtos/EditUserDTO'
import { User } from '../models/User'
import { UserService } from '../services/user.service'

export class UserEditView extends UserFormView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly user: User,
    private readonly userService: UserService
  ) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Editar Usuário ===\n')

    const user: EditUserInputDTO = {
      cpf: this.user.cpf,
      name: this.user.name,
      phone: this.user.phone,
      email: this.user.email
    }

    await this.fillUserData(user)

    await this.confirmUser(user)
  }

  private async confirmUser(info: EditUserInputDTO): Promise<void> {
    this.display(`
=============================================================

CPF: ${info.cpf}
Nome: ${info.name}
Telefone: ${info.phone}
E-mail: ${info.email}

=============================================================
`)

    this.display('[C] Confirmar | [D] Cancelar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case 'C':
        await this.userService.editUser(this.user.id, info)
        this.display('Usuário editado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break

      case 'D':
        this.display('Operação cancelada.')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break

      default:
        this.display('Opção inválida.')
        await this.confirmUser(info)
    }
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
