import { CreateAuthorDTO } from '../../dtos/CreateAuthorDTO'
import { CreateBookRepositoryDTO } from '../../dtos/CreateBookRepository'
import { Author } from '../../models/Author'
import { Book } from '../../models/Book'

export interface BookRepository {
  list(offset: number, limit: number): Promise<Book[]>
  addBook(book: CreateBookRepositoryDTO): Promise<void>
  removeBook(id: number): Promise<void>
}

export interface AuthorRepository {
  list(): Promise<Author[]>
  addAuthor(author: CreateAuthorDTO): Promise<number>
  removeAuthor(id: number): Promise<void>
}
