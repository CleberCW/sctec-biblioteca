import { Result } from '../@common/result/result'
import { Book } from '../models/Book'
import { BookRepository } from '../repositories/domain/repository'

export class BoxService {
  constructor(private readonly bookRepository: BookRepository) {}

  async list(): Promise<Book[]> {
    return this.bookRepository.list()
  }

  async add(book: Book): Promise<Result<void, 'duplicate'>> {
    const books = await this.bookRepository.list()

    const isDuplicate = books.some(
      (p) => p.openLibraryId === book.openLibraryId
    )

    if (isDuplicate) {
      return Result.fail('duplicate')
    }

    await this.bookRepository.addBook(book)

    return Result.void()
  }

  async remove(id: number): Promise<Result<void, 'not-found'>> {
    const box = await this.bookRepository.list()

    const exists = box.some((p) => p.id === id)

    if (!exists) {
      return Result.fail('not-found')
    }

    await this.bookRepository.removeBook(id)

    return Result.void()
  }
}
