import { cn } from '@/utils/cn'

export function StatusBadge({ status, tone }: { status: string; tone: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'yellow' }) {
  const tones: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-success-tint text-success',
    orange: 'bg-warning-tint text-warning',
    red: 'bg-danger-tint text-danger',
    purple: 'bg-purple-tint text-purple',
    gray: 'bg-[#EEF1F6] text-muted',
    yellow: 'bg-warning-tint text-[#B56B21]',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

/** Canonical mapping used across attendance, leave, tasks, payroll, employees. */
export function attendanceStatusLabel(status: string): string {
  switch (status) {
    case 'PRESENT': return 'Present'
    case 'LATE': return 'Late'
    case 'ABSENT': return 'Absent'
    case 'ON_LEAVE': return 'On leave'
    case 'WEEKEND': return 'Weekend'
    case 'UPCOMING': return 'Upcoming'
    case 'NO_RECORD': return 'No record'
    default: return status
  }
}

export function attendanceTone(status: string): 'green' | 'orange' | 'red' | 'blue' | 'gray' {
  switch (status) {
    case 'Present':
    case 'PRESENT':
      return 'green'
    case 'Late':
    case 'LATE':
      return 'orange'
    case 'Absent':
    case 'ABSENT':
      return 'red'
    case 'On leave':
    case 'ON_LEAVE':
      return 'blue'
    default:
      return 'gray'
  }
}

export function leaveTone(status: string): 'orange' | 'green' | 'red' | 'gray' {
  switch (status) {
    case 'PENDING':
    case 'Pending':
      return 'orange'
    case 'APPROVED':
    case 'Approved':
      return 'green'
    case 'REJECTED':
      return 'red'
    default:
      return 'gray'
  }
}

export function taskTone(status: string): 'blue' | 'orange' | 'purple' | 'green' | 'gray' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'blue'
    case 'REVIEW':
      return 'orange'
    case 'TO_DO':
      return 'purple'
    case 'COMPLETED':
      return 'green'
    default:
      return 'gray'
  }
}

export function taskLabel(status: string): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In progress'
    case 'REVIEW':
      return 'Review'
    case 'TO_DO':
      return 'To do'
    case 'COMPLETED':
      return 'Completed'
    default:
      return status
  }
}

export function employeeStatusTone(status: string): 'green' | 'orange' | 'gray' {
  switch (status) {
    case 'ACTIVE':
      return 'green'
    case 'PROBATION':
      return 'orange'
    default:
      return 'gray'
  }
}

export function employeeStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'PROBATION':
      return 'Probation'
    default:
      return 'Inactive'
  }
}

export function payrollRunTone(status: string): 'blue' | 'orange' | 'green' | 'gray' {
  switch (status) {
    case 'DRAFT':
      return 'gray'
    case 'REVIEW':
      return 'orange'
    case 'APPROVED':
      return 'blue'
    case 'PAID':
      return 'green'
    default:
      return 'gray'
  }
}

export function payslipTone(status: string): 'blue' | 'orange' | 'green' | 'gray' {
  switch (status) {
    case 'DRAFT':
      return 'gray'
    case 'PENDING_APPROVAL':
      return 'orange'
    case 'APPROVED':
      return 'blue'
    case 'PAID':
      return 'green'
    default:
      return 'gray'
  }
}

export function payslipLabel(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'Pending approval'
    default:
      return status
  }
}
