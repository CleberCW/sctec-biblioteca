import { ConsoleView } from './console.view'
import { CreateUserDTO } from '../dtos/CreateUserDTO'
import { UserService } from '../services/user.service'
import { UserValidator } from '../validators/UserValidator'

export class UserAddView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly userService: UserService) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Usuário ===\n')

    const user: CreateUserDTO = {
      name: '',
      cpf: '',
      email: '',
      phone: ''
    }

    user.name = await this.askName(user.name)
    user.cpf = await this.askCpf(user.cpf)
    user.email = await this.askEmail(user.email)
    user.phone = await this.askPhone(user.phone)

    await this.confirmUser(user)
  }

  private async askName(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Nome${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (UserValidator.validateName(value)) {
        return value
      }

      this.display('Nome inválido.\n')
    }
  }

  private async askCpf(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`CPF${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (UserValidator.validateCpf(value)) {
        return value
      }

      this.display('CPF inválido.\n')
    }
  }

  private async askEmail(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Email${current ? ` [${current}]` : ''}: `)
      ).trim()

      const value = input === '' ? current : input

      if (UserValidator.validateEmail(value)) {
        return value
      }

      this.display('Email inválido.\n')
    }
  }

  private async askPhone(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(
          `Telefone${current ? ` [${current}]` : ''} (opcional): `
        )
      ).trim()

      const value = input === '' ? current : input

      if (value && UserValidator.validatePhone(value)) {
        return value
      }

      this.display('Telefone inválido.\n')
    }
  }

  private async confirmUser(user: CreateUserDTO): Promise<void> {
    this.display(`
        =============================================================

        Nome: ${user.name},
        CPF: ${user.cpf},
        Email: ${user.email},
        Telefone: ${user.phone},
        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C': {
        const userToAdd: CreateUserDTO = {
          name: user.name,
          cpf: user.cpf,
          email: user.email,
          phone: user.phone
        }
        await this.userService.add(userToAdd)
        this.display('Usuário cadastrado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
      }
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
    }
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
