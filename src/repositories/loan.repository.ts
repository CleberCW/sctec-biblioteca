import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { CreateLoanRepositoryDTO } from '../dtos/CreateLoanRepositoryDTO'
import { BaseException } from '../errors/base.exception'
import { LoanRepository } from './domain/repository'
import { BookLoanResult } from '../models/BookLoanSearchResult'

export class LoanPostgresRepository implements LoanRepository {
  async list(pageSize?: number, offset = 0): Promise<BookLoanResult[]> {
    try {
      let query = `
      SELECT
        bl.*,
        b.name AS title,
        u.name AS "userName"
      FROM book_loans bl
      JOIN books b ON b.id = bl.book_id
      JOIN users u ON u.id = bl.user_id
      ORDER BY bl.id;
    `

      const params: number[] = []

      if (pageSize !== undefined) {
        query += ` LIMIT $1 OFFSET $2`
        params.push(pageSize, offset)
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
