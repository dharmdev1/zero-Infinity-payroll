import type { Announcement, Payslip, WorkTask } from '@/types/domain'

export interface WeekDayTile {
  iso: string
  dayCode: string
  label: string
  dot: string
  isToday: boolean
}

export interface EmployeeDashboardState {
  firstName: string
  todayFormatted: string
  presentDays: number
  activeTasksCount: number
  availableAnnual: number
  latestPayslip: Payslip | null | undefined
  weekDays: WeekDayTile[]
  pendingTasks: WorkTask[]
  announcements: Announcement[]
  loading: {
    attendance: boolean
    tasks: boolean
    balances: boolean
    payslip: boolean
  }
  handleCheckIn: () => void
}
