import type { ReactNode } from 'react'
import { useHeader } from '@/components/layout/page-header'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', to: '/attendance' },
  { id: 'records', label: 'Records', to: '/attendance/records' },
  { id: 'calendar', label: 'Calendar', to: '/attendance/calendar' },
  { id: 'corrections', label: 'Manual & corrections', to: '/attendance/corrections' },
  { id: 'reports', label: 'Reports', to: '/attendance/reports' },
]

export function AttendanceRoot({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isManualOrCorrections = location.pathname.startsWith('/attendance/corrections') || location.pathname.startsWith('/attendance/manual')
  const active = isManualOrCorrections
    ? '/attendance/corrections'
    : TABS.find((t) => location.pathname.startsWith(t.to) && t.to !== '/attendance')?.to ?? '/attendance'
  useHeader('Attendance management', [
    { label: 'Workspace' },
    { label: 'Attendance', to: '/attendance' },
    { label: TABS.find((t) => t.to === active)?.label ?? 'Dashboard' },
  ])
  return (
    <div className="space-y-5">
      <div className="scroll-x" role="tablist" aria-label="Attendance sections">
        <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to={t.to}
              role="tab"
              aria-current={active === t.to ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all',
                active === t.to
                  ? 'bg-white font-semibold text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

export {
  AttendanceDashboardTab,
  AttendanceRecordsTab,
  AttendanceCalendarTab,
  AttendanceManualTab,
  AttendanceReportsTab,
} from '@/pages/admin/attendance'
