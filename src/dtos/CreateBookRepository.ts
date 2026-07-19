export interface CreateBookRepositoryDTO {
  title: string
  authorId: number
  isbn?: string
  description?: string
  publishYear?: number
  edition?: number
  numPages?: number
}
