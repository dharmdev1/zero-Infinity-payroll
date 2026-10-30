import { Badge } from '@/components/ui/base'
import type { Tone } from '@/components/ui/base'
import type {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  PayrollRunStatus,
  Payslip,
  TaskStatus,
} from '@/types/domain'

export function StatusBadge({ status, tone = 'gray' }: { status: string; tone?: Tone }) {
  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  )
}

export function employeeStatusLabel(status: EmploymentStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'PROBATION':
      return 'Probation'
    case 'INACTIVE':
      return 'Inactive'
    case 'TERMINATED':
      return 'Terminated'
    case 'ARCHIVED':
      return 'Archived'
  }
}

export function employeeStatusTone(status: EmploymentStatus): Tone {
  switch (status) {
    case 'ACTIVE':
      return 'green'
    case 'PROBATION':
      return 'orange'
    case 'INACTIVE':
      return 'gray'
    case 'TERMINATED':
      return 'red'
    case 'ARCHIVED':
      return 'purple'
  }
}

export function attendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'Present'
    case 'LATE':
      return 'Late'
    case 'ABSENT':
      return 'Absent'
    case 'ON_LEAVE':
      return 'On leave'
    case 'WEEKEND':
      return 'Weekend'
    case 'UPCOMING':
      return 'Upcoming'
    default:
      return 'No record'
  }
}

export function attendanceTone(status: AttendanceStatus | string): Tone {
  const s = status.toUpperCase()
  if (s === 'PRESENT' || s === 'ON TIME') return 'green'
  if (s === 'LATE') return 'orange'
  if (s === 'ABSENT') return 'red'
  if (s === 'ON_LEAVE' || s === 'ON LEAVE') return 'blue'
  return 'gray'
}

export function leaveTone(status: LeaveStatus): Tone {
  switch (status) {
    case 'APPROVED':
      return 'green'
    case 'REJECTED':
      return 'red'
    case 'PENDING':
      return 'orange'
    default:
      return 'gray'
  }
}

export function taskLabel(status: TaskStatus): string {
  switch (status) {
    case 'TO_DO':
      return 'To do'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'REVIEW':
      return 'In review'
    case 'COMPLETED':
      return 'Completed'
  }
}

export function taskTone(status: TaskStatus): Tone {
  switch (status) {
    case 'COMPLETED':
      return 'green'
    case 'IN_PROGRESS':
      return 'blue'
    case 'REVIEW':
      return 'orange'
    default:
      return 'gray'
  }
}

export function payrollRunTone(status: PayrollRunStatus): Tone {
  switch (status) {
    case 'PAID':
      return 'green'
    case 'APPROVED':
      return 'blue'
    case 'REVIEW':
      return 'orange'
    default:
      return 'gray'
  }
}

export function payslipLabel(status: Payslip['status']): string {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'APPROVED':
      return 'Approved'
    default:
      return 'Draft'
  }
}

export function payslipTone(status: Payslip['status']): Tone {
  switch (status) {
    case 'PAID':
      return 'green'
    case 'APPROVED':
      return 'blue'
    default:
      return 'gray'
  }
}
