import { Book } from './Book'

export interface BookSearchResult extends Book {
  score: number
  author: string
  tags?: string
}
