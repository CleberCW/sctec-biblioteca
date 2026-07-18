import { Book } from '../models/Book'
import { BookService } from '../services/book.service'
import { LoanService } from '../services/loan.service'
import { UserService } from '../services/user.service'
import { BooksSearchView } from '../views/books.search.view'
import { SelectBooksView } from '../views/books.select.view'
import { LoanAddView } from '../views/loan.add.view'

export class ViewFactory {
  constructor(
    private readonly bookService: BookService,
    private readonly userService: UserService,
    private readonly loanService: LoanService
  ) {}

  createLoanAddView(): LoanAddView {
    return new LoanAddView(this.loanService, this.bookService, this.userService)
  }

  createSelectBooksView(book: Book): SelectBooksView {
    return new SelectBooksView(book, this)
  }

  createBooksSearchView(): BooksSearchView {
    return new BooksSearchView(this.bookService, this)
  }
}
