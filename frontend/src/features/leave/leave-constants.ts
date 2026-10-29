import type { LeaveStatus } from '@/types/domain'

export const LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

export const leaveStatusLabel: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const LEAVE_TYPES = ['Annual', 'Sick', 'Casual'] as const

export { leaveStatusLabel as statusLabel }
