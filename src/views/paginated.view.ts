import { ConsoleView } from './console.view'

export abstract class PaginatedConsoleView<T, TPage> extends ConsoleView {
  protected page = 1

  protected readonly pageSize = 20

  protected abstract fetchPage(page: number, pageSize: number): Promise<TPage>

  protected abstract getItems(page: TPage): T[]

  protected abstract getCurrentPage(page: TPage): number

  protected abstract getTotalPages(page: TPage): number

  protected abstract formatItem(item: T): string

  protected abstract getHeader(): string

  protected abstract renderFooter(hasPrevious: boolean, hasNext: boolean): void

  protected async handleCustomOption(_option: string): Promise<void> {
    // Caso a view tenha op0ções adicionais
  }

  protected pageData?: TPage

  protected handleNext(): void {
    if (!this.pageData) return

    if (
      this.getCurrentPage(this.pageData) >= this.getTotalPages(this.pageData)
    ) {
      return
    }

    this.page++
  }

  protected handlePrevious(): void {
    if (!this.pageData) return

    if (this.getCurrentPage(this.pageData) <= 1) {
      return
    }

    this.page--
  }

  protected override async update(): Promise<void> {
    await this.renderPage()

    const option = (await this.prompt('Escolha uma opção:'))
      .trim()
      .toUpperCase()

    switch (option) {
      case 'S':
        this.handleNext()
        break

      case 'A':
        this.handlePrevious()
        break

      case 'Q':
        this.exit()
        break

      default:
        await this.handleCustomOption(option)
        break
    }
  }

  protected override async onExit(): Promise<void> {
    this.page = 1
    await super.onExit()
  }

  protected async renderPage() {
    this.pageData = await this.fetchPage(this.page, this.pageSize)

    this.display(this.getHeader())
    this.display('='.repeat(this.getHeader().length))

    const items = this.getItems(this.pageData)

    if (items.length === 0) {
      this.display('Nenhum registro encontrado.')
    } else {
      items.forEach((item) => {
        this.display(this.formatItem(item))
      })
    }

    const hasPrevious = this.getCurrentPage(this.pageData) > 1
    const hasNext =
      this.getCurrentPage(this.pageData) < this.getTotalPages(this.pageData)

    this.renderFooter(hasPrevious, hasNext)
  }
}
