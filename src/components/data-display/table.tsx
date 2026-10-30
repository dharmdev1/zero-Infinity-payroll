import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  className?: string
  render?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyState,
  footer,
}: {
  columns: Array<Column<T>>
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyState?: ReactNode
  footer?: ReactNode
}) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const fn = col.sortValue
    return [...rows].sort((a, b) => {
      const va = fn(a)
      const vb = fn(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, sortKey, sortDir, columns])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="scroll-x">
        <table className="w-full border-collapse text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#FAFBFD]">
              {columns.map((col) => {
                const alignCls = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortValue ? (isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                    className={cn(
                      'whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500',
                      alignCls,
                      col.className,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={columns.length} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyState ?? <EmptyState title="No records found" />}</td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/70">
                  {columns.map((col) => {
                    const alignCls = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    const content = col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')
                    return (
                      <td key={col.key} className={cn('px-4 py-3.5 align-middle text-[13px] text-slate-700', alignCls, col.className)}>
                        {content}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </Card>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  countsLabel = 'items',
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  countsLabel?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span className="tabular-nums">
        Showing {start}–{end} of {total} {countsLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span className="px-1 font-medium tabular-nums text-slate-700">
          Page {page} of {totalPages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
