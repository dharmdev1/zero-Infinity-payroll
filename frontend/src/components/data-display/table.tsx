import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/base'

export interface Column<T> {
  key: string
  header: string
  className?: string
  render?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>
  rows: T[]
  rowKey: (row: T) => string
  sort?: { key: string; dir: 'asc' | 'desc' } | null
  onSortChange?: (key: string) => void
  loading?: boolean
  emptyState?: ReactNode
  rowClassName?: (row: T) => string
  caption?: string
  footer?: ReactNode
}

export function DataTable<T>({ columns, rows, rowKey, sort, onSortChange, loading, emptyState, rowClassName, caption, footer }: DataTableProps<T>) {
  return (
    <div className="rounded-xl border border-line bg-white shadow-card">
      {caption ? <div className="px-1 pb-0 text-xs text-muted sr-only">{caption}</div> : null}
      <div className="scroll-x min-w-full">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm" role="table">
          <thead>
            <tr className="bg-[#F8FAFD]">
              {columns.map((col) => {
                const sortable = !!col.sortValue && !!onSortChange
                const isSorted = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={isSorted ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="table-caption whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {sortable ? (
                      <button type="button" className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink" onClick={() => col.sortValue && onSortChange?.(col.key)}>
                        {col.header}
                        <span aria-hidden="true" className={cn('text-[9px]', isSorted ? 'text-brand-600' : 'text-muted/50')}>
                          {isSorted && sort?.dir === 'desc' ? '▼' : '▲'}
                        </span>
                      </button>
                    ) : (
                      <span className="uppercase tracking-wider">{col.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, r) => (
                  <tr key={`sk-${r}`} className="border-t border-line">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <Skeleton className="h-3.5 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={rowKey(row)} className={cn('border-t border-line first:border-t-0 hover:bg-canvas/60', i % 2 === 0 && 'bg-white', rowClassName?.(row))}>
                    {columns.map((col) => (
                      <td key={col.key} className={cn('whitespace-nowrap px-4 py-3.5 align-middle text-[13px] text-ink-deep', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 ? <div>{emptyState}</div> : null}
      {footer}
    </div>
  )
}

export function Pagination({ page, pageSize, total, onPage, countsLabel }: { page: number; pageSize: number; total: number; onPage: (page: number) => void; countsLabel?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-xs text-muted">
        Showing {start}–{end} of {total} {countsLabel ?? 'records'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-canvas disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="min-w-[52px] rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-center text-[13px] font-semibold text-brand-600">
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-canvas disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
