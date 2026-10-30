import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui/base'
import { cn } from '@/utils/cn'

export type StatTone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'muted'

export interface StatCardProps {
  label: string
  value: string
  loading?: boolean
  icon?: ReactNode
  iconTone?: StatTone
  note?: string
  noteTone?: StatTone
  to?: string
}

export function StatCard({
  label,
  value,
  loading = false,
  icon,
  iconTone = 'blue',
  note,
  noteTone = 'muted',
  to,
}: StatCardProps) {
  const iconTones: Record<StatTone, string> = {
    blue: 'bg-blue-50/90 text-blue-600',
    green: 'bg-emerald-50/90 text-emerald-600',
    orange: 'bg-amber-50/90 text-amber-600',
    purple: 'bg-purple-50/90 text-purple-600',
    red: 'bg-rose-50/90 text-rose-600',
    muted: 'bg-slate-100 text-slate-600',
  }
  const valueTones: Record<StatTone, string> = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    orange: 'text-amber-600',
    purple: 'text-purple-600',
    red: 'text-rose-600',
    muted: 'text-slate-900',
  }
  const noteTones: Record<StatTone, string> = {
    blue: 'text-slate-500',
    green: 'text-emerald-600/90',
    orange: 'text-amber-600/90',
    purple: 'text-purple-600/90',
    red: 'text-rose-600/90',
    muted: 'text-slate-400',
  }

  const metricTone = icon ? iconTone : noteTone

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-slate-500 group-hover:text-slate-700">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p
              className={cn(
                'mt-1 truncate text-xl font-bold leading-tight tracking-tight tabular-nums sm:text-2xl',
                valueTones[metricTone],
              )}
            >
              {value}
            </p>
          )}
        </div>
        {icon ? (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
              iconTones[iconTone],
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {note || to ? (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {note ? (
            <p className={cn('min-w-0 truncate text-[11px] font-medium', noteTones[noteTone])}>{note}</p>
          ) : (
            <span />
          )}
          {to ? (
            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="shrink-0 text-slate-400 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600 group-hover:opacity-100"
            />
          ) : null}
        </div>
      ) : null}
    </>
  )

  return (
    <Card
      className={cn(
        'h-full transition-all',
        to
          ? 'group relative p-0 hover:-translate-y-0.5 hover:border-blue-500/35 hover:bg-slate-50/40 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/30'
          : 'p-4 sm:p-5',
      )}
    >
      {to ? (
        <Link
          to={to}
          aria-label={`${label}: ${value}`}
          className="flex h-full flex-col justify-between rounded-[inherit] p-4 focus:outline-none sm:p-5"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  )
}

export interface BarDatum {
  label: string
  value: number
  active?: boolean
}

export function BarChart({
  data,
  ariaLabel,
  height = 96,
}: {
  data: BarDatum[]
  ariaLabel: string
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max(8, Math.round((d.value / max) * 100))
          return (
            <div key={`${d.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end">
              <div
                className={cn('w-full rounded-t-md transition-all', d.active ? 'bg-brand-600' : 'bg-brand-100')}
                style={{ height: `${pct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1">
        {data.map((d, i) => (
          <span key={`lbl-${i}`} className="flex-1 truncate text-center font-mono text-[10px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
