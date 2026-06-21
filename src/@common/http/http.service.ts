export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'

type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'
  | 'formdata'

export type HttpRequestOptions<TBody = unknown> = HttpRequestConfig & {
  url: string
  method: HttpMethods
  data?: TBody
}

export interface HttpRequestConfig {
  headers?: Record<string, string | number | boolean>
  auth?: {
    username: string
    password: string
  }
  params?: Record<string, unknown>
  responseType?: ResponseType
}

export interface HttpResponse<TData = unknown, TBody = unknown> {
  data: TData
  status: number
  statusText: string
  headers: Record<string, string>
  requestOptions: HttpRequestOptions<TBody>
}

export interface HttpService {
  request<TData, TBody = unknown>(
    requestOptions: HttpRequestOptions<TBody>
  ): Promise<HttpResponse<TData, TBody>>

  get<TData, TBody = unknown>(
    url: string,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>>

  post<TData, TBody = unknown>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>>

  put<TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>>

  patch<TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>>

  delete<TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<TData, TBody>>
}
