import { Result } from '../@common/result/result'
import { CreateUserRepositoryDTO } from '../dtos/CreateUserRepository'
import { User } from '../models/User'
import { UserPostgresRepository } from '../repositories/user.repository'

export class UserService {
  constructor(private readonly userRepository: UserPostgresRepository) {}

  async list(): Promise<User[]> {
    return this.userRepository.list()
  }

  async add(user: CreateUserRepositoryDTO): Promise<Result<number>> {
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
}
