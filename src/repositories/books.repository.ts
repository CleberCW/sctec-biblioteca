import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { BookRepository } from './domain/repository'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookStatus } from '../enums/BookStatus'
import { BookSearchResult } from '../models/BookSearchResult'

export class BooksPostgresRepository implements BookRepository {
  async list(pageSize = 0, offset = 10): Promise<BookSearchResult[]> {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT
        b.*,
        a.name AS author
      FROM books b
      JOIN authors a ON a.id = b.author_id
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
        isbn,
        title,
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
          book.isbn,
          book.title,
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

  async isbnExists(barcode: string): Promise<boolean> {
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

  async searchByIsbn(
    isbn: string,
    client?: PoolClient
  ): Promise<BookSearchResult[]> {
    try {
      const db = client ?? pool
      const result = await db.query<BookSearchResult>(
        `SELECT
        b.*
        a.name AS author,
        FROM books b
        JOIN authors a
            ON a.id = b.author_id
        WHERE b.isbn = $1;`,
        [isbn]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY ISBN: '
      })
    }
  }

  async searchById(
    id: number,
    client?: PoolClient
  ): Promise<BookSearchResult | null> {
    try {
      const db = client ?? pool
      const result = await db.query<BookSearchResult>(
        `
      SELECT
        b.*,
        a.name AS author
      FROM books b
      JOIN authors a
          ON a.id = b.author_id
      WHERE b.id = $1;`,
        [id]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY ID: '
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
        similarity(b.title, $1) AS score
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE
        b.title ILIKE '%' || $1 || '%'
        OR b.title % $1
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
      WHERE
          a.name ILIKE '%' || $1 || '%'
          OR a.name % $1
      ORDER BY
          similarity(a.name, $1) DESC;
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
      SELECT
          b.*,
          a.name AS author,
          t.name AS tag
      FROM books b
      JOIN authors a ON a.id = b.author_id
      JOIN book_tags bt
          ON bt.book_id = b.id
      JOIN tags t
          ON t.id = bt.tag_id
      WHERE
          t.name ILIKE '%' || $1 || '%'
      ORDER BY
          b.id ASC;`,
        [keyword]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH BOOK BY KEYWORD: '
      })
    }
  }

  async updateStatus(
    id: number,
    status: BookStatus,
    client: PoolClient
  ): Promise<void> {
    await client.query(
      `
    UPDATE books
    SET status = $2
    WHERE id = $1
    `,
      [id, status]
    )
  }

  async update(id: number, dto: EditBookInputDTO): Promise<void> {
    await pool.query(
      `
    UPDATE books
    SET
        isbn = $2,
        title = $3,
        description = $4,
        publish_year = $5,
        edition = $6,
        num_pages = $7
        last_edited_at = NOW()
    WHERE id = $1;
    `,
      [
        id,
        dto.isbn,
        dto.title,
        dto.description,
        dto.publish_year,
        dto.edition,
        dto.num_pages
      ]
    )
  }
}
