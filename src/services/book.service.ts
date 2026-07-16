import { randomInt } from 'node:crypto'

import { AuthorService } from './author.service'
import { BrasilApiIsbnProvider } from './isbn.service'
import { NativeHttpService } from '../@common/http/impl/native-http.service'
import { Result } from '../@common/result/result'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { Book } from '../models/Book'
import { BooksPostgresRepository } from '../repositories/books.repository'

export class BookService {
  constructor(
    private readonly bookRepository: BooksPostgresRepository,
    private readonly authorService: AuthorService
  ) {}

  async list(): Promise<Book[]> {
    return this.bookRepository.list()
  }

  private generateBarcode(length = 12): string {
    let barcode = ''

    for (let i = 0; i < length; i++) {
      barcode += String(randomInt(10))
    }

    return barcode
  }

  async add(book: CreateBookInputDTO): Promise<Result<void>> {
    const authorId = await this.authorService.findOrCreate({
      name: book.author
    })

    let barcode: string

    do {
      barcode = this.generateBarcode()
    } while (await this.bookRepository.barcodeExists(barcode))

    const bookToAdd: CreateBookRepositoryDTO = {
      ...book,
      authorId,
      barcode
    }

    await this.bookRepository.addBook(bookToAdd)

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

  async getPage(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize

    const books = await this.bookRepository.list(pageSize, offset)
    const total = await this.bookRepository.count()

    return {
      books,
      totalPages: Math.ceil(total / pageSize),
      page
    }
  }

  async findMetadata(isbn: string) {
    const isbnProvider = new BrasilApiIsbnProvider(new NativeHttpService())
    return isbnProvider.findByIsbn(isbn)
  }
}
