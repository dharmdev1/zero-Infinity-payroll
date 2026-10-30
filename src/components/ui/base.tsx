import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { AvatarTone } from '@/types/domain'

export type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'yellow' | 'muted'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 border border-transparent shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.02)]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent',
    danger: 'bg-danger text-white hover:opacity-95 border border-transparent shadow-sm',
    success: 'bg-success text-white hover:opacity-95 border border-transparent shadow-sm',
  }
  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-8 px-3 text-xs rounded-xl',
    md: 'h-9 px-4 text-[13px] rounded-xl',
    lg: 'h-10 px-5 text-sm rounded-xl',
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
})

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

export function Badge({
  tone = 'gray',
  dot = false,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  const tones: Record<Tone, string> = {
    blue: 'border border-blue-200/80 bg-blue-50/70 text-blue-700',
    green: 'border border-emerald-200/80 bg-emerald-50/70 text-emerald-700',
    orange: 'border border-amber-200/80 bg-amber-50/70 text-amber-700',
    yellow: 'border border-amber-200/80 bg-amber-50/70 text-amber-700',
    purple: 'border border-purple-200/80 bg-purple-50/70 text-purple-700',
    red: 'border border-rose-200/80 bg-rose-50/70 text-rose-700',
    gray: 'border border-slate-200/80 bg-slate-50 text-slate-600',
    muted: 'border border-slate-200/80 bg-slate-50 text-slate-500',
  }
  const dots: Record<Tone, string> = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    orange: 'bg-amber-500',
    yellow: 'bg-amber-500',
    purple: 'bg-purple-600',
    red: 'bg-rose-600',
    gray: 'bg-slate-400',
    muted: 'bg-slate-400',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', tones[tone], className)}>
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function Avatar({
  name,
  tone = 'blue',
  size = 'md',
  className,
}: {
  name: string
  tone?: AvatarTone
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const tones: Record<AvatarTone, string> = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-success-tint text-success',
    orange: 'bg-warning-tint text-warning',
    purple: 'bg-purple-tint text-purple',
    red: 'bg-danger-tint text-danger',
    gray: 'bg-[#EEF2F7] text-ink',
  }
  const sizes: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', tones[tone], sizes[size], className)}
    >
      {initials || '?'}
    </span>
  )
}

export function SectionTitle({
  title,
  description,
  right,
}: {
  title: string
  description?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-[#E8EEF6]', className)} aria-hidden="true" />
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function InfoNote({
  tone = 'blue',
  children,
}: {
  tone?: 'blue' | 'orange' | 'green' | 'red'
  children: ReactNode
}) {
  const tones = {
    blue: 'border-brand-200 bg-brand-50/70 text-ink',
    orange: 'border-[#F5D6B2] bg-warning-tint/80 text-ink',
    green: 'border-[#B6E6CE] bg-success-tint/80 text-ink',
    red: 'border-[#F5C2C6] bg-danger-tint/80 text-danger',
  }
  return <div className={cn('rounded-xl border px-4 py-3 text-[13px]', tones[tone])}>{children}</div>
}

export function Progress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[#EDF1F7]', className)}
    >
      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}
