import { PoolClient } from 'pg'

import { pool } from '../config/db'
import { CreateUserDTO } from '../dtos/CreateUserDTO'
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

  async searchByName(name: string): Promise<User[]> {
    try {
      const result = await pool.query<User>(
        `
      SELECT u.*
      FROM users u
      WHERE u.name ILIKE '%' || $1 || '%';
      `,
        [name]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH USER BY NAME: '
      })
    }
  }

  async searchByCpf(cpf: string, client?: PoolClient): Promise<User | null> {
    try {
      const db = client ?? pool

      const result = await db.query<User>(
        `
      SELECT *
      FROM users
      WHERE cpf = $1;
      `,
        [cpf]
      )

      return result.rows[0] ?? null
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH USER BY CPF: '
      })
    }
  }

  async searchByEmail(email: string): Promise<User[]> {
    try {
      const result = await pool.query<User>(
        `
      SELECT *
      FROM users
      WHERE email = $1;
      `,
        [email]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH USER BY EMAIL: '
      })
    }
  }

  async searchByPhone(phone: string): Promise<User[]> {
    try {
      const result = await pool.query<User>(
        `
      SELECT *
      FROM users
      WHERE phone = $1;
      `,
        [phone]
      )

      return result.rows
    } catch (err: unknown) {
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'SEARCH USER BY PHONE: '
      })
    }
  }

  async addUser(user: CreateUserDTO): Promise<number> {
    const result = await pool.query<{ id: number }>(
      `
    INSERT INTO users (name, cpf, email, phone)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
    `,
      [user.name, user.cpf, user.email, user.phone]
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
