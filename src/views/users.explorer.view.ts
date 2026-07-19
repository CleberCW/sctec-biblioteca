import { ConsoleView } from './console.view'
import { User } from '../models/User'
import { UserService } from '../services/user.service'
import { UserListPage } from '../types/UserListPage'

export class UsersListView extends ConsoleView {
  private pageSize = 20

  private page = 1

  private userListPage?: UserListPage

  constructor(private readonly userService: UserService) {
    super()
  }

  private formatUsers(u: User): string {
    return [
      String(u.id).padEnd(6),
      u.name.slice(0, 60).padEnd(60),
      u.cpf.padEnd(20),
      u.email.slice(0, 20).padEnd(20),
      u.phone.slice(0, 50).padEnd(20)
    ].join(' | ')
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Nome'.padEnd(60),
    'CPF'.padEnd(20),
    'Email'.padEnd(20),
    'Telefone'.padEnd(20)
  ].join(' | ')

  private async renderPage(): Promise<void> {
    this.display(this.header)
    this.display('='.repeat(this.header.length))
    this.userListPage = await this.userService.getPage(this.page, this.pageSize)

    if (this.userListPage.users.length === 0) {
      this.display('Nenhum usuário encontrado.\n')
    } else {
      this.userListPage.users.forEach((u) => {
        this.display(this.formatUsers(u))
      })
    }

    const hasPrev = this.userListPage.page > 1
    const hasNext = this.userListPage.page < this.userListPage.totalPages

    const footer = [hasPrev ? '[A] Anterior' : '', hasNext ? '[S] Próxima' : '']
      .filter((s) => s !== '')
      .join(' | ')

    this.display('')

    this.display(footer !== '' ? footer : 'Página única')
    this.display('')
    this.display('[Q] Voltar')
  }

  private async handleNext(): Promise<void> {
    if (!this.userListPage) return

    const hasNext = this.userListPage.page < this.userListPage.totalPages

    if (!hasNext) {
      return
    }

    this.page++

    this.userListPage = await this.userService.getPage(this.page, this.pageSize)

    await this.renderPage()
  }

  private async handlePrevious(): Promise<void> {
    if (!this.userListPage) return

    const hasPrevious = this.userListPage.page > 1

    if (!hasPrevious) {
      return
    }

    this.page--

    this.userListPage = await this.userService.getPage(this.page, this.pageSize)

    await this.renderPage()
  }

  protected async onExit(): Promise<void> {
    this.page = 1
    return super.onExit()
  }

  protected async update(): Promise<void> {
    await this.renderPage()

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'S':
        await this.handleNext()
        break
      case 'A':
        await this.handlePrevious()
        break
      case 'Q':
        this.exit()
        break
      default:
        break
    }
  }
}
