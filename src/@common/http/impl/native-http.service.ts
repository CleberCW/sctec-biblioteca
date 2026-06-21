import { BaseException } from '../../../errors/base.exception'
import { HttpClientError } from '../http-client.error'
import {
  HttpRequestConfig,
  HttpRequestOptions,
  HttpResponse,
  HttpService
} from '../http.service'

export class NativeHttpService implements HttpService {
  private async fetchRequest<TData, TBody>(
    requestOptions: HttpRequestOptions<TBody>
  ): Promise<HttpResponse<TData, TBody>> {
    try {
      if (requestOptions.responseType === 'stream') {
        throw new Error(
          `'Response type stream is not supported by the' ${NativeHttpService.name}`
        ) // It actually can but I'm too lazy to implement it
      }

      const response = await fetch(
        `${requestOptions.url}${this.parseParams(requestOptions.params)}`,
        {
          method: requestOptions.method,
          headers: this.parseHeaders(requestOptions),
          body: requestOptions.data
            ? JSON.stringify(requestOptions.data)
            : undefined
        }
      )

      if (!response.ok) {
        await this.toHttpClientError(null, response)
      }

      return await this.toHttpResponse(requestOptions, response)
    } catch (error: unknown) {
      if (HttpClientError.isError(error)) {
        throw error
      }
      return await this.toHttpClientError(error)
    }
  }

  private parseHeaders(requestOptions: HttpRequestOptions) {
    const headers: [string, string][] = []
    if (requestOptions.auth) {
      headers.push([
        'Authorization',
        `Basic ${btoa(requestOptions.auth.username + ':' + requestOptions.auth.password)}`
      ])
    }

    if (requestOptions.headers) {
      headers.push(
        ...Object.entries(requestOptions.headers).map<[string, string]>(
          ([key, value]) => [key, value.toString()]
        )
      )
    }

    if (requestOptions.responseType) {
      headers.push(['Accept', requestOptions.responseType])
    }

    return headers
  }

  private parseParams(requestOptions: HttpRequestOptions['params']): string {
    if (!requestOptions) {
      return ''
    }
    const queryParams = Object.entries(requestOptions)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&')

    return `?${queryParams}`
  }

  private async toHttpClientError(
    error?: unknown,
    response?: Response
  ): Promise<never> {
    if (response) {
      const data = await this.handleBody(response)

      throw new HttpClientError({
        status: response.status,
        requestFired: true,
        error: 'Request responded with an error',
        message: 'HTTP CLIENT ERROR: ',
        data
      })
    }

    if (error) {
      const eInstance =
        error instanceof Error ? error : BaseException.fromUnknown(error)

      throw HttpClientError.fromError(eInstance)
    }

    throw new HttpClientError({
      requestFired: false,
      error: 'Unknown error',
      message: 'HTTP CLIENT ERROR: Unknown error'
    })
  }

  private async handleBody(
    response: Response,
    responseType?: HttpRequestConfig['responseType']
  ): Promise<unknown> {
    try {
      const buffer = Buffer.from(await response.arrayBuffer())

      if (!responseType || responseType === 'json') {
        return JSON.parse(buffer.toString())
      }

      return buffer.toString()
    } catch {
      throw new HttpClientError({
        requestFired: true,
        error: 'Request responded with an error',
        status: response.status,
        message: 'HTTP CLIENT ERROR: could not parse response body ',
        data: response.body
      })
    }
  }

  private async toHttpResponse<TData, TBody>(
    requestOptions: HttpRequestOptions<TBody>,
    response: Response
  ): Promise<HttpResponse<TData, TBody>> {
    const headerObject = Object.fromEntries(response.headers.entries())

    const data = await this.handleBody(response, requestOptions.responseType)

    return {
      data: data as TData,
      status: response.status,
      statusText: response.statusText,
      headers: headerObject,
      requestOptions: requestOptions
    }
  }

  request<TBody, TData>(
    requestOptions: HttpRequestOptions<TBody>
  ): Promise<HttpResponse<TData, TBody>> {
    return this.fetchRequest(requestOptions)
  }

  get<TBody, TData>(
    url: string,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>> {
    return this.request({
      ...config,
      url: url,
      method: 'GET'
    })
  }

  post<TBody, TData>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>> {
    return this.request({
      ...config,
      url: url,
      method: 'POST',
      data: body
    })
  }

  put<TBody, TData>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>> {
    return this.request({
      ...config,
      url: url,
      method: 'PUT',
      data: body
    })
  }

  patch<TBody, TData>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>> {
    return this.request({
      ...config,
      url: url,
      method: 'PATCH',
      data: body
    })
  }

  delete<TBody, TData>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>> {
    return this.request({
      ...config,
      url: url,
      method: 'DELETE',
      data: body
    })
  }
}
