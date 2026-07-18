export interface BookLoan {
  id: number
  user_id: number
  book_id: number
  loan_date: Date
  due_date: Date
  returned_at: Date | null
}
