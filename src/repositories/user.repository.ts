import { pool } from '../config/db'
import { CreateUserRepositoryDTO } from '../dtos/CreateUserRepository'
import { BaseException } from '../errors/base.exception'
import { User } from '../models/User'
import { UserRepository } from './domain/repository'

export class UserPostgresRepository implements UserRepository {
  async list(pageSize = 0, offset = 10): Promise<User[]> {
    try {
      const result = await pool.query<User>(
        `
      SELECT *
      FROM users
      ORDER BY id
      LIMIT $1 OFFSET $2;
      `,
        [pageSize, offset]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'USERS: '
      })
    }
  }

  async count(): Promise<number> {
    try {
      const result = await pool.query<{ count: string }>(
        `
      SELECT COUNT(*) AS count
      FROM users;
      `
      )

      return Number(result.rows[0].count)
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'USERS: '
      })
    }
  }

  async findByName(name: string): Promise<User | null> {
    try {
      const result = await pool.query<User>(
        `
      SELECT *
      FROM users
      WHERE name = $1;
      `,
        [name]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'FIND USER BY NAME: '
      })
    }
  }

  async addUser(user: CreateUserRepositoryDTO): Promise<number> {
    const result = await pool.query<{ id: number }>(
      `
    INSERT INTO users (name)
    VALUES ($1)
    RETURNING id;
    `,
      [user.name]
    )

    return result.rows[0].id
  }

  async removeUser(id: number): Promise<number | null> {
    try {
      const result = await pool.query<{ id: number }>(
        `
      DELETE FROM users
      WHERE id = $1
      RETURNING id;
      `,
        [id]
      )

      return result.rows[0]?.id ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'DELETE AUTHOR: '
      })
    }
  }
}
