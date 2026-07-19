import { PoolClient } from 'pg'

import { AuthorService } from './author.service'
import { BrasilApiIsbnProvider } from './isbn.service'
import { NativeHttpService } from '../@common/http/impl/native-http.service'
import { Result } from '../@common/result/result'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BookSearchResult } from '../models/BookSearchResult'
import { BooksPostgresRepository } from '../repositories/books.repository'

export class BookService {
  constructor(
    private readonly bookRepository: BooksPostgresRepository,
    private readonly authorService: AuthorService
  ) {}

  async list(): Promise<BookSearchResult[]> {
    return this.bookRepository.list()
  }

  async add(book: CreateBookInputDTO): Promise<Result<void>> {
    const authorId = await this.authorService.findOrCreate({
      name: book.author
    })

    const bookToAdd: CreateBookRepositoryDTO = {
      ...book,
      authorId
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

  async searchById(id: number): Promise<BookSearchResult | null> {
    return this.bookRepository.searchById(id)
  }

  async searchByIsbn(
    isbn: string,
    client?: PoolClient
  ): Promise<BookSearchResult[]> {
    return this.bookRepository.searchByIsbn(isbn, client)
  }

  async searchByTitle(title: string): Promise<BookSearchResult[]> {
    return this.bookRepository.searchByTitle(title)
  }

  async searchByAuthor(author: string): Promise<BookSearchResult[]> {
    return this.bookRepository.searchByAuthor(author)
  }

  async searchByKeyword(keyword: string): Promise<BookSearchResult[]> {
    return this.bookRepository.searchByKeyword(keyword)
  }

  async editBook(
    id: number,
    info: EditBookInputDTO
  ): Promise<Result<void, 'not-found'>> {
    const current = await this.bookRepository.searchById(id)

    if (!current) {
      return Result.fail('not-found')
    }

    await this.bookRepository.update(id, info)

    return Result.void()
  }
}
