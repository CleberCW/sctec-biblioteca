import { Book } from '../models/Book'
import { User } from '../models/User'
import { BookService } from '../services/book.service'
import { UserService } from '../services/user.service'
import { SelectBooksView } from '../views/books.select.view'
import { SelectUserView } from '../views/users.select.view'

export class ViewFactory {
  constructor(
    private readonly bookService: BookService,
    private readonly userService: UserService
  ) {}

  createSelectBooksView(book: Book): SelectBooksView {
    return new SelectBooksView(book, this)
  }

  createSelectUsersView(user: User): SelectUserView {
    return new SelectUserView(user, this)
  }
}
