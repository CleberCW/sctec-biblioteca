import { User } from '../models/User'

export interface UserListPage {
  users: User[]
  page: number
  totalPages: number
}
