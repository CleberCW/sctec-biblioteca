import 'dotenv/config'

import { initDatabase } from './config/db'
import { ViewFactory } from './factories/view.factory'
import { AuthorPostgresRepository } from './repositories/author.repository'
import { BooksPostgresRepository } from './repositories/books.repository'
import { UserPostgresRepository } from './repositories/user.repository'
import { AuthorService } from './services/author.service'
import { BookService } from './services/book.service'
import { UserService } from './services/user.service'
import { BooksAddView } from './views/books.add.view'
import { BooksListView } from './views/books.explorer.view'
import { BooksSearchView } from './views/books.search.view'
import { BooksView } from './views/books.view'
import { MenuView } from './views/menu.view'
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
  const bookService = new BookService(
    new BooksPostgresRepository(),
    authorService
  )
  const booksListView = new BooksListView(bookService)
  const booksAddView = new BooksAddView(bookService)
  const userService = new UserService(new UserPostgresRepository())
  const viewFactory = new ViewFactory(bookService, userService)
  const booksSearchView = new BooksSearchView(bookService, viewFactory)
  const booksView = new BooksView(booksListView, booksAddView, booksSearchView)

  const usersView = new UsersView() // TODO: Implement UsersView

  const menuView = new MenuView(booksView, usersView)

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
