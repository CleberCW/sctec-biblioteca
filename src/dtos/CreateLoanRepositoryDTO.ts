export interface CreateLoanRepositoryDTO {
  userId: number
  bookId: number
  loanDate: Date
  returnDate: Date | null
}
