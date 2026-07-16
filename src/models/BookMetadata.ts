export interface BookMetadata {
  isbn: string
  title: string
  subtitle: string | null
  authors: string[]
  publisher: string | null
  synopsis: string | null
  dimensions: string | null
  year: number | null
  pageCount: number | null
  subjects: string[]
}
