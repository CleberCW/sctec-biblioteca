import { ConsoleView } from './console.view'
import { CreateLoanInputDTO } from '../dtos/CreateLoanInputDTO'
import { BaseException } from '../errors/base.exception'
import { BookService } from '../services/book.service'
import { LoanService } from '../services/loan.service'
import { UserService } from '../services/user.service'

export class LoanAddView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(
    private readonly loanService: LoanService,
    private readonly bookService: BookService,
    private readonly userService: UserService
  ) {
    super()
  }

  async start(initial?: Partial<CreateLoanInputDTO>): Promise<void> {
    await this.renderPage(initial)
  }

  private async renderPage(
    initial?: Partial<CreateLoanInputDTO>
  ): Promise<void> {
    this.display('\n=== Realizar Empréstimo ===\n')

    try {
      const inputBarcode = initial?.bookBarcode ?? (await this.askBookBarcode())

      const book = await this.bookService.searchByBarcode(inputBarcode)

      if (!book) {
        throw new Error('Livro não encontrado')
      }

      const inputCpf = initial?.cpf ?? (await this.askClientCpf())
      const user = await this.userService.searchByCpf(inputCpf)

      if (!user) {
        throw new Error('Livro não encontrado')
      }

      const loanDate = new Date()

      const returnDate = new Date(loanDate)
      returnDate.setDate(returnDate.getDate() + 7)

      const loan: CreateLoanInputDTO = {
        bookBarcode: inputBarcode,
        cpf: inputCpf,
        loanDate: loanDate,
        returnDate: returnDate,
        bookName: book.name,
        userName: user.name
      }

      await this.confirmLoan(loan)
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'INSERT LOAN: '
      })
    }
  }

  private async askBookBarcode(current?: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Book barcode${current ? ` [${current}]` : ''}: `)
      ).trim()

      return input === '' ? (current ?? '') : input
    }
  }

  private async askClientCpf(current?: string): Promise<string> {
    const input = (
      await this.prompt(`CPF${current ? ` [${current}]` : ''}: `)
    ).trim()

    return input === '' ? (current ?? '') : input
  }

  private async confirmLoan(loan: CreateLoanInputDTO): Promise<void> {
    this.display(`
            =============================================================
    
            Livro: ${loan.bookName},
            Solicitante: ${loan.userName},
            Data de empréstimo: ${String(loan.loanDate)}
            Data de retorno: ${String(loan.returnDate)},
    
            =============================================================
            
            `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        await this.loanService.addLoan(loan)
        this.display('Empréstimo cadastrado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
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
