import { BookFormView } from './book.form.view'
import { CreateBookInputDTO } from '../dtos/CreateBookInputDTO'
import { UserCancelledException } from '../errors/user.canceled.exception'
import { BookService } from '../services/book.service'
import { BookValidator } from '../validators/BookValidator'

export class BooksAddView extends BookFormView {
  static readonly QUIT_SYMBOL = 'Q'

  constructor(private readonly bookService: BookService) {
    super()
  }

  private async registerManually(
    initial?: Partial<CreateBookInputDTO>
  ): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')
    this.display('(Digite Q para cancelar a operação)\n')

    const book: CreateBookInputDTO = {
      title: '',
      author: '',
      description: undefined,
      publish_year: undefined,
      edition: undefined,
      num_pages: undefined,
      ...initial
    }

    try {
      await this.fillBookData(book)
      book.tags = await this.askTags(book.tags)
    } catch (err) {
      if (err instanceof UserCancelledException) {
        this.exit()
        return
      }

      throw err
    }

    await this.confirmBook(book)
  }

  private async askTags(current: string[] = []): Promise<string[]> {
    for (;;) {
      const input = (
        await this.prompt(
          `Tags${current.length ? ` [${current.join(', ')}]` : ''} (separadas por vírgula): `
        )
      ).trim()

      this.checkCancelled(input)

      if (input === '') {
        return current
      }

      const tags = input
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')

      if (tags.length === 0) {
        this.display('Informe ao menos uma tag válida.')
        continue
      }

      return [...new Set(tags)]
    }
  }

  private async confirmBook(book: CreateBookInputDTO): Promise<void> {
    this.display(`
        =============================================================

        Nome: ${book.title},
        Autor: ${book.author},
        Descrição: ${book.description ?? 'N/A'},
        Ano de publicação: ${String(book.publish_year ?? 'N/A')},
        Edição: ${String(book.edition ?? 'N/A')},
        Número de páginas: ${String(book.num_pages ?? 'N/A')},
        Tag(s): ${book.tags?.join(', ') ?? 'N/A'},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C':
        try {
          await this.bookService.add(book)
        } catch (err) {
          if (err instanceof Error) {
            this.display(err.message)
          }

          await this.prompt('Pressione ENTER para continuar:')
        }
        this.display('Livro cadastrado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
    }
  }

  private async registerByIsbn(): Promise<void> {
    this.display('\n=== Cadastrar Livro por ISBN ===\n')

    const isbn = (await this.prompt('ISBN: ')).trim()

    if (!BookValidator.validateIsbn(isbn)) {
      this.display('ISBN inválido.\n')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    const metadata = await this.bookService.findMetadata(isbn)

    if (!metadata) {
      this.display('Nenhum livro encontrado para o ISBN informado.\n')
      await this.prompt('Pressione ENTER para continuar:')
      return
    }

    this.display(`
        =============================================================

        ISBN: ${metadata.isbn}
        Título: ${metadata.title}${metadata.subtitle ? ` (${metadata.subtitle})` : ''},
        Autor: ${metadata.authors[0] ?? 'Desconhecido'},
        Descrição: ${metadata.synopsis ?? 'N/A'},
        Ano de publicação: ${metadata.year ? String(metadata.year) : 'N/A'}, 
        Número de páginas: ${metadata.pageCount ? String(metadata.pageCount) : 'N/A'},
        Tag(s): ${metadata.subjects.join(', ')},

        =============================================================
        
        `)

    this.display(`[C] Confirmar | [D] Cancelar | [E] Editar manualmente`)

    const option = await this.prompt('Escolha uma opção: ')

    switch (option.trim().toUpperCase()) {
      case 'C': {
        const bookToAdd: CreateBookInputDTO = {
          isbn: metadata.isbn,
          title: metadata.title,
          author: metadata.authors[0] ?? 'Desconhecido',
          description: metadata.synopsis ?? undefined,
          publish_year: metadata.year ?? undefined,
          edition: undefined,
          num_pages: metadata.pageCount ?? undefined,
          tags: metadata.subjects
        }
        await this.bookService.add(bookToAdd)
        this.display('Livro cadastrado com sucesso!')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break
      }
      case 'D':
        this.display('Operação cancelada')
        await this.prompt('Pressione ENTER para continuar:')
        this.exit()
        break

      case 'E':
        await this.registerManually({
          isbn: metadata.isbn,
          title: metadata.title,
          author: metadata.authors[0] ?? 'Desconhecido',
          description: metadata.synopsis ?? undefined,
          publish_year: metadata.year ?? undefined,
          edition: undefined,
          num_pages: metadata.pageCount ?? undefined,
          tags: metadata.subjects
        })
        this.exit()
        break
      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }

    this.exit()
  }

  private async renderPage(): Promise<void> {
    this.display('\n=== Cadastrar Livro ===\n')
    this.display('[1] Buscar por ISBN')
    this.display('[2] Cadastrar manualmente')
    this.display('[Q] Voltar')

    const option = (await this.prompt('Escolha uma opção: '))
      .trim()
      .toUpperCase()

    switch (option) {
      case '1':
        await this.registerByIsbn()
        break

      case '2':
        await this.registerManually()
        break

      case 'Q':
        this.exit()
        break

      default:
        this.display('Opção inválida.')
        await this.prompt('Pressione ENTER para continuar:')
    }
  }

  protected async update(): Promise<void> {
    await this.renderPage()
  }
}
