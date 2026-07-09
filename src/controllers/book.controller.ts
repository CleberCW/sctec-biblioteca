import { Book } from '../models/Book'
import { BookService } from '../services/book.service'

export class BookController {
  constructor(private readonly bookService: BookService) {}

  list() {
    return this.bookService.list()
  }

  add(book: Book) {
    return this.bookService.add(book)
  }

  remove(id: number) {
    return this.bookService.remove(id)
  }
}
