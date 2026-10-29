import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-500/40 shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-canvas disabled:text-muted disabled:bg-canvas/60',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-danger text-white hover:bg-[#A82F37] active:bg-[#90282F] disabled:opacity-50',
  success: 'bg-success text-white hover:brightness-95 disabled:opacity-50',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? <Spinner className="mr-1.5" /> : null}
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-line bg-white shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

type BadgeTone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'yellow'

const BADGE_TONES: Record<BadgeTone, string> = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-success-tint text-success',
  orange: 'bg-warning-tint text-warning',
  yellow: 'bg-[#FFEFD9] text-[#B56B21]',
  red: 'bg-danger-tint text-danger',
  purple: 'bg-purple-tint text-purple',
  gray: 'bg-[#EEF1F6] text-muted',
}

export interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'gray', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', BADGE_TONES[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="mb-1 text-muted">{icon}</div> : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-md text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-tint text-danger">
        <ExclamationComp />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-md text-[13px] text-muted">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}

function ExclamationComp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[#EDF1F7]', className)} />
}

export function Progress({ value, max = 100, className, tone = 'blue' }: { value: number; max?: number; className?: string; tone?: 'blue' | 'green' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#EDF1F7]', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full', tone === 'blue' ? 'bg-brand-600' : 'bg-success')} style={{ width: `${pct}%` }} />
    </div>
  )
}

const AVATAR_TONES: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-success-tint text-success',
  orange: 'bg-warning-tint text-warning',
  purple: 'bg-purple-tint text-purple',
  teal: 'bg-[#DDF6F1] text-[#0F766E]',
  rose: 'bg-[#FDE9F0] text-[#BE185D]',
}

export function Avatar({ name, tone = 'blue', size = 'md', className }: { name: string; tone?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-base' }[size]
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', AVATAR_TONES[tone], sizes, className)}>
      {initials || '?'}
    </span>
  )
}

export function InfoNote({ tone = 'blue', icon, children }: { tone?: 'blue' | 'orange' | 'red' | 'green'; icon?: ReactNode; children: ReactNode }) {
  const tones = {
    blue: 'bg-brand-50/70 text-ink-deep',
    orange: 'bg-warning-tint text-ink-deep',
    red: 'bg-danger-tint text-ink-deep',
    green: 'bg-success-tint text-ink-deep',
  } as const
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg px-4 py-3 text-[13px]', tones[tone])}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div>{children}</div>
    </div>
  )
}

export function SectionTitle({ title, description, right }: { title: string; description?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {right}
    </div>
  )
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}
