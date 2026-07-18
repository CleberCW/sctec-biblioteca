import { ConsoleView } from './console.view'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { BookService } from '../services/book.service'
import { LoanService } from '../services/loan.service'

export class ReportsView extends ConsoleView {
  constructor(
    private readonly bookService: BookService,
    private readonly loanService: LoanService
  ) {
    super()
  }

  private formatLoan(l: BookLoanResult): string {
    return `#${String(l.id)} - ${l.title} | Cliente: ${l.userName} | Empréstimo: ${l.loan_date.toLocaleDateString('pt-BR')} | Devolução: ${l.due_date.toLocaleDateString('pt-BR')}`
  }

  private async renderLoans(): Promise<void> {
    const loans = await this.loanService.list()

    if (loans.length === 0) {
      this.display('Nenhum empréstimo ativo.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    loans.forEach((loan) => {
      this.display(this.formatLoan(loan))
    })

    await this.prompt('Pressione ENTER para continuar:')
  }

  protected async renderMenu(): Promise<void> {
    this.display('\n=== Empréstimos ===\n')
    this.display('1. Empréstimos ativos')
    this.display('2. ...')
    this.display('3. ...')
    this.display('4. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        await this.renderLoans()
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

  protected async update() {
    await this.renderMenu()
  }
}
