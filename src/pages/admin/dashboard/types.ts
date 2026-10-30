import type { BarDatum } from '@/components/data-display/stat-card'
import type { WorkTask } from '@/types/domain'

export interface AdminDashboardCounts {
  total: number
  present: number
  late: number
  absent: number
  pendingTasks: number
  payrollGross: number
  newThisMonth: number
  pendingLeaveCount: number
}

export interface ActivityItem {
  name: string
  action: string
  time: string
}

export interface AdminDashboardState {
  userName: string
  canViewPayroll: boolean
  canViewAudit: boolean
  counts: AdminDashboardCounts
  attendanceRate: number
  cashBars: BarDatum[]
  pendingTaskRows: WorkTask[]
  activities: ActivityItem[]
  loading: {
    employees: boolean
    attendance: boolean
    tasks: boolean
    payroll: boolean
    leave: boolean
  }
}
