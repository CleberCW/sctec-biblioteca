import { ConsoleView } from './console.view'
import { UserCancelledException } from '../errors/user.canceled.exception'
import { UserValidator } from '../validators/UserValidator'

export abstract class UserFormView extends ConsoleView {
  protected async fillUserData<
    T extends {
      cpf: string
      name: string
      phone: string
      email: string
    }
  >(user: T): Promise<T> {
    user.cpf = await this.askCpf(user.cpf)
    user.name = await this.askName(user.name)
    user.phone = await this.askPhone(user.phone)
    user.email = await this.askEmail(user.email)

    return user
  }

  protected async askCpf(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`CPF${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (UserValidator.validateCpf(value)) {
        return value
      }

      this.display('CPF inválido.\n')
    }
  }

  protected async askName(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Nome${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (UserValidator.validateName(value)) {
        return value
      }

      this.display('Nome inválido.\n')
    }
  }

  protected async askPhone(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`Telefone${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (UserValidator.validatePhone(value)) {
        return value
      }

      this.display('Telefone inválido.\n')
    }
  }

  protected async askEmail(current: string): Promise<string> {
    for (;;) {
      const input = (
        await this.prompt(`E-mail${current ? ` [${current}]` : ''}: `)
      ).trim()

      this.checkCancelled(input)

      const value = input === '' ? current : input

      if (UserValidator.validateEmail(value)) {
        return value
      }

      this.display('E-mail inválido.\n')
    }
  }

  protected checkCancelled(input: string): void {
    if (input.trim().toUpperCase() === 'Q') {
      throw new UserCancelledException()
    }
  }
}
