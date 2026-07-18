import { ConsoleView } from './console.view'
import { LoanAddView } from './loan.add.view'

export class LoansView extends ConsoleView {
  constructor(private readonly loanAddView: LoanAddView) {
    super()
  }

  protected async renderMenu(): Promise<void> {
    this.display('\n=== Empréstimos ===\n')
    this.display('1. Realizar empréstimo')
    this.display('2. Baixar empréstimo')
    this.display('3. Estender empréstimo')
    this.display('4. Sair')
    this.display('\n==============\n')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case '1':
        await this.loanAddView.start()
        break
      case '2':
        break
      case '3':
        break
      case '4':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }

  protected async update() {
    await this.renderMenu()
  }
}
