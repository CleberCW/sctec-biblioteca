import { PaginatedConsoleView } from './paginated.view'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { LoanService } from '../services/loan.service'
import { LoanListPage } from '../types/LoanListPage'

export class LoansListView extends PaginatedConsoleView<
  BookLoanResult,
  LoanListPage
> {
  constructor(private readonly loanService: LoanService) {
    super()
  }

  private dateNow = new Date()

  private readonly header = [
    'ID'.padEnd(6),
    'Nome do usuário'.padEnd(40),
    'Título'.padEnd(40),
    'Data de empréstimo'.padEnd(30),
    'Data limite para devolução'.padEnd(30),
    'Status'.padEnd(20)
  ].join(' | ')

  protected override async fetchPage(
    page: number,
    pageSize: number
  ): Promise<LoanListPage> {
    return this.loanService.getPage(page, pageSize)
  }

  protected override getItems(page: LoanListPage): BookLoanResult[] {
    return page.books
  }

  protected override getCurrentPage(page: LoanListPage): number {
    return page.page
  }

  protected override getTotalPages(page: LoanListPage): number {
    return page.totalPages
  }

  protected override formatItem(b: BookLoanResult): string {
    return [
      String(b.id).padEnd(6),
      b.userName.slice(0, 40).padEnd(40),
      b.title.slice(0, 40).padEnd(40),
      b.loan_date.toLocaleDateString('pt-BR').slice(0, 30).padEnd(30),
      b.due_date.toLocaleDateString('pt-BR').slice(0, 30).padEnd(30),
      (b.returned_at ? 'Devolvido' : 'Emprestado').padEnd(20),
      b.due_date < this.dateNow ? 'ATRASADO' : ''
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
