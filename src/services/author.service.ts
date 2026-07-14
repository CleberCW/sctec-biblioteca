import { Result } from '../@common/result/result'
import { Author } from '../models/Author'
import { AuthorPostgresRepository } from '../repositories/author.repository'

export class AuthorService {
  constructor(private readonly authorRepository: AuthorPostgresRepository) {}

  async list(): Promise<Author[]> {
    return this.authorRepository.list()
  }

  async add(author: Author): Promise<Result<void, 'duplicate'>> {
    const existingAuthor = await this.authorRepository.findByName(author.name)

    const isDuplicate = !!existingAuthor

    if (isDuplicate) {
      return Result.fail('duplicate')
    }

    await this.authorRepository.addAuthor(author)

    return Result.void()
  }
}
