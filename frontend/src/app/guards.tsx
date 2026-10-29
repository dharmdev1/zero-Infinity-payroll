import { Navigate, Outlet, useLocation } from 'react-router-dom'
import React from 'react'
import { useAuth } from '@/app/auth-context'
import type { Permission } from '@/types/rbac'
import { hasAnyPermission } from '@/types/rbac'
import { Card, InfoNote } from '@/components/ui/base'
import { LinkOut } from '@/components/feedback'

/**
 * Route guards are UX only — access control must be enforced by the FastAPI
 * backend. A denied deep link shows an access notice, not an editable page.
 */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequirePermission({ permission, anyOf, children }: { permission?: Permission; anyOf?: Permission[]; children: React.ReactNode }) {
  const { session } = useAuth()
  const allowed = permission ? hasAnyPermission(session, [permission]) : anyOf ? hasAnyPermission(session, anyOf) : !!session
  if (!session) return <Navigate to="/login" replace />
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold text-ink">Access restricted</h2>
          <p className="mt-2 text-[13px] text-muted">
            Your role ({session.role.replace('_', ' ').toLowerCase()}) does not include this module. Ask a Super Admin if you believe this is an error.
          </p>
          <div className="mx-auto mt-4 max-w-md">
            <InfoNote tone="orange">
              Frontend route guards are convenience checks only. The backend remains the security boundary for payroll, employee records, approvals and audit logs.
            </InfoNote>
          </div>
          <LinkOut to="/dashboard" className="mt-6 bg-brand-600 text-white">
            Back to dashboard
          </LinkOut>
        </Card>
      </div>
    )
  }
  return <>{children}</>
}
