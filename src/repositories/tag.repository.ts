import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { BaseException } from '../errors/base.exception'
import { Tag } from '../models/Tag'
import { TagRepository } from './domain/repository'

export class TagsPostgresRepository implements TagRepository {
  async add(tagname: string, client?: PoolClient): Promise<Tag> {
    try {
      const db = client ?? pool

      const result = await db.query<Tag>(
        `
        INSERT INTO tags (name)
        VALUES ($1)
        RETURNING *;
        `,
        [tagname]
      )

      return result.rows[0]
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'INSERT TAG: '
      })
    }
  }

  async findById(id: number, client?: PoolClient): Promise<Tag | null> {
    try {
      const db = client ?? pool

      const result = await db.query<Tag>(
        `
        SELECT *
        FROM tags
        WHERE id = $1;
        `,
        [id]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH TAG BY ID: '
      })
    }
  }

  async findByName(name: string, client?: PoolClient): Promise<Tag | null> {
    try {
      const db = client ?? pool

      const result = await db.query<Tag>(
        `
        SELECT *
        FROM tags
        WHERE LOWER(name) = LOWER($1);
        `,
        [name]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH TAG BY NAME: '
      })
    }
  }

  async list(client?: PoolClient): Promise<Tag[]> {
    try {
      const db = client ?? pool

      const result = await db.query<Tag>(
        `
        SELECT *
        FROM tags
        ORDER BY name;
        `
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'LIST TAGS: '
      })
    }
  }

  async remove(id: number, client?: PoolClient): Promise<void> {
    try {
      const db = client ?? pool

      await db.query(
        `
        DELETE FROM tags
        WHERE id = $1;
        `,
        [id]
      )
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'DELETE TAG: '
      })
    }
  }
}
