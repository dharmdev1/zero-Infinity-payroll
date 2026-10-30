import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DropdownMenuItem {
  label: string
  description?: string
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="focus:outline-none"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1.5 w-60 rounded-xl border border-line bg-white p-1.5 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                item.tone === 'danger' ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70',
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="block font-medium">{item.label}</span>
              {item.description ? <span className="block text-xs text-muted">{item.description}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export type DialogSize = 'sm' | 'md' | 'lg'

const DIALOG_WIDTH_CLASS: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: DialogSize
  children?: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 bg-ink-deep/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-pop sm:max-h-[min(80vh,580px)]',
          DIALOG_WIDTH_CLASS[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-bold leading-snug text-ink">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink sr-only">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-[13px] font-medium text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </div>
  )
}
