import { ConsoleView } from './console.view'
import { BooksByAuthorResult } from '../dtos/BooksByAuthorResult'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { BookSearchResult } from '../models/BookSearchResult'
import { AuthorService } from '../services/author.service'
import { BookService } from '../services/book.service'
import { LoanService } from '../services/loan.service'

export class ReportsView extends ConsoleView {
  constructor(
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
    private readonly authorService: AuthorService
  ) {
    super()
  }

  private dateNow = new Date()

  private formatLoan(l: BookLoanResult): string {
    return [
      String(l.id).padEnd(6),
      l.title.slice(0, 40).padEnd(40),
      l.userName.slice(0, 25).padEnd(25),
      l.loan_date.toLocaleDateString('pt-BR').padEnd(12),
      l.due_date.toLocaleDateString('pt-BR').padEnd(12),
      l.due_date < this.dateNow ? 'ATRASADO' : ''
    ].join(' | ')
  }

  private readonly loanHeader = [
    'ID'.padEnd(6),
    'Título'.padEnd(40),
    'Usuário'.padEnd(25),
    'Empréstimo'.padEnd(12),
    'Prazo'.padEnd(12)
  ].join(' | ')

  private formatBooks(b: BookSearchResult): string {
    return [
      String(b.id).padEnd(6),
      b.title.slice(0, 60).padEnd(60),
      (b.isbn ?? 'Sem ISBN').padEnd(20),
      b.status.slice(0, 20).padEnd(20),
      b.author.slice(0, 20).padEnd(20)
    ].join(' | ')
  }

  private formatBooksByAuthor(r: BooksByAuthorResult): string {
    return [r.author.slice(0, 40).padEnd(40), r.total_books.padStart(1)].join(
      ' '
    )
  }

  private async renderLoans(): Promise<void> {
    const loans = await this.loanService.list({ notReturned: true })

    this.display(this.loanHeader)
    this.display('='.repeat(this.loanHeader.length))

    if (loans.length === 0) {
      this.display('Nenhum empréstimo ativo.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    loans.forEach((loan) => {
      this.display(this.formatLoan(loan))
    })
    this.display('\n')

    await this.prompt('Pressione ENTER para continuar:')
  }

  private async renderAvailableBooks(): Promise<void> {
    const books = await this.bookService.listAvailable()

    if (books.length === 0) {
      this.display('Nenhum livro disponível.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    books.forEach((book) => {
      this.display(this.formatBooks(book))
    })

    await this.prompt('Pressione ENTER para continuar:')
  }

  private async renderAuthorBooks(): Promise<void> {
    const authors = await this.authorService.countBooksByAuthor()

    if (authors.length === 0) {
      this.display('Nenhum livro disponível.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    authors.forEach((author) => {
      this.display(this.formatBooksByAuthor(author))
    })

    await this.prompt('Pressione ENTER para continuar:')
  }

  protected async renderMenu(): Promise<void> {
    this.display('\n=== Empréstimos ===\n')
    this.display('1. Empréstimos ativos')
    this.display('2. Livros disponíveis')
    this.display('3. Qtd de livros por autor')
    this.display('4. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        await this.renderLoans()
        break
      case '2':
        await this.renderAvailableBooks()
        break
      case '3':
        await this.renderAuthorBooks()
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
