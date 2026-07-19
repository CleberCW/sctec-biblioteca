import { BookCondition } from '../enums/BookCondition'
import { BookStatus } from '../enums/BookStatus'
import { Tag } from '../models/Tag'

export interface EditBookInputDTO {
  isbn?: string
  title: string
  author: string
  description?: string
  publish_year?: number
  edition?: number
  num_pages?: number
  status: BookStatus
  condition: BookCondition
  tags?: Tag[]
}
