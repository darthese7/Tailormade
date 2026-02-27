export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  headers?: Record<string, string>
  token?: string
  signal?: AbortSignal
  expectJson?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalized}`, window.location.origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return API_BASE_URL ? url.toString() : `${normalized}${url.search}`
}

function pickMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const value = Reflect.get(payload, 'message')
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return fallback
}

async function parseResponse(response: Response): Promise<{
  payload: unknown
  isJson: boolean
}> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      const payload = await response.json()
      return { payload, isJson: true }
    } catch {
      return { payload: null, isJson: false }
    }
  }
  const text = await response.text()
  return { payload: text || null, isJson: false }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    headers,
    token,
    signal,
    expectJson = true,
  } = options
  const url = buildUrl(path, query)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new NetworkError(error instanceof Error ? error.message : undefined)
  }

  const { payload, isJson } = await parseResponse(response)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      pickMessage(payload, `Request failed with status ${response.status}`),
      payload,
    )
  }

  if (expectJson && !isJson) {
    throw new ApiError(
      502,
      'Unexpected response format from server. Expected JSON.',
      payload,
    )
  }

  return payload as T
}

export const apiClient = {
  request,
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, body, method: 'POST' }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, body, method: 'PATCH' }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
