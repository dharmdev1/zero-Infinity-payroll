import { CalendarClock, CheckSquare, CircleUser, Landmark, Wallet } from 'lucide-react'
import { StatCard } from '@/components/data-display/stat-card'
import { formatNpr } from '@/utils/npr'
import type { AdminDashboardCounts } from '../types'

interface SummaryCardsProps {
  counts: AdminDashboardCounts
  attendanceRate: number
  canViewPayroll: boolean
  loading: {
    employees: boolean
    attendance: boolean
    tasks: boolean
    payroll: boolean
    leave: boolean
  }
}

export function SummaryCards({ counts, attendanceRate, canViewPayroll, loading }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total employees"
        value={String(counts.total)}
        loading={loading.employees}
        icon={<CircleUser size={16} />}
        iconTone="blue"
        note={counts.newThisMonth ? `+${counts.newThisMonth} this month` : 'View directory'}
        noteTone="blue"
        to="/employees"
      />
      <StatCard
        label="Present today"
        value={String(counts.present)}
        loading={loading.attendance}
        icon={<CalendarClock size={16} />}
        iconTone="green"
        note={`${attendanceRate}% attendance${counts.late ? ` · ${counts.late} late` : ''}`}
        noteTone={counts.late ? 'orange' : 'green'}
        to="/attendance"
      />
      <StatCard
        label="Pending tasks"
        value={String(counts.pendingTasks)}
        loading={loading.tasks}
        icon={<CheckSquare size={16} />}
        iconTone="purple"
        note="Across active work"
        noteTone="muted"
        to="/tasks"
      />
      {canViewPayroll ? (
        <StatCard
          label="Monthly payroll"
          value={formatNpr(counts.payrollGross)}
          loading={loading.payroll}
          icon={<Wallet size={16} />}
          iconTone="orange"
          note="October payroll"
          noteTone="orange"
          to="/payroll"
        />
      ) : (
        <StatCard
          label="Pending leave requests"
          value={String(counts.pendingLeaveCount)}
          loading={loading.leave}
          icon={<Landmark size={16} />}
          iconTone="orange"
          note="Awaiting HR approval"
          noteTone="orange"
          to="/leave/approvals"
        />
      )}
    </div>
  )
}
