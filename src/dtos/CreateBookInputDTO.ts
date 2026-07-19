export interface CreateBookInputDTO {
  isbn?: string
  title: string
  author: string
  description?: string
  publishYear?: number
  edition?: number
  numPages?: number
}
