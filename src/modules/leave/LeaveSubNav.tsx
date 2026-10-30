import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { cn } from '@/utils/cn'

export function LeaveSubNav() {
  const { can } = useAuth()
  const location = useLocation()

  const tabs = [
    { label: 'Overview', to: '/leave', show: can('leave.view') || can('self.request.leave') },
    { label: 'Requests', to: '/leave/requests', show: can('leave.view') },
    { label: 'Approvals', to: '/leave/approvals', show: can('leave.approve') },
    { label: 'Balances', to: '/leave/balances', show: can('leave.view') || can('self.view') },
  ].filter((t) => t.show)

  return (
    <div className="scroll-x" role="tablist" aria-label="Leave sections">
      <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1">
        {tabs.map((t) => {
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
