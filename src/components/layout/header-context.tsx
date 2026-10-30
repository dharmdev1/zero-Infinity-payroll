import React from 'react'
import type { ReactNode } from 'react'

export interface Crumb {
  label: string
  to?: string
}

export interface HeaderState {
  title: string
  crumbs: Crumb[]
}

export const HeaderContext = React.createContext<{
  state: HeaderState
  set: React.Dispatch<React.SetStateAction<HeaderState>>
}>({
  state: { title: '', crumbs: [] },
  set: () => undefined,
})

export function HeaderProvider({ children, resetKey }: { children: ReactNode; resetKey?: string }) {
  const [state, setState] = React.useState<HeaderState>({ title: '', crumbs: [] })
  React.useEffect(() => {
    setState({ title: '', crumbs: [] })
  }, [resetKey])
  const value = React.useMemo(() => ({ state, set: setState }), [state])
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}
