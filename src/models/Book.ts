export interface Book {
  id: number
  createdAt: Date
  openLibraryId: string
  name: string
  authorId: number
  description: string | null
  firstPublishYear: number | null
  editions: number | null
  numPages: number | null
}
