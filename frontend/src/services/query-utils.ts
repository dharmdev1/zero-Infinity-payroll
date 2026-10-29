/** Shared paging/filter helpers for demo repositories and future API parity. */
export interface ListQuery {
  search?: string
  page?: number
  pageSize?: number
  [key: string]: string | number | undefined | null | boolean
}

export function normalizeQuery(query: ListQuery): { search: string; page: number; pageSize: number; filters: Record<string, string> } {
  const search = (query.search ?? '').toString().trim().toLowerCase()
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.max(1, Number(query.pageSize ?? 10))
  const filters: Record<string, string> = {}
  for (const [k, v] of Object.entries(query)) {
    if (['search', 'page', 'pageSize'].includes(k)) continue
    if (v == null || v === '' || typeof v === 'boolean') continue
    filters[k] = v.toString().toLowerCase()
  }
  return { search, page, pageSize, filters }
}

/** Generic filter: matches the item's JSON-serialized searchable fields. */
export function searchAcross<T>(items: readonly T[], search: string, fields: Array<keyof T>): T[] {
  if (!search) return [...items]
  return items.filter((item) => fields.some((f) => String(item[f] ?? '').toLowerCase().includes(search)))
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const total = items.length
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, page, pageSize }
}

export function demoDelay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
