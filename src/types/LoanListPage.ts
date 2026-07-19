import { BookLoanResult } from '../models/BookLoanSearchResult'

export interface LoanListPage {
  books: BookLoanResult[]
  page: number
  totalPages: number
}
