import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createContext } from 'react'

export interface HeaderState {
  title: string
  crumbs: Array<{ label: string; to?: string }>
}

export const HeaderContext = createContext<{ state: HeaderState; set: (s: HeaderState) => void }>({
  state: { title: '', crumbs: [] },
  set: () => undefined,
})

export function HeaderProvider({ children, resetKey }: { children: ReactNode; resetKey: string }) {
  const [state, setState] = useState<HeaderState>({ title: '', crumbs: [] })
  useEffect(() => {
    setState({ title: '', crumbs: [] })
  }, [resetKey])
  return <HeaderContext.Provider value={{ state, set: setState }}>{children}</HeaderContext.Provider>
}
