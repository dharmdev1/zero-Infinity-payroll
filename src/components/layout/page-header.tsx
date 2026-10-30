import { useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { HeaderContext } from './header-context'
import type { Crumb } from './header-context'

export function useHeader(title: string, crumbs: Crumb[] = []) {
  const { set } = useContext(HeaderContext)
  const serialized = JSON.stringify(crumbs)
  useEffect(() => {
    set({ title, crumbs: JSON.parse(serialized) as Crumb[] })
  }, [set, title, serialized])
}

export function PageHeaderBar({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
    </div>
  )
}
