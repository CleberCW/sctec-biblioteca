import { pool } from '../config/db'
import { CreateAuthorDTO } from '../dtos/CreateAuthorDTO'
import { BaseException } from '../errors/base.exception'
import { Author } from '../models/Author'
import { AuthorRepository } from './domain/repository'

export class AuthorPostgresRepository implements AuthorRepository {
  async list(pageSize = 0, offset = 10): Promise<Author[]> {
    try {
      const result = await pool.query<Author>(
        `
      SELECT *
      FROM authors
      ORDER BY id
      LIMIT $1 OFFSET $2;
      `,
        [pageSize, offset]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'AUTHORS: '
      })
    }
  }

  async count(): Promise<number> {
    try {
      const result = await pool.query<{ count: string }>(
        `
      SELECT COUNT(*) AS count
      FROM authors;
      `
      )

      return Number(result.rows[0].count)
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'AUTHORS: '
      })
    }
  }

  async findByName(name: string): Promise<Author | null> {
    try {
      const result = await pool.query<Author>(
        `
      SELECT *
      FROM authors
      WHERE name = $1;
      `,
        [name]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'FIND AUTHOR BY NAME: '
      })
    }
  }

  async addAuthor(author: CreateAuthorDTO): Promise<number> {
    const result = await pool.query<{ id: number }>(
      `
    INSERT INTO authors (name)
    VALUES ($1)
    RETURNING id;
    `,
      [author.name]
    )

    return result.rows[0].id
  }

  async removeAuthor(id: number): Promise<void> {
    try {
      await pool.query(
        `
      DELETE FROM authors
      WHERE id = $1;
      `,
        [id]
      )
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'DELETE AUTHOR: '
      })
    }
  }
}
