import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Permission, Role } from '@/types/rbac'
import { hasAnyPermission, hasPermission } from '@/types/rbac'
import type { SessionUser } from '@/types/domain'
import { settingsService } from '@/services/settings'

export interface AuthContextValue {
  session: SessionUser | null
  setSession: (next: SessionUser | null) => void
  demoSessions: SessionUser[]
  can: (permission: Permission) => boolean
  canAny: (permissions: Permission[]) => boolean
  signOut: () => void
  switchRoleDemo: (role: Role) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function resolveActiveSession(session: SessionUser | null): SessionUser | null {
  if (!session) return null
  const check = settingsService.isAccountActive(session.employeeId || session.userId)
  if (!check.active) return null
  const latestRole = check.currentRole ?? session.role
  if (latestRole !== session.role) {
    return { ...session, role: latestRole }
  }
  return session
}

export function AuthProvider({
  session,
  setSession,
  demoSessions,
  children,
}: {
  session: SessionUser | null
  setSession: (next: SessionUser | null) => void
  demoSessions: SessionUser[]
  children: ReactNode
}) {
  const activeSession = resolveActiveSession(session)

  const value = useMemo<AuthContextValue>(
    () => ({
      session: activeSession,
      setSession: (next: SessionUser | null) => {
        if (!next) {
          setSession(null)
          return
        }
        const status = settingsService.isAccountActive(next.employeeId || next.userId)
        if (!status.active) {
          throw new Error(status.reason || 'Account is disabled or terminated.')
        }
        setSession({
          ...next,
          role: status.currentRole ?? next.role,
        })
      },
      demoSessions,
      can: (permission: Permission) => hasPermission(activeSession, permission),
      canAny: (permissions: Permission[]) => hasAnyPermission(activeSession, permissions),
      signOut: () => setSession(null),
      switchRoleDemo: (role: Role) => {
        const match = demoSessions.find((s) => {
          const st = settingsService.isAccountActive(s.employeeId || s.userId)
          return st.active && (st.currentRole ?? s.role) === role
        })
        if (match) {
          const st = settingsService.isAccountActive(match.employeeId || match.userId)
          setSession({ ...match, role: st.currentRole ?? match.role })
        }
      },
    }),
    [activeSession, setSession, demoSessions],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
