import { BookCondition } from '../enums/BookCondition'
import { BookStatus } from '../enums/BookStatus'

export interface Book {
  id: number
  created_at: Date
  isbn: string | null
  title: string
  author_id: number
  description: string | null
  publish_year: number | null
  edition: number | null
  num_pages: number | null
  status: BookStatus
  condition: BookCondition
}
