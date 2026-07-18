import { CreateAuthorDTO } from '../../dtos/CreateAuthorDTO'
import { CreateBookRepositoryDTO } from '../../dtos/CreateBookRepository'
import { CreateUserDTO } from '../../dtos/CreateUserDTO'
import { Author } from '../../models/Author'
import { Book } from '../../models/Book'
import { User } from '../../models/User'

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

export interface UserRepository {
  list(): Promise<User[]>
  addUser(user: CreateUserDTO): Promise<number>
  removeUser(id: number): Promise<number | null>
}
