export interface CreateBookInputDTO {
  isbn?: string
  title: string
  author: string
  description?: string
  publish_year?: number
  edition?: number
  num_pages?: number
  tags?: string[]
}
