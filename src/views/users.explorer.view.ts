import { PaginatedConsoleView } from './paginated.view'
import { User } from '../models/User'
import { UserService } from '../services/user.service'
import { UserListPage } from '../types/UserListPage'

export class UsersListView extends PaginatedConsoleView<User, UserListPage> {
  constructor(private readonly userService: UserService) {
    super()
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Nome'.padEnd(60),
    'CPF'.padEnd(20),
    'Email'.padEnd(20),
    'Telefone'.padEnd(20)
  ].join(' | ')

  protected override async fetchPage(
    page: number,
    pageSize: number
  ): Promise<UserListPage> {
    return this.userService.getPage(page, pageSize)
  }

  protected override getItems(page: UserListPage): User[] {
    return page.users
  }

  protected override getCurrentPage(page: UserListPage): number {
    return page.page
  }

  protected override getTotalPages(page: UserListPage): number {
    return page.totalPages
  }

  protected override formatItem(u: User): string {
    return [
      String(u.id).padEnd(6),
      u.name.slice(0, 60).padEnd(60),
      u.cpf.padEnd(20),
      u.email.slice(0, 20).padEnd(20),
      u.phone.slice(0, 50).padEnd(20)
    ].join(' | ')
  }

  protected override getHeader(): string {
    return this.header
  }

  protected override renderFooter(
    hasPrevious: boolean,
    hasNext: boolean
  ): void {
    const footer = [
      hasPrevious ? '[A] Anterior' : '',
      hasNext ? '[S] Próxima' : ''
    ]
      .filter(Boolean)
      .join(' | ')

    this.display(footer || 'Página única')
    this.display('[C] Selecionar  [Q] Voltar')
  }
}
