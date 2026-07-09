import 'dotenv/config'

import { initDatabase } from './config/db'
import { BookController } from './controllers/book.controller'
import { BooksPostgresRepository } from './repositories/books.repository'
import { BookService } from './services/book.service'
import { BoxView } from './views/books.view'
import { MenuView } from './views/menu.view'

initDatabase().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error('An unexpected error occurred', err)
  }
})

function bootstrap() {
  const bookService = new BookService(new BooksPostgresRepository())
  const bookController = new BookController(bookService)
  const booksView = new BoxView(bookController)

  const menuView = new MenuView(booksView)

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
