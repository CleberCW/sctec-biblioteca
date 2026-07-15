import { BookStatus } from '../enums/BookStatus'

export interface Book {
  id: number
  createdAt: Date
  barcode: string
  name: string
  authorId: number
  description: string | null
  publishYear: number | null
  edition: number | null
  numPages: number | null
  status: BookStatus
}
