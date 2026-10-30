export type ApiMode = 'demo' | 'http'

export const API_MODE: ApiMode = (import.meta.env.VITE_API_MODE as ApiMode | undefined) === 'http' ? 'http' : 'demo'
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }))
    throw new ApiError(body.detail ?? 'Request failed', response.status)
  }
  return (await response.json()) as T
}
