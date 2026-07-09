import { QueryResult } from 'pg'

import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { BookRepository } from './domain/repository'
import { CreateBookDTO } from '../dtos/CreateBookDTO'
import { Book } from '../models/Book'

export class BooksPostgresRepository implements BookRepository {
  async list(): Promise<Book[]> {
    try {
      const result: QueryResult<Book> = await pool.query<Book>(
        `
        SELECT *
        FROM books
        ORDER BY id;
        `
      )

      return result.rows
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
