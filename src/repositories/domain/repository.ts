import { Author } from '../../models/Author'
import { Book } from '../../models/Book'

export interface BookRepository {
  list(offset: number, limit: number): Promise<Book[]>
  addBook(book: Book): Promise<void>
  removeBook(id: number): Promise<void>
}

export interface AuthorRepository {
  list(): Promise<Author[]>
  addAuthor(author: Author): Promise<void>
  removeAuthor(id: number): Promise<void>
}
