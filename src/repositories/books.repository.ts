import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { BookRepository } from './domain/repository'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookStatus } from '../enums/BookStatus'
import { BookSearchResult } from '../models/BookSearchResult'

export class BooksPostgresRepository implements BookRepository {
  async list(pageSize = 10, offset = 0): Promise<BookSearchResult[]> {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT
          b.*,
          a.name AS author,
          string_agg(t.name, ', ' ORDER BY t.name) AS tags
      FROM books b
      JOIN authors a
          ON a.id = b.author_id
      LEFT JOIN book_tags bt
          ON bt.book_id = b.id
      LEFT JOIN tags t
          ON t.id = bt.tag_id
      GROUP BY b.id, a.name
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

  async addBook(
    book: CreateBookRepositoryDTO,
    client?: PoolClient
  ): Promise<number> {
    try {
      const db = client ?? pool

      const { rows } = await db.query<{ id: number }>(
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
      )
      RETURNING id;
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

      return rows[0].id
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
          string_agg(t.name, ', ' ORDER BY t.name) AS tags
      FROM books b
      JOIN authors a
          ON a.id = b.author_id
      JOIN book_tags bt
          ON bt.book_id = b.id
      JOIN tags t
          ON t.id = bt.tag_id
      WHERE EXISTS (
          SELECT 1
          FROM book_tags bt2
          JOIN tags t2
              ON t2.id = bt2.tag_id
          WHERE bt2.book_id = b.id
            AND t2.name ILIKE '%' || $1 || '%'
      )
      GROUP BY b.id, a.name;`,
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

  async update(
    id: number,
    dto: EditBookInputDTO,
    client?: PoolClient
  ): Promise<void> {
    const db = client ?? pool
    await db.query(
      `
    UPDATE books
    SET
        isbn = $2,
        title = $3,
        description = $4,
        publish_year = $5,
        edition = $6,
        num_pages = $7,
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

  async replaceTags(
    bookId: number,
    tagIds: number[],
    client?: PoolClient
  ): Promise<void> {
    const db = client ?? pool

    await db.query(
      `
    DELETE FROM book_tags
    WHERE book_id = $1;
    `,
      [bookId]
    )

    for (const tagId of tagIds) {
      await db.query(
        `
      INSERT INTO book_tags (book_id, tag_id)
      VALUES ($1, $2);
      `,
        [bookId, tagId]
      )
    }
  }

  async addTag(
    bookId: number,
    tagId: number,
    client?: PoolClient
  ): Promise<void> {
    try {
      const db = client ?? pool

      await db.query(
        `
      INSERT INTO book_tags (book_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
      `,
        [bookId, tagId]
      )
    } catch (err) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'ADD BOOK TAG: '
      })
    }
  }

  async listAvailable() {
    try {
      const result = await pool.query<BookSearchResult>(
        `
      SELECT
          b.*,
          a.name AS author
      FROM books b
      JOIN authors a
          ON a.id = b.author_id
      WHERE b.status = 'available'
      `
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'BOOKS: '
      })
    }
  }
}
