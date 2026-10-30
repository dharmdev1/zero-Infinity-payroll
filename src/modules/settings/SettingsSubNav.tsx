import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import type { Permission } from '@/types/rbac'
import { cn } from '@/utils/cn'

const SETTINGS_TABS: Array<{ label: string; to: string; permission: Permission }> = [
  { label: 'Users & Access', to: '/settings/users', permission: 'settings.users' },
  { label: 'System Roles', to: '/settings/roles', permission: 'settings.roles' },
  { label: 'Permissions Matrix', to: '/settings/permissions', permission: 'settings.permissions' },
  { label: 'Company Profile', to: '/settings/company', permission: 'settings.company' },
  { label: 'Audit Logs', to: '/settings/audit-logs', permission: 'settings.audit' },
]

export function SettingsSubNav() {
  const { can } = useAuth()
  const location = useLocation()
  const visible = SETTINGS_TABS.filter((t) => can(t.permission))

  return (
    <div className="scroll-x" role="tablist" aria-label="Settings sections">
      <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1">
        {visible.map((t) => {
          const active = location.pathname === t.to
          return (
            <Link
              key={t.to}
              to={t.to}
              role="tab"
              aria-current={active ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all',
                active
                  ? 'bg-white font-semibold text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
