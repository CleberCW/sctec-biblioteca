export interface Book {
  id: number
  createdAt: Date
  openLibraryId: string
  name: string
  authorId: number
  description: string | null
  publishYear: number | null
  edition: number | null
  numPages: number | null
}
