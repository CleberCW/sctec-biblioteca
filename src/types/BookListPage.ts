import { BookSearchResult } from '../models/BookSearchResult'

export interface BookListPage {
  books: BookSearchResult[]
  page: number
  totalPages: number
}
