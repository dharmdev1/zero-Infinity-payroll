import type { ReactNode } from 'react'
import { useHeader } from '@/components/layout/page-header'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', to: '/attendance' },
  { id: 'records', label: 'Records', to: '/attendance/records' },
  { id: 'calendar', label: 'Calendar', to: '/attendance/calendar' },
  { id: 'manual', label: 'Manual attendance', to: '/attendance/manual' },
  { id: 'reports', label: 'Reports', to: '/attendance/reports' },
]

export function AttendanceRoot({ children }: { children: ReactNode }) {
  const location = useLocation()
  const active = TABS.find((t) => location.pathname.startsWith(t.to) === true && t.to !== '/attendance')?.to ?? '/attendance'
  useHeader('Attendance management', [{ label: 'Workspace' }, { label: 'Attendance' }, { label: TABS.find((t) => t.to === active)?.label ?? 'Dashboard' }])
  return (
    <div className="space-y-5">
      <div className="scroll-x border-b border-line" role="tablist" aria-label="Attendance sections">
        <div className="flex min-w-max gap-6">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to={t.to}
              role="tab"
              aria-current={active === t.to ? 'page' : undefined}
              className={cn('-mb-px border-b-2 px-0.5 pb-3 pt-1 text-[13px] font-medium', active === t.to ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}
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

export { AttendanceDashboardTab } from './tabs/DashboardTab'
export { AttendanceRecordsTab } from './tabs/RecordsTab'
export { AttendanceCalendarTab } from './tabs/CalendarTab'
export { AttendanceManualTab } from './tabs/ManualTab'
export { AttendanceReportsTab } from './tabs/ReportsTab'
