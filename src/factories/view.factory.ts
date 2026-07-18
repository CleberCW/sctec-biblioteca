import { Book } from '../models/Book'
import { BookService } from '../services/book.service'
import { UserService } from '../services/user.service'
import { SelectBooksView } from '../views/books.select.view'

export class ViewFactory {
  constructor(
    private readonly bookService: BookService,
    private readonly userService: UserService
  ) {}

  createSelectBooksView(book: Book): SelectBooksView {
    return new SelectBooksView(book, this)
  }
}
