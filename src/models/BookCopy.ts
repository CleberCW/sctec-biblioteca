import { BookStatus } from '../enums/BookStatus'
import { Condition } from '../enums/Conditions'

export interface BookCopy {
  id: number
  bookId: number
  barcode: string
  status: BookStatus
  condition: Condition
  acquiredAt: Date
}
