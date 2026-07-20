import { PoolClient } from 'pg'

import { AuthorService } from './author.service'
import { BrasilApiIsbnProvider } from './isbn.service'
import { LoanService } from './loan.service'
import { TagService } from './tag.service'
import { NativeHttpService } from '../@common/http/impl/native-http.service'
import { Result } from '../@common/result/result'
import { pool } from '../config/db'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { CreateBookRepositoryDTO } from '../dtos/CreateBookRepository'
import { EditBookInputDTO } from '../dtos/EditBookInputDTO'
import { BaseException } from '../errors/base.exception'
import { BookSearchResult } from '../models/BookSearchResult'
import { BooksPostgresRepository } from '../repositories/books.repository'
import { BookValidator } from '../validators/BookValidator'

export class BookService {
  constructor(
    private readonly bookRepository: BooksPostgresRepository,
    private readonly authorService: AuthorService,
    private readonly tagService: TagService,
    private readonly loanService: LoanService
  ) {}

  async list(pageSize?: number, offset?: number): Promise<BookSearchResult[]> {
    return this.bookRepository.list(pageSize, offset)
  }

  async listAvailable(): Promise<BookSearchResult[]> {
    return this.bookRepository.listAvailable()
  }

  async add(book: CreateBookInputDTO): Promise<Result<void>> {
    if (book.isbn && !BookValidator.validateIsbn(book.isbn)) {
      throw new BaseException({ cause: 'ISBN inválido' })
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const authorId = await this.authorService.findOrCreate(
        { name: book.author },
        client
      )

      const bookToAdd: CreateBookRepositoryDTO = { ...book, authorId }
      const bookId = await this.bookRepository.addBook(bookToAdd, client)

      for (const tag of book.tags ?? []) {
        const returnedTag = await this.tagService.findOrCreate(tag, client)
        await this.bookRepository.addTag(bookId, returnedTag.id, client)
      }

      await client.query('COMMIT')
      return Result.void()
    } catch (err: unknown) {
      await client.query('ROLLBACK').catch(() => {
        // Ignora falha
      })
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'ADD BOOK: '
      })
    } finally {
      client.release()
    }
  }

  async remove(id: number): Promise<void> {
    const results = await this.loanService.findLoansByBookId(id)
    if (results.length) {
      throw new BaseException({
        cause: `Esse livro já teve empréstimos. Altere o status para 'lost' no lugar`
      })
    }
    await this.bookRepository.removeBook(id)
  }

  async getPage(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize
    const books = await this.bookRepository.list(pageSize, offset)
    const total = await this.bookRepository.count()
    return { books, totalPages: Math.ceil(total / pageSize), page }
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
  ): Promise<BookSearchResult[] | null> {
    if (!BookValidator.validateIsbn(isbn)) {
      return null
    }
    return this.bookRepository.searchByIsbn(isbn, client)
  }

  async searchByTitle(title: string): Promise<BookSearchResult[] | null> {
    if (!BookValidator.validateTitle(title)) {
      return null
    }
    return this.bookRepository.searchByTitle(title)
  }

  async searchByAuthor(author: string): Promise<BookSearchResult[] | null> {
    if (!BookValidator.validadeAuthor(author)) {
      return null
    }
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

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const authorName = info.author

      await this.authorService.findOrCreate({ name: authorName }, client)

      await this.bookRepository.update(
        id,
        {
          ...info,
          author: authorName
        },
        client
      )

      if (info.tagNames.length) {
        const tags = []
        for (const tagName of info.tagNames) {
          const tag = await this.tagService.findOrCreate(tagName, client)
          tags.push(tag)
        }

        const tagIds = [...new Set(tags.map((tag) => tag.id))]

        await this.bookRepository.replaceTags(id, tagIds, client)
      }

      await client.query('COMMIT')
      return Result.void()
    } catch (err: unknown) {
      await client.query('ROLLBACK').catch(() => {
        // Ignora falha
      })
      throw BaseException.fromUnknown(err, {
        messagePrefix: 'EDIT BOOK: '
      })
    } finally {
      client.release()
    }
  }
}
