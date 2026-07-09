import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { BookRepository } from './domain/repository'
import { CreateBookDTO } from '../dtos/CreateBookDTO'
import { Book } from '../models/Book'

export class BooksPostgresRepository implements BookRepository {
  async list(pageSize = 0, offset = 10): Promise<Book[]> {
    try {
      const result = await pool.query<Book>(
        `
      SELECT *
      FROM books
      ORDER BY id
      LIMIT $1 OFFSET $2;
      `,
        [pageSize, offset]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'BOOKS: '
      })
    }
  }

  async count(): Promise<number> {
    try {
      const result = await pool.query<{ count: string }>(
        `
      SELECT COUNT(*) AS count
      FROM books;
      `
      )

      return Number(result.rows[0].count)
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'BOOKS: '
      })
    }
  }

  async addBook(book: CreateBookDTO): Promise<void> {
    try {
      await pool.query(
        `
      INSERT INTO books (
        openlibrary_id,
        name,
        author_id,
        description,
        firstPublishYear,
        editions,
        numPages
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7
      );
      `,
        [
          book.openLibraryId,
          book.name,
          book.authorId,
          book.description,
          book.firstPublishYear,
          book.editions,
          book.numPages
        ]
      )
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'INSERT BOOK: '
      })
    }
  }

  async removeBook(id: number): Promise<void> {
    try {
      await pool.query(
        `
      DELETE FROM books
      WHERE id = $1;
      `,
        [id]
      )
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'DELETE BOOK: '
      })
    }
  }
}
