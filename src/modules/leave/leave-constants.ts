import type { LeaveStatus, LeaveType } from '@/types/domain'

export const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'Casual']

export const LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

export const leaveStatusLabel: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}
