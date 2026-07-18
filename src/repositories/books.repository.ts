import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { BookRepository } from './domain/repository'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { Book } from '../models/Book'

interface BookSearchResult extends Book {
  score: number
}

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

  async addBook(book: CreateBookRepositoryDTO): Promise<void> {
    try {
      await pool.query(
        `
      INSERT INTO books (
        barcode,
        name,
        author_id,
        description,
        publish_year,
        edition,
        num_pages
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7
      );
      `,
        [
          book.barcode,
          book.name,
          book.authorId,
          book.description,
          book.publishYear,
          book.edition,
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

  async barcodeExists(barcode: string): Promise<boolean> {
    try {
      const result = await pool.query<{ exists: boolean }>(
        `
      SELECT EXISTS (
        SELECT 1
        FROM books
        WHERE barcode = $1
      ) AS exists;
      `,
        [barcode]
      )

      return result.rows[0].exists
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'CHECK BARCODE: '
      })
    }
  }

  async searchByBarcode(
    barcode: string,
    client?: PoolClient
  ): Promise<Book | null> {
    try {
      const db = client ?? pool
      const result = await db.query<Book>(
        `
      SELECT *
      FROM books
      WHERE barcode = $1;
      `,
        [barcode]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY BARCODE: '
      })
    }
  }

  async searchByTitle(title: string): Promise<BookSearchResult[]> {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT
        b.*,
        a.name AS author,
        similarity(b.name, $1) AS score
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE similarity(b.name, $1) > 0.5
      ORDER BY score DESC;
      `,
        [title]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY TITLE: '
      })
    }
  }

  async searchByAuthor(author: string): Promise<BookSearchResult[]> {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT
        b.*,
        a.name AS author,
        similarity(a.name, $1) AS score
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE similarity(a.name, $1) > 0.5
      ORDER BY score DESC;
      `,
        [author]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY AUTHOR: '
      })
    }
  }

  async searchByKeyword(keyword: string): Promise<BookSearchResult[]> {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT *,
       ts_rank(
         to_tsvector('simple', description),
         plainto_tsquery('simple', $1)
       ) AS rank
      FROM books
      WHERE to_tsvector('simple', description)
            @@ plainto_tsquery('simple', $1)
      ORDER BY rank DESC;
      `,
        [keyword]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY KEYWORD: '
      })
    }
  }
}
