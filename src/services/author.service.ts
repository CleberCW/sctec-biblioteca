import { PoolClient } from 'pg'

import { Result } from '../@common/result/result'
import { BooksByAuthorResult } from '../dtos/BooksByAuthorResult'
import { CreateAuthorDTO } from '../dtos/CreateAuthorDTO'
import { Author } from '../models/Author'
import { AuthorPostgresRepository } from '../repositories/author.repository'

export class AuthorService {
  constructor(private readonly authorRepository: AuthorPostgresRepository) {}

  async list(): Promise<Author[]> {
    return this.authorRepository.list()
  }

  async add(author: CreateAuthorDTO): Promise<Result<number>> {
    const existingAuthor = await this.authorRepository.findByName(author.name)

    if (existingAuthor) {
      return Result.ok(existingAuthor.id)
    }

    const newAuthorId = await this.authorRepository.addAuthor(author)
    return Result.ok(newAuthorId)
  }

  async findOrCreate(
    authorData: CreateAuthorDTO,
    client?: PoolClient
  ): Promise<number> {
    try {
      const existingAuthor = await this.authorRepository.findByName(
        authorData.name,
        client
      )

      if (existingAuthor) {
        return existingAuthor.id
      }

      return await this.authorRepository.addAuthor(
        { name: authorData.name },
        client
      )
    } catch (err) {
      // Se falhar devido a uma constraint UNIQUE no banco (autor já inserido por outra thread/conexão)
      const fallbackAuthor = await this.authorRepository.findByName(
        authorData.name,
        client
      )

      if (fallbackAuthor) {
        return fallbackAuthor.id
      }

      throw err // Se for outro erro qualquer, repassa a exceção
    }
  }

  async countBooksByAuthor(): Promise<BooksByAuthorResult[]> {
    return this.authorRepository.booksCount()
  }
}
