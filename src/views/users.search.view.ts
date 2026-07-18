import { ConsoleView } from './console.view'
import { ViewFactory } from '../factories/view.factory'
import { User } from '../models/User'
import { UserService } from '../services/user.service'

export class UserSearchView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly userService: UserService,
    private readonly viewFactory: ViewFactory
  ) {
    super()
  }

  private async renderMenu(): Promise<void> {
    this.display('\n=== Buscar Usuário ===\n')
    this.display('[1] Buscar por CPF')
    this.display('[2] Buscar por nome')
    this.display('[3] Buscar por email')
    this.display('[4] Buscar por telefone')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case '1': {
        const cpf = await this.prompt('Digite o CPF: ')
        const result = await this.userService.searchByCpf(cpf)
        await this.renderResults(result)
        await this.prompt('Pressione ENTER para continuar:')
        break
      }

      case '2': {
        const name = await this.prompt('Digite o nome: ')
        const results = await this.userService.searchByName(name)
        await this.renderResults(results)
        await this.prompt('Pressione ENTER para continuar:')
        break
      }
      case '3': {
        const email = await this.prompt('Digite o email: ')
        const results = await this.userService.searchByEmail(email)
        await this.renderResults(results)
        await this.prompt('Pressione ENTER para continuar:')
        break
      }

      case '4': {
        const phone = await this.prompt('Digite o telefone: ')
        const results = await this.userService.searchByPhone(phone)
        await this.renderResults(results)
        await this.prompt('Pressione ENTER para continuar:')
        break
      }

      case 'Q':
        this.exit()
        break

      default:
        this.display('Opção inválida.')
    }
  }

  private formatUsers(u: User): string {
    return `#${String(u.id)} - ${u.name} | CPF: ${u.cpf} | Email: ${u.email} | Telefone: ${u.phone}`
  }

  private async renderResults(results: User[] | null): Promise<void> {
    this.display('\n=== Resultado da Pesquisa ===')

    if (results === null || results.length === 0) {
      this.display('Nenhum usuário encontrado.')
      return
    }

    if (results.length === 1) {
      this.display(this.formatUsers(results[0]))
    } else {
      results.forEach((user) => {
        this.display(this.formatUsers(user))
      })
    }

    for (;;) {
      const input = (
        await this.prompt('\nDigite o ID do usuário ou Q para voltar: ')
      )
        .trim()
        .toUpperCase()

      if (input === 'Q') {
        return
      }

      const id = Number(input)

      if (Number.isNaN(id)) {
        this.display('ID inválido.')
        continue
      }

      const user = results.find((u) => u.id === id)

      if (!user) {
        this.display('Usuário não encontrado.')
        continue
      }

      this.exit()
      await this.viewFactory.createSelectUsersView(user).start()
      return
    }
  }

  protected async update(): Promise<void> {
    await this.renderMenu()
  }
}
