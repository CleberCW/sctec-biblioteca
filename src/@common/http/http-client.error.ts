export interface HttpClientErrorOptions {
  error: string
  message?: string
  status?: number
  data?: unknown
  requestFired: boolean
}
export class HttpClientError extends Error {
  /**
   * Additional error message explaining how the HTTP service views the error. e.g 'Could not make request'
   */
  error: string

  /**
   * Data received as response from the http call
   */
  data?: unknown

  /**
   * Status code that represents this error
   */
  status?: number

  /**
   * Control flag indicating whether the error was generated after a successful http call or not.
   */
  requestFired?: boolean

  constructor({
    error,
    message,
    status,
    data,
    requestFired
  }: HttpClientErrorOptions) {
    super(message ?? 'No message')
    this.error = error
    this.data = data
    this.status = status
    this.requestFired = requestFired
  }

  static isError(error: unknown): error is HttpClientError {
    return error instanceof HttpClientError
  }

  static fromError(error: Error): HttpClientError {
    const e = new HttpClientError({
      requestFired: false,
      error: error.name,
      message: `HTTP CLIENT ERROR: ${error.message}`
    })

    e.stack = error.stack
    return e
  }
}
