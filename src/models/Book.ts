import { BookStatus } from '../enums/BookStatus'

export interface Book {
  id: number
  createdAt: Date
  isbn: string | null
  title: string
  authorId: number
  description: string | null
  publishYear: number | null
  edition: number | null
  numPages: number | null
  status: BookStatus
}
