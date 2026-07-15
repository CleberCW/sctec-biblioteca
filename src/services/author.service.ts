import { Result } from '../@common/result/result'
import { CreateAuthorDTO } from '../dtos/CreateAuthorDTO'
import { Author } from '../models/Author'
import { AuthorPostgresRepository } from '../repositories/author.repository'

export class AuthorService {
  constructor(private readonly authorRepository: AuthorPostgresRepository) {}

  async list(): Promise<Author[]> {
    return this.authorRepository.list()
  }

  async add(author: CreateAuthorDTO): Promise<Result<number>> {
    const authorId =
      (await this.authorRepository.findByName(author.name))?.id ??
      (await this.authorRepository.addAuthor({ name: author.name }))

    await this.authorRepository.addAuthor(author)

    return Result.ok(authorId)
  }

  async findOrCreate(name: CreateAuthorDTO): Promise<number> {
    const authorId =
      (await this.authorRepository.findByName(name.name))?.id ??
      (await this.authorRepository.addAuthor({ name: name.name }))

    return authorId
  }
}
