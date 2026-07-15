import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { AuthorService } from '../services/author.service'
import { BookService } from '../services/book.service'

export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly authorService: AuthorService
  ) {}

  list() {
    return this.bookService.list()
  }

  add(book: CreateBookInputDTO) {
    return this.bookService.add(book)
  }

  remove(id: number) {
    return this.bookService.remove(id)
  }
}
