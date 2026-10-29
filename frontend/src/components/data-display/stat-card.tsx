import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Skeleton, Card } from '@/components/ui/base'

export interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  iconTone?: 'blue' | 'green' | 'purple' | 'orange'
  note?: string
  noteTone?: 'blue' | 'green' | 'orange' | 'red' | 'muted' | 'purple'
  loading?: boolean
}

const ICON_TONES: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-success-tint text-success',
  purple: 'bg-purple-tint text-purple',
  orange: 'bg-warning-tint text-warning',
}

const NOTE_TONES: Record<string, string> = {
  blue: 'text-brand-600',
  green: 'text-success',
  orange: 'text-warning',
  red: 'text-danger',
  muted: 'text-muted',
  purple: 'text-purple',
}

export function StatCard({ label, value, icon, iconTone = 'blue', note, noteTone = 'muted', loading }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', ICON_TONES[iconTone])}>{icon}</span>
      </div>
      <p className="mt-4 text-[13px] text-muted">{label}</p>
      {loading ? <Skeleton className="mt-1 h-7 w-28" /> : <p className="mt-1 text-[26px] font-bold leading-tight text-ink">{value}</p>}
      {note ? <p className={cn('mt-1 text-xs font-medium', NOTE_TONES[noteTone])}>{note}</p> : null}
    </Card>
  )
}

/** Simple SVG bar chart (no chart library) matching the finance snapshot style. */
export interface BarDatum {
  label: string
  value: number
  active?: boolean
}

export function BarChart({ data, height = 150, ariaLabel }: { data: BarDatum[]; height?: number; ariaLabel?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label={ariaLabel ?? 'Bar chart'}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex min-w-4 flex-1 flex-col items-center">
          <div
            className={cn('w-full max-w-4 rounded-md transition-colors', d.active ? 'bg-brand-600' : 'bg-brand-200 hover:bg-brand-100')}
            style={{ height: `${Math.max(4, (d.value / max) * (height - 18))}px` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="mt-1 text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
