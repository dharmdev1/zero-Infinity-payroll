import type { ReactNode } from 'react'

export interface FieldRow {
  label: string
  value: ReactNode
}

export function DefinitionList({ rows }: { rows: FieldRow[] }) {
  return (
    <dl className="space-y-3 text-[13px]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start justify-between gap-4">
          <dt className="text-muted">{r.label}</dt>
          <dd className="text-right font-medium text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function HairlineList({ rows }: { rows: FieldRow[] }) {
  return (
    <dl className="divide-y divide-line text-[13px]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="text-muted">{r.label}</dt>
          <dd className="text-right font-medium text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
