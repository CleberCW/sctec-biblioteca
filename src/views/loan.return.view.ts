import { ConsoleView } from './console.view'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { LoanService } from '../services/loan.service'
import { UserService } from '../services/user.service'

export class LoanReturnView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly loanService: LoanService,
    private readonly userService: UserService
  ) {
    super()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Baixar Empréstimo ===\n')

    const inputCpf = await this.askClientCpf()
    const user = await this.userService.searchByCpf(inputCpf)

    if (!user) {
      this.display('Usuário não encontrado.')
      await this.prompt('Pressione ENTER para continuar...')
      this.exit()
      return
    }

    const results = await this.loanService.list({
      userId: user.id,
      notReturned: true
    })

    await this.renderResults(results)
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

  private async renderResults(results: BookLoanResult[]): Promise<void> {
    this.display(this.center(' Resultado da pesquisa ', this.header.length))

    this.display(this.header)
    this.display('='.repeat(this.header.length))

    if (results.length === 0) {
      this.display('Nenhum empréstimo encontrado.')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    results.forEach((loan) => {
      this.display(this.formatLoan(loan))
    })

    for (;;) {
      const input = await this.prompt(
        '\nDigite o ID do empréstimo ou Q para voltar: '
      )

      if (input === 'Q' || input === 'q' || input === '') {
        return
      }

      const id = Number(input)

      if (Number.isNaN(id)) {
        this.display('ID inválido.')
        continue
      }

      const loan = results.find((b) => b.id === id)

      if (!loan) {
        this.display('Digite o ID do empréstimo para continuar.')
        continue
      }

      await this.returnLoan(loan)
      return
    }
  }

  private async askClientCpf(current?: string): Promise<string> {
    const input = (
      await this.prompt(`CPF${current ? ` [${current}]` : ''}: `)
    ).trim()

    return input === '' ? (current ?? '') : input
  }

  private async returnLoan(loan: BookLoanResult): Promise<void> {
    const dateNow = new Date()

    this.display(`
            =============================================================
    
            Livro: ${loan.title},
            Solicitante: ${loan.userName},
            Data de empréstimo: ${loan.loan_date.toLocaleDateString('pt-BR')},
            Data de vencimento: ${loan.due_date.toLocaleDateString('pt-BR')},
            Data de retorno: ${dateNow.toLocaleDateString('pt-BR')},

            ${loan.due_date < dateNow ? `EMPRÉSTIMO EM ATRASO, COBRAR MULTA` : ''}
    
            =============================================================
            
            `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        await this.loanService.finishLoan(loan.id, loan.book_id, dateNow)
        this.display('Empréstimo baixado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        break
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        break
    }

    this.exit()
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
