import { PoolClient } from 'pg'

import { Result } from '../@common/result/result'
import { pool } from '../config/db'
import { CreateUserDTO } from '../dtos/CreateUserDTO'
import { EditUserInputDTO } from '../dtos/EditUserDTO'
import { BaseException } from '../errors/base.exception'
import { User } from '../models/User'
import { UserPostgresRepository } from '../repositories/user.repository'
import { UserValidator } from '../validators/UserValidator'

export class UserService {
  constructor(private readonly userRepository: UserPostgresRepository) {}

  async list(): Promise<User[]> {
    return this.userRepository.list()
  }

  async add(user: CreateUserDTO): Promise<Result<number>> {
    const userId = await this.userRepository.addUser(user)
    return Result.ok(userId)
  }

  async remove(id: number): Promise<Result<number, 'not-found'>> {
    const userId = await this.userRepository.removeUser(id)

    if (!userId) {
      return Result.fail('not-found')
    }

    return Result.ok(userId)
  }

  async getPage(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize

    const users = await this.userRepository.list(pageSize, offset)
    const total = await this.userRepository.count()

    return {
      users,
      totalPages: Math.ceil(total / pageSize),
      page
    }
  }

  async searchByCpf(cpf: string, client?: PoolClient): Promise<User | null> {
    if (!UserValidator.validateCpf(cpf)) {
      throw new BaseException({
        cause: 'CPF inválido'
      })
    }
    return this.userRepository.searchByCpf(cpf, client)
  }

  async searchByName(name: string): Promise<User[]> {
    return this.userRepository.searchByName(name)
  }

  async searchByEmail(email: string): Promise<User[]> {
    if (!UserValidator.validateEmail(email)) {
      throw new BaseException({
        cause: 'Email inválido'
      })
    }
    return this.userRepository.searchByEmail(email)
  }

  async searchByPhone(phone: string): Promise<User[]> {
    if (!UserValidator.validatePhone(phone)) {
      throw new BaseException({
        cause: 'Telefone inválido'
      })
    }
    return this.userRepository.searchByPhone(phone)
  }

  async searchById(id: number, client?: PoolClient): Promise<User | null> {
    const db = client ?? pool

    const result = await db.query<User>(
      `
    SELECT *
    FROM users
    WHERE id = $1;
    `,
      [id]
    )

    return result.rows[0] ?? null
  }

  async editUser(
    id: number,
    info: EditUserInputDTO
  ): Promise<Result<void, 'not-found'>> {
    const current = await this.userRepository.searchById(id)

    if (!current) {
      return Result.fail('not-found')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      await this.userRepository.update(id, info, client)

      await client.query('COMMIT')

      return Result.void()
    } catch (err: unknown) {
      await client.query('ROLLBACK')

      throw BaseException.fromUnknown(err, {
        messagePrefix: 'EDIT USER: '
      })
    } finally {
      client.release()
    }
  }
}
