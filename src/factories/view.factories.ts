import { BookSearchResult } from '../models/BookSearchResult'
import { User } from '../models/User'
import { BookService } from '../services/book.service'
import { LoanService } from '../services/loan.service'
import { UserService } from '../services/user.service'
import { BookEditView } from '../views/book.edit.view'
import { BooksSearchView } from '../views/books.search.view'
import { SelectBooksView } from '../views/books.select.view'
import { LoanAddView } from '../views/loan.add.view'
import { UserEditView } from '../views/user.edit.view'
import { SelectUserView } from '../views/users.select.view'

export class ViewFactory {
  constructor(
    private readonly bookService: BookService,
    private readonly userService: UserService,
    private readonly loanService: LoanService
  ) {}

  createLoanAddView(): LoanAddView {
    return new LoanAddView(this.loanService, this.bookService, this.userService)
  }

  createSelectBooksView(book: BookSearchResult): SelectBooksView {
    return new SelectBooksView(book, this, this.bookService)
  }

  createBooksSearchView(): BooksSearchView {
    return new BooksSearchView(this.bookService, this)
  }

  createSelectUsersView(user: User): SelectUserView {
    return new SelectUserView(user, this)
  }

  createEditBookView(book: BookSearchResult): BookEditView {
    return new BookEditView(book, this.bookService)
  }

  createEditUserView(user: User): UserEditView {
    return new UserEditView(user, this.userService)
  }
}
