import type { ReactNode } from 'react'

/** Small label/value cell used in detail grids across profiles, dialogs and documents. */
export function DataField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-ink">{value}</p>
    </div>
  )
}

export interface DefinitionRow {
  label: string
  value: ReactNode
}

/** Justified label/value rows used in metadata cards (task details, document metadata, audits). */
export function DefinitionList({ rows }: { rows: DefinitionRow[] }) {
  return (
    <dl className="space-y-3 text-[13px]">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted">{r.label}</dt>
          <dd className="min-w-0 text-right font-medium text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Alternating definition rows separated by hairlines (self-service profile pages). */
export function HairlineList({ rows }: { rows: DefinitionRow[] }) {
  return (
    <dl className="space-y-3 text-[13px]">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3 border-b border-line pb-2 last:border-b-0">
          <dt className="text-muted">{r.label}</dt>
          <dd className="max-w-[60%] text-right font-medium text-ink">{r.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Compact metadata grid used by employee overview cards. */
export function FieldGrid({ fields, cols = 3 }: { fields: DefinitionRow[]; cols?: 2 | 3 }) {
  return (
    <div className={`mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''}`}>
      {fields.map((f) => (
        <DataField key={f.label} label={f.label} value={f.value} />
      ))}
    </div>
  )
}
