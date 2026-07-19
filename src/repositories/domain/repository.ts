import { PoolClient } from 'pg'

import { CreateAuthorDTO } from '../../dtos/CreateAuthorDTO'
import { CreateBookRepositoryDTO } from '../../dtos/CreateBookRepository'
import { CreateLoanRepositoryDTO } from '../../dtos/CreateLoanRepositoryDTO'
import { CreateUserDTO } from '../../dtos/CreateUserDTO'
import { Author } from '../../models/Author'
import { Book } from '../../models/Book'
import { BookLoan } from '../../models/BookLoan'
import { ListLoansOptions } from '../../models/ListLoanOptions'
import { Tag } from '../../models/Tag'
import { User } from '../../models/User'

export interface BookRepository {
  list(offset: number, limit: number): Promise<Book[]>
  addBook(book: CreateBookRepositoryDTO): Promise<number>
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

export interface LoanRepository {
  list(options?: ListLoansOptions): Promise<BookLoan[]>
  count(): Promise<number>
  addLoan(loan: CreateLoanRepositoryDTO, client: PoolClient): Promise<number>
  finishLoan(id: number, date: Date): Promise<number>
}

export interface TagRepository {
  add(tagname: string, client?: PoolClient): Promise<Tag>

  findById(id: number, client?: PoolClient): Promise<Tag | null>

  findByName(name: string, client?: PoolClient): Promise<Tag | null>

  list(client?: PoolClient): Promise<Tag[]>

  remove(id: number, client?: PoolClient): Promise<void>
}
