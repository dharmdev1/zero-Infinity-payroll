import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Permission, Role } from '@/types/rbac'
import { roleHas } from '@/types/rbac'
import type { SessionUser } from '@/types/domain'
import { demoSessionStrategy } from '@/services/auth/session'

interface AuthContextValue {
  session: SessionUser | null
  can: (permission: Permission) => boolean
  signInDemo: (session: SessionUser) => void
  signOut: () => void
  switchRoleDemo: (role: Role) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  session: SessionUser | null
  setSession: (session: SessionUser | null) => void
  demoSessions: SessionUser[]
  children: ReactNode
}

export function AuthProvider({ session, setSession, demoSessions, children }: AuthProviderProps) {
  const signInDemo = useCallback((next: SessionUser) => {
    demoSessionStrategy.save(next)
    setSession(next)
  }, [setSession])

  const signOut = useCallback(() => {
    demoSessionStrategy.save(null)
    setSession(null)
  }, [setSession])

  const switchRoleDemo = useCallback(
    (role: Role) => {
      const match = demoSessions.find((s) => s.role === role)
      if (match) signInDemo(match)
    },
    [demoSessions, signInDemo],
  )

  const can = useCallback(
    (permission: Permission) => !!session && roleHas(session.role, permission),
    [session],
  )

  const value = useMemo<AuthContextValue>(() => ({ session, can, signInDemo, signOut, switchRoleDemo }), [session, can, signInDemo, signOut, switchRoleDemo])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
