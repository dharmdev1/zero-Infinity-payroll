/**
 * Single configurable HTTP client for the future FastAPI backend.
 *
 * - Base URL comes from VITE_API_BASE_URL (e.g. http://localhost:8000).
 * - All paths are versioned under /api/v1.
 * - No database credentials or server secrets ever belong in this app; auth
 *   tokens must come from the backend's chosen secure session strategy
 *   (httpOnly cookie) — never from frontend env vars.
 */

export const API_VERSION_PREFIX = '/api/v1'

export type ApiMode = 'demo' | 'api'

export const API_MODE: ApiMode = (import.meta.env.VITE_API_MODE as ApiMode) === 'api' ? 'api' : 'demo'

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function apiUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  const base = `${API_BASE_URL}${API_VERSION_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

async function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
  const res = await fetch(apiUrl(path, query), {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), Accept: 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    onUnauthorized?.()
    throw new ApiError(401, 'unauthorized', 'Your session has expired. Please sign in again.')
  }
  if (!res.ok) {
    let code = 'unknown'
    let message = `Request failed (${res.status})`
    try {
      const payload = (await res.json()) as { code?: string; message?: string; detail?: string }
      code = payload.code ?? code
      message = payload.message ?? payload.detail ?? message
    } catch {
      /* keep defaults */
    }
    throw new ApiError(res.status, code, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
