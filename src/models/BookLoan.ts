export interface BookLoan {
  id: number
  userId: number
  bookCopyId: number
  loanDate: Date
  dueDate: Date | null
  returnedAt: Date | null
}
