export interface CreateBookRepositoryDTO {
  name: string
  authorId: number
  barcode: string
  description?: string
  publishYear?: number
  edition?: number
  numPages?: number
}
