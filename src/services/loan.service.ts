import { Result } from '../@common/result/result'
import { pool } from '../config/db'
import { CreateLoanInputDTO } from '../dtos/CreateLoanInputDTO'
import { BookStatus } from '../enums/BookStatus'
import { BaseException } from '../errors/base.exception'
import { BookLoanResult } from '../models/BookLoanSearchResult'
import { ListLoansOptions } from '../models/ListLoanOptions'
import { BooksPostgresRepository } from '../repositories/books.repository'
import { LoanPostgresRepository } from '../repositories/loan.repository'
import { UserPostgresRepository } from '../repositories/user.repository'

export class LoanService {
  constructor(
    private readonly loanRepository: LoanPostgresRepository,
    private readonly userRepository: UserPostgresRepository,
    private readonly bookRepository: BooksPostgresRepository
  ) {}

  async list(options?: ListLoansOptions): Promise<BookLoanResult[]> {
    return this.loanRepository.list(options)
  }

  async getPage(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize
    const books = await this.loanRepository.list({
      pageSize: pageSize,
      offset: offset
    })
    const total = await this.loanRepository.count()
    return { books, totalPages: Math.ceil(total / pageSize), page }
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
      await client.query('ROLLBACK').catch(() => {
        // Ignora erro
      })
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'ADD LOAN: '
      })
    } finally {
      client.release()
    }
  }

  async finishLoan(
    id: number,
    bookId: number,
    date: Date
  ): Promise<Result<void, 'not-found'>> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const loanId = await this.loanRepository.finishLoan(id, date, client)
      if (!loanId) {
        throw new Error('not-found')
      }

      await this.bookRepository.updateStatus(
        bookId,
        BookStatus.AVAILABLE,
        client
      )

      await client.query('COMMIT')
      return Result.void()
    } catch (err: unknown) {
      await client.query('ROLLBACK').catch(() => {
        // Ignora erro
      })

      if (err instanceof Error && err.message === 'not-found') {
        return Result.fail('not-found')
      }

      throw BaseException.fromUnknown(err, {
        messagePrefix: 'FINISH LOAN: '
      })
    } finally {
      client.release()
    }
  }

  async findLoansByBookId(bookId: number): Promise<BookLoanResult[]> {
    return this.loanRepository.findByBookId(bookId)
  }
}
