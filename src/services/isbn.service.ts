import { HttpClientError } from '../@common/http/http-client.error'
import { NativeHttpService } from '../@common/http/impl/native-http.service'
import { BaseException } from '../errors/base.exception'
import { BookMetadata } from '../models/BookMetadata'

interface IsbnProvider {
  findByIsbn(isbn: string): Promise<BookMetadata | null>
}

export class BrasilApiIsbnProvider implements IsbnProvider {
  constructor(private readonly http: NativeHttpService) {}

  async findByIsbn(isbn: string): Promise<BookMetadata | null> {
    try {
      const response = await this.http.get<never, BookMetadata>(
        `https://brasilapi.com.br/api/isbn/v1/${isbn}`
      )

      return response.data
    } catch (error) {
      if (HttpClientError.isError(error)) {
        if (error.status === 400 || error.status === 404) {
          return null
        }
      }

      throw BaseException.fromUnknown(error, {
        messagePrefix: 'ISBN_PROVIDER: '
      })
    }
  }
}
