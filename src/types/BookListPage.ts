import { Book } from '../models/Book'

export interface BookListPage {
  books: Book[]
  page: number
  totalPages: number
}
