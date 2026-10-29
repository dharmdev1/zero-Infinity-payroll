import { useEffect, useContext } from 'react'
import type { ReactNode } from 'react'
import { HeaderContext } from './header-context'

/**
 * Declares the topbar title incl. dynamic names, and the breadcrumb trail.
 * e.g. useHeader('Employee management', [{ label: 'Workspace' }, { label: 'Employees', to: '/employees' }])
 */
export function useHeader(title: string, crumbs: Array<{ label: string; to?: string }>): void {
  const { set } = useContext(HeaderContext)
  const crumbKey = JSON.stringify(crumbs)
  useEffect(() => {
    set({ title, crumbs: JSON.parse(crumbKey) as Array<{ label: string; to?: string }> })
  }, [title, crumbKey, set])
}

export function PageHeaderBar({ title, description, children, icon }: { title: string; description?: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[26px] font-bold tracking-tight text-ink md:text-[28px]">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-[13px] text-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
      {icon ? <div className="hidden">{icon}</div> : null}
    </div>
  )
}
