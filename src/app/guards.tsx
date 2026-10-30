import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth-context'
import type { Permission } from '@/types/rbac'

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children ? <>{children}</> : <Outlet />
}

export function RequirePermission({
  permission,
  anyOf,
  children,
}: {
  permission?: Permission
  anyOf?: Permission[]
  children: ReactNode
}) {
  const { session, can, canAny } = useAuth()
  if (!session) {
    return <Navigate to="/login" replace />
  }
  const allowed = permission ? can(permission) : anyOf ? canAny(anyOf) : true
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
