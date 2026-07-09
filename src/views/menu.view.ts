import { BooksView } from './books.view'
import { ConsoleView } from './console.view'

export class MenuView extends ConsoleView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly booksView: BooksView) {
    super(true)
  }

  private readonly MENU_OPTIONS = {
    '1': 'Livros',
    '2': '...',
    [MenuView.QUIT_SYMBOL]: '🚪 Sair do Sistema'
  } as const

  private isOptionValid(
    option: string
  ): option is keyof typeof this.MENU_OPTIONS {
    if (option in this.MENU_OPTIONS) {
      return true
    }

    return false
  }

  private async selectOption(option: string): Promise<void> {
    if (!this.isOptionValid(option)) {
      this.display(
        `${option} não é uma opção válida. Aperte ENTER para continuar.`
      )
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    switch (option) {
      case '1':
        await this.booksView.start()
        break
      case '2':
        break
    }
  }

  private showMenu(): void {
    this.display('\n======================================')
    this.display(' 🏛️  Biblioteca  🏛️')
    this.display('======================================')
    Object.entries(this.MENU_OPTIONS).forEach(([key, value]) => {
      this.display(`${key}. ${value}`)
    })
    this.display('======================================')
  }

  protected async update() {
    this.showMenu()

    const option = await this.prompt('Escolha uma opção:')

    if (
      option === ConsoleView.ABORT_SENTINEL ||
      option.toUpperCase() === MenuView.QUIT_SYMBOL
    ) {
      this.exit()
      return
    }

    await this.selectOption(option)
  }

  onEnter() {
    this.display('Bem vindo ao Mini Projeto!')
  }

  onExit(): void {
    this.display('Finalizando... Até mais!')
  }
}
