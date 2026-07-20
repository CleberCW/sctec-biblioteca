import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { CreateLoanRepositoryDTO } from '../dtos/CreateLoanRepositoryDTO'
import { BaseException } from '../errors/base.exception'
import { LoanRepository } from './domain/repository'
import { BookLoanResult } from '../models/BookLoanSearchResult'

export class LoanPostgresRepository implements LoanRepository {
  async list(options?: {
    pageSize?: number
    offset?: number
    userId?: number
    notReturned?: boolean
  }): Promise<BookLoanResult[]> {
    try {
      let query = `
      SELECT
        bl.*,
        b.title,
        u.name AS "userName"
      FROM book_loans bl
      JOIN books b ON b.id = bl.book_id
      JOIN users u ON u.id = bl.user_id
    `

      const params: unknown[] = []

      const conditions: string[] = []

      if (options?.userId !== undefined) {
        params.push(options.userId)
        conditions.push(`u.id = $${String(params.length)}`)
      }

      if (options?.notReturned) {
        conditions.push(`bl.returned_at IS NULL`)
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      query += ` ORDER BY bl.id`

      if (options?.pageSize !== undefined) {
        params.push(options.pageSize)
        query += ` LIMIT $${String(params.length)}`

        params.push(options.offset ?? 0)
        query += ` OFFSET $${String(params.length)}`
      }

      const result = await pool.query<BookLoanResult>(query, params)

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

  async finishLoan(
    id: number,
    date: Date,
    client?: PoolClient
  ): Promise<number> {
    try {
      const db = client ?? pool
      const result = await db.query<{ id: number }>(
        `
      UPDATE book_loans
      SET returned_at = $1
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

  async findByBookId(
    bookId: number,
    client?: PoolClient
  ): Promise<BookLoanResult[]> {
    const db = client ?? pool

    const result = await db.query<BookLoanResult>(
      `
    SELECT
      bl.*,
      b.title,
      u.name AS "userName"
    FROM book_loans bl
    JOIN books b
      ON b.id = bl.book_id
    JOIN users u
      ON u.id = bl.user_id
    WHERE bl.book_id = $1
    ORDER BY bl.loan_date DESC;
    `,
      [bookId]
    )

    return result.rows
  }
}
