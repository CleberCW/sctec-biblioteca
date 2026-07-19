import { Result } from '../@common/result/result'
import { pool } from '../config/db'
import { CreateLoanInputDTO } from '../dtos/CreateLoanInputDTO'
import { BookStatus } from '../enums/BookStatus'
import { BaseException } from '../errors/base.exception'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { BooksPostgresRepository } from '../repositories/books.repository'
import { LoanPostgresRepository } from '../repositories/loan.repository'
import { UserPostgresRepository } from '../repositories/user.repository'

export class LoanService {
  constructor(
    private readonly loanRepository: LoanPostgresRepository,
    private readonly userRepository: UserPostgresRepository,
    private readonly bookRepository: BooksPostgresRepository
  ) {}

  async list(): Promise<BookLoanResult[]> {
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

      const book = await this.bookRepository.searchById(
        Number(dto.bookId),
        client
      )

      if (!book) {
        throw new Error('Livro não encontrado')
      }

      if (book.status !== BookStatus.AVAILABLE) {
        throw new Error('Livro não disponível')
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

      await this.bookRepository.updateStatus(book.id, BookStatus.LOANED, client)

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
