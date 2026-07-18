import { Result } from '../@common/result/result'
import { pool } from '../config/db'
import { CreateLoanInputDTO } from '../dtos/CreateLoanInputDTO'
import { BaseException } from '../errors/base.exception'
import { BookLoan } from '../models/BookLoan'
import { BooksPostgresRepository } from '../repositories/books.repository'
import { LoanPostgresRepository } from '../repositories/loan.repository'
import { UserPostgresRepository } from '../repositories/user.repository'

export class LoanService {
  constructor(
    private readonly loanRepository: LoanPostgresRepository,
    private readonly userRepository: UserPostgresRepository,
    private readonly bookRepository: BooksPostgresRepository
  ) {}

  async list(): Promise<BookLoan[]> {
    return this.loanRepository.list()
  }

  async addLoan(dto: CreateLoanInputDTO): Promise<number> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const user = await this.userRepository.searchByCpf(dto.cpf, client)

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      const book = await this.bookRepository.searchByBarcode(
        dto.bookBarcode,
        client
      )

      if (!book) {
        throw new Error('Livro não encontrado')
      }

      const loanId = await this.loanRepository.addLoan(
        {
          userId: user.id,
          bookId: book.id,
          loanDate: dto.loanDate,
          returnDate: dto.returnDate
        },
        client
      )

      await client.query('COMMIT')

      return loanId
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'ADD LOAN: '
      })
    }
  }

  async finishLoan(
    id: number,
    date: Date
  ): Promise<Result<number, 'not-found'>> {
    const loanId = await this.loanRepository.finishLoan(id, date)

    if (!loanId) {
      return Result.fail('not-found')
    }

    return Result.ok(loanId)
  }
}
