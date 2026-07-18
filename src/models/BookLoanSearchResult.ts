import { BookLoan } from './BookLoan'

export interface BookLoanResult extends BookLoan {
  userName: string
  title: string
}
