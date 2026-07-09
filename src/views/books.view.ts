import { ConsoleView } from './console.view'
import { BookController } from '../controllers/book.controller'
import { Book } from '../models/Book'

export class BoxView extends ConsoleView {
  constructor(private readonly bookController: BookController) {
    super()
  }

  private formatBooks(b: Book): string {
    return `#${String(b.id)} - ${b.name} | OpenLibraryID: ${b.openLibraryId} | Autor: ${String(b.authorId)} | Descrição: ${(b.description ?? 'Sem descrição').slice(0, 50)}.`
  }

  private async handleList(): Promise<void> {
    const result = await this.bookController.list()

    this.display('=================================================')

    if (result.length === 0) {
      this.display('Nenhum livro encontrado.')
    } else {
      this.display('Foi encontrado livro')
      result.forEach((b) => {
        this.display(this.formatBooks(b))
      })
    }

    this.display('=================================================')
    await this.prompt('Pressione ENTER para continuar:')
  }

  protected async update(): Promise<void> {
    this.display('\n=== Gerenciar Box ===')
    this.display('L. Listar Livros')
    this.display('F. ...')
    this.display('T. ...')
    this.display('B. Sair')

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'L':
        await this.handleList()
        break
      case 'F':
        break
      case 'T':
        break
      case 'B':
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }
}
