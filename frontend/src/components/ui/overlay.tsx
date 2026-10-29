import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Accessible modal dialog with focus trap basics and Escape close. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#6B7280]/60" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative max-h-[88vh] w-full overflow-y-auto rounded-xl bg-white shadow-pop', size === 'lg' ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="flex items-start gap-3 p-6">
          {icon ? <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-tint text-danger">{icon}</div> : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-1 text-muted hover:bg-canvas hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

/** Small menu used by "…" actions, filters and the topbar. */
export function DropdownMenu({ trigger, items, align = 'right', minWidth }: { trigger: ReactNode; items: Array<{ label: string; description?: string; onSelect?: () => void; tone?: 'default' | 'danger'; disabled?: boolean }>; align?: 'left' | 'right'; minWidth?: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5"
      >
        {trigger}
      </button>
      {open ? (
        <div className={cn('absolute z-40 mt-2 rounded-xl border border-line bg-white p-1.5 shadow-pop', align === 'right' ? 'right-0' : 'left-0')} style={minWidth ? { minWidth } : undefined} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect?.()
              }}
              className={cn(
                'block w-full rounded-lg px-3 py-2 text-left text-[13px]',
                item.tone === 'danger' ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70',
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="font-medium">{item.label}</span>
              {item.description ? <span className="block text-xs text-muted">{item.description}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export interface TabItem {
  id: string
  label: string
}

export function Tabs({ tabs, active, onChange, ariaLabel }: { tabs: TabItem[]; active: string; onChange: (id: string) => void; ariaLabel?: string }) {
  return (
    <div className="scroll-x border-b border-line" role="tablist" aria-label={ariaLabel}>
      <div className="flex min-w-max gap-6 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px border-b-2 px-0.5 pb-3 pt-3 text-[13px] font-medium transition-colors',
              active === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options, className }: { label?: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <select
        aria-label={label}
        className="h-10 w-full appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-[13px] font-medium text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  )
}
