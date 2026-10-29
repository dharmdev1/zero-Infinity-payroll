import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/base'

export function LinkOut({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${className ?? ''}`}>
      {children}
    </Link>
  )
}

/** A persistent aria-live region so async status updates are announced. */
export function ariaLiveRegion(): ReactNode {
  return <div id="aria-live-region" role="status" aria-live="polite" className="sr-only" />
}

export function DemoBadge({ what }: { what?: string }) {
  return <Badge tone="gray">Demo — {what ?? 'not persisted'}</Badge>
}
