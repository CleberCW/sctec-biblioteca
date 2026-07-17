import { ConsoleView } from './console.view'

export class UsersListView extends ConsoleView {
  protected update(): void | Promise<void> {
    throw new Error('Method not implemented.')
  }
}
