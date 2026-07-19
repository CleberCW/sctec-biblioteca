import { ConsoleView } from './console.view'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { LoanService } from '../services/loan.service'
import { LoanListPage } from '../types/LoanListPage'

export class LoansListView extends ConsoleView {
  private pageSize = 20

  private page = 1

  private loanListPage?: LoanListPage

  constructor(private readonly loanService: LoanService) {
    super()
  }

  private formatLoan(b: BookLoanResult): string {
    return [
      String(b.id).padEnd(6),
      b.userName.slice(0, 40).padEnd(40),
      b.title.slice(0, 40).padEnd(40),
      b.loan_date.toLocaleDateString('pt-BR').slice(0, 30).padEnd(30),
      b.due_date.toLocaleDateString('pt-BR').slice(0, 30).padEnd(30)
    ].join(' | ')
  }

  private readonly header = [
    'ID'.padEnd(6),
    'Nome do usuário'.padEnd(40),
    'Título'.padEnd(40),
    'Data de empréstimo'.padEnd(30),
    'Data prevista para devolução'.padEnd(30)
  ].join(' | ')

  private center(text: string, width: number, fill = '='): string {
    const left = Math.floor((width - text.length) / 2)
    return text.padStart(left + text.length, fill).padEnd(width, fill)
  }

  private async renderPage(): Promise<void> {
    this.display(this.header)
    this.display('='.repeat(this.header.length))
    this.loanListPage = await this.loanService.getPage(this.page, this.pageSize)

    if (this.loanListPage.books.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      this.loanListPage.books.forEach((b) => {
        this.display(this.formatLoan(b))
      })
    }

    const hasPrev = this.loanListPage.page > 1
    const hasNext = this.loanListPage.page < this.loanListPage.totalPages

    const footer = [hasPrev ? '[A] Anterior' : '', hasNext ? '[S] Próxima' : '']
      .filter((s) => s !== '')
      .join(' | ')

    this.display(footer !== '' ? footer : 'Página única')
    this.display('[Q] Voltar')
  }

  private async handleNext(): Promise<void> {
    if (!this.loanListPage) return

    const hasNext = this.loanListPage.page < this.loanListPage.totalPages

    if (!hasNext) {
      return
    }

    this.page++

    this.loanListPage = await this.loanService.getPage(this.page, this.pageSize)

    await this.renderPage()
  }

  private async handlePrevious(): Promise<void> {
    if (!this.loanListPage) return

    const hasPrevious = this.loanListPage.page > 1

    if (!hasPrevious) {
      return
    }

    this.page--

    this.loanListPage = await this.loanService.getPage(this.page, this.pageSize)

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
