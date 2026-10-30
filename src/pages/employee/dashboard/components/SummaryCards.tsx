import { CalendarClock, CheckSquare, Landmark, Wallet } from 'lucide-react'
import { StatCard } from '@/components/data-display/stat-card'
import { formatNpr } from '@/utils/npr'
import type { Payslip } from '@/types/domain'

interface SummaryCardsProps {
  presentDays: number
  activeTasksCount: number
  availableAnnual: number
  latestPayslip: Payslip | null | undefined
  loading: {
    attendance: boolean
    tasks: boolean
    balances: boolean
    payslip: boolean
  }
}

export function SummaryCards({
  presentDays,
  activeTasksCount,
  availableAnnual,
  latestPayslip,
  loading,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Attendance this month"
        value={`${presentDays} days`}
        loading={loading.attendance}
        icon={<CalendarClock size={16} />}
        iconTone="blue"
        note="Present so far"
        noteTone="blue"
        to="/my/attendance"
      />
      <StatCard
        label="Tasks in progress"
        value={`${activeTasksCount} tasks`}
        loading={loading.tasks}
        icon={<CheckSquare size={16} />}
        iconTone="purple"
        note="2 due this week"
        noteTone="blue"
        to="/my/tasks"
      />
      <StatCard
        label="Leave balance"
        value={`${availableAnnual} days`}
        loading={loading.balances}
        icon={<Landmark size={16} />}
        iconTone="green"
        note="Available to use"
        noteTone="green"
        to="/my/leave"
      />
      <StatCard
        label="Latest payslip"
        value={latestPayslip ? formatNpr(latestPayslip.netPaisa) : '—'}
        loading={loading.payslip}
        icon={<Wallet size={16} />}
        iconTone="orange"
        note={latestPayslip?.period ?? '—'}
        noteTone="orange"
        to="/my/payslips"
      />
    </div>
  )
}
