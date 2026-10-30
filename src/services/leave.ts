import { db } from './demo/store'
import type { LeaveBalance, LeaveRequest, PaginatedResult, SessionUser } from '@/types/domain'

export interface LeaveListParams {
  employeeId?: string
  status?: string
  leaveType?: string
  page?: number
  pageSize?: number
}

function countWeekdays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getUTCDay()
    if (day >= 1 && day <= 5) count += 1
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return Math.max(1, count)
}

export const leaveService = {
  async list(params: LeaveListParams = {}, viewer?: SessionUser | null): Promise<PaginatedResult<LeaveRequest>> {
    if (viewer?.role === 'EMPLOYEE' && params.employeeId && params.employeeId !== viewer.employeeId) {
      throw new Error('Unauthorized: Employees can only access their own leave requests.')
    }
    const effectiveEmployeeId = viewer?.role === 'EMPLOYEE' ? viewer.employeeId : params.employeeId
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 15
    const filtered = db.leaveRequests.filter((r) => {
      if (effectiveEmployeeId && r.employeeId !== effectiveEmployeeId) return false
      if (params.status && r.status !== params.status) return false
      if (params.leaveType && r.leaveType !== params.leaveType) return false
      return true
    })
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async listMine(employeeId: string, viewer?: SessionUser | null): Promise<LeaveRequest[]> {
    if (viewer?.role === 'EMPLOYEE' && viewer.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only view their own leave requests.')
    }
    return db.leaveRequests.filter((r) => r.employeeId === employeeId)
  },

  async balances(employeeId: string, year = 2026, viewer?: SessionUser | null): Promise<LeaveBalance[]> {
    if (viewer?.role === 'EMPLOYEE' && viewer.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only access their own leave balances.')
    }
    const rows = db.leaveBalances.filter((b) => b.employeeId === employeeId && b.year === year)
    if (rows.length > 0) return rows
    return [
      { employeeId, year, leaveType: 'Annual', totalDays: 18, usedDays: 3 },
      { employeeId, year, leaveType: 'Sick', totalDays: 12, usedDays: 1 },
      { employeeId, year, leaveType: 'Casual', totalDays: 6, usedDays: 1 },
    ]
  },

  async create(input: {
    employeeId: string
    employeeName: string
    leaveType: LeaveRequest['leaveType']
    startDate: string
    endDate: string
    reason: string
  }): Promise<LeaveRequest> {
    const days = countWeekdays(input.startDate, input.endDate)
    const created: LeaveRequest = {
      id: `LV-2026-${String(db.leaveRequests.length + 1).padStart(2, '0')}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      reason: input.reason,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    }
    db.leaveRequests.unshift(created)
    return created
  },

  async decide(id: string, decision: 'APPROVED' | 'REJECTED', note: string): Promise<LeaveRequest> {
    if (!note.trim()) {
      throw new Error('A decision note is required for the audit log.')
    }
    const req = db.leaveRequests.find((r) => r.id === id)
    if (!req) throw new Error(`Leave request ${id} not found`)
    req.status = decision
    req.decidedBy = 'Sita Sharma'
    req.decidedAt = new Date().toISOString()
    req.decisionNote = note
    if (decision === 'APPROVED') {
      const bal = db.leaveBalances.find((b) => b.employeeId === req.employeeId && b.leaveType === req.leaveType)
      if (bal) bal.usedDays += req.days
    }
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      action: decision === 'APPROVED' ? 'leave.approved' : 'leave.rejected',
      module: 'Leave',
      actor: 'Sita Sharma',
      target: req.id,
      detail: `${decision} ${req.days}d ${req.leaveType} leave for ${req.employeeName} · note: ${note}`,
      at: new Date().toISOString(),
    })
    return req
  },
}
