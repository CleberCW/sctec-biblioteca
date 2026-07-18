import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { CreateLoanRepositoryDTO } from '../dtos/CreateLoanRepositoryDTO'
import { BaseException } from '../errors/base.exception'
import { BookLoan } from '../models/BookLoan'
import { LoanRepository } from './domain/repository'

export class LoanPostgresRepository implements LoanRepository {
  async list(pageSize = 0, offset = 10): Promise<BookLoan[]> {
    try {
      const result = await pool.query<BookLoan>(
        `
      SELECT
        bl.*,
        a.name AS author
        b.name AS title
      FROM book_loans bl
      JOIN books b ON b.id = bl.book_id
      JOIN authors a ON a.id = bl.author_id
      ORDER BY score DESC;
      LIMIT $1 OFFSET $2;
      `,
        [pageSize, offset]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'LOANS: '
      })
    }
  }

  async count(): Promise<number> {
    try {
      const result = await pool.query<{ count: string }>(
        `
      SELECT COUNT(*) AS count
      FROM book_loans;
      `
      )

      return Number(result.rows[0].count)
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'LOANS: '
      })
    }
  }

  async addLoan(
    loan: CreateLoanRepositoryDTO,
    client: PoolClient
  ): Promise<number> {
    try {
      const result = await client.query<{ id: number }>(
        `
      INSERT INTO book_loans (book_id, user_id, loan_date, due_date)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
      `,
        [loan.bookId, loan.userId, loan.loanDate, loan.returnDate]
      )

      return result.rows[0].id
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'INSERT LOAN: '
      })
    }
  }

  async finishLoan(id: number, date: Date): Promise<number> {
    try {
      const result = await pool.query<{ id: number }>(
        `
      UPDATE book_loans
      SET return_date = $1
      WHERE id = $2
      RETURNING id;
      `,
        [date, id]
      )

      return result.rows[0].id
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'FINISH LOAN: '
      })
    }
  }
}
