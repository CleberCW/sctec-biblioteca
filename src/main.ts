import 'dotenv/config'

import { initDatabase } from './config/db'
import { ViewFactory } from './factories/view.factory'
import { AuthorPostgresRepository } from './repositories/author.repository'
import { BooksPostgresRepository } from './repositories/books.repository'
import { LoanPostgresRepository } from './repositories/loan.repository'
import { UserPostgresRepository } from './repositories/user.repository'
import { AuthorService } from './services/author.service'
import { BookService } from './services/book.service'
import { LoanService } from './services/loan.service'
import { UserService } from './services/user.service'
import { BooksAddView } from './views/books.add.view'
import { BooksListView } from './views/books.explorer.view'
import { BooksSearchView } from './views/books.search.view'
import { BooksView } from './views/books.view'
import { LoanAddView } from './views/loan.add.view'
import { LoansView } from './views/loans.view'
import { MenuView } from './views/menu.view'
import { UserAddView } from './views/users.add.view'
import { UsersListView } from './views/users.explorer.view'
import { UserSearchView } from './views/users.search.view'
import { UsersView } from './views/users.view'

initDatabase().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error('An unexpected error occurred', err)
  }
})

function bootstrap() {
  const authorService = new AuthorService(new AuthorPostgresRepository())
  const bookRepository = new BooksPostgresRepository()
  const loanRepository = new LoanPostgresRepository()
  const userRepository = new UserPostgresRepository()

  const bookService = new BookService(bookRepository, authorService)
  const booksListView = new BooksListView(bookService)
  const booksAddView = new BooksAddView(bookService)
  const userService = new UserService(userRepository)
  const viewFactory = new ViewFactory(bookService, userService)
  const booksSearchView = new BooksSearchView(bookService, viewFactory)
  const booksView = new BooksView(booksListView, booksAddView, booksSearchView)

  const usersListView = new UsersListView()
  const usersSearchView = new UserSearchView(userService, viewFactory)
  const usersAddView = new UserAddView(userService)
  const usersView = new UsersView(usersListView, usersSearchView, usersAddView)

  const loanService = new LoanService(
    loanRepository,
    userRepository,
    bookRepository
  )
  const loansAddView = new LoanAddView(loanService, bookService, userService)
  const loansView = new LoansView(loansAddView)

  const menuView = new MenuView(booksView, usersView, loansView)

  return menuView.start()
}

bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((e: unknown) => {
    console.log('UNHANDLED REJECTION')
    console.error(e)
    process.exit(1)
  })
