import type { LeaveBalanceCard, LeaveRequest, LeaveStatus, Paginated } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, paginate, searchAcross } from './query-utils'
import type { ListQuery } from './query-utils'

/**
 * REAL API CONTRACT (FastAPI, /api/v1):
 *   GET  /leave/requests?status&type&employeeId&page
 *   POST /leave/requests                      { leaveType, startDate, endDate, reason }
 *   POST /leave/requests/{id}/approve|reject   { note }  (append-only audit)
 *   GET  /leave/balances/{employeeId}?year
 * Pending requests never reduce displayed balances until approved.
 */
export interface LeaveListFilters extends ListQuery {
  status?: string
  leaveType?: string
  employeeId?: string
}

export interface LeaveService {
  list(filters: LeaveListFilters): Promise<Paginated<LeaveRequest>>
  listMine(employeeId: string): Promise<LeaveRequest[]>
  balances(employeeId: string, year: number): Promise<LeaveBalanceCard[]>
  create(payload: Pick<LeaveRequest, 'employeeId' | 'employeeName' | 'leaveType' | 'startDate' | 'endDate' | 'reason'>): Promise<LeaveRequest>
  decide(requestId: string, decision: 'APPROVED' | 'REJECTED', note: string): Promise<LeaveRequest>
  cancel(requestId: string, note: string): Promise<LeaveRequest>
}

const realService: LeaveService = {
  list: (filters) => apiClient.get<Paginated<LeaveRequest>>('/leave/requests', { ...filters }),
  listMine: async (employeeId) => (await apiClient.get<Paginated<LeaveRequest>>('/leave/requests', { employeeId })).items,
  balances: (employeeId, year) => apiClient.get<LeaveBalanceCard[]>(`/leave/balances/${employeeId}`, { year }),
  create: (payload) => apiClient.post<LeaveRequest>('/leave/requests', payload),
  decide: (requestId, decision, note) => apiClient.post<LeaveRequest>(`/leave/requests/${requestId}/${decision.toLowerCase()}`, { note }),
  cancel: (requestId, note) => apiClient.post<LeaveRequest>(`/leave/requests/${requestId}/cancel`, { note }),
}

const DEFAULT_BALANCES: LeaveBalanceCard[] = [
  { leaveType: 'Annual', year: 2026, usedDays: 9.5, totalDays: 18 },
  { leaveType: 'Sick', year: 2026, usedDays: 2, totalDays: 6 },
  { leaveType: 'Casual', year: 2026, usedDays: 1, totalDays: 3 },
]

const demoService: LeaveService = {
  async list(filters) {
    await demoDelay(220)
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.leaveRequests
    rows = searchAcross(rows, search, ['employeeName', 'id', 'reason'])
    if (f.status) rows = rows.filter((r) => r.status.toLowerCase() === f.status)
    if (f.leaveType) rows = rows.filter((r) => r.leaveType.toLowerCase() === f.leaveType)
    if (f.employeeId) rows = rows.filter((r) => r.employeeId === f.employeeId)
    rows = [...rows].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    return paginate(rows, page, pageSize)
  },
  async listMine(employeeId) {
    await demoDelay()
    return db.leaveRequests.filter((r) => r.employeeId === employeeId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  },
  async balances(employeeId, year) {
    await demoDelay(150)
    // Used counts derive from approved leave; pending never reduces balance.
    return DEFAULT_BALANCES.map((b) => {
      const used = db.leaveRequests
        .filter((r) => r.employeeId === employeeId && r.leaveType === b.leaveType && r.status === 'APPROVED' && r.startDate.startsWith(String(year)))
        .reduce((acc, r) => acc + r.days, 0)
      return { ...b, usedDays: used || b.usedDays }
    })
  },
  async create(payload) {
    await demoDelay(320)
    const sorted = [...db.leaveRequests].map((r) => Number(r.id.replace(/\D/g, '')) || 0)
    const next = Math.max(...sorted, 2400) + 1
    const created: LeaveRequest = {
      ...structuredClone(payload),
      id: `LRV-${next}`,
      days: Math.max(1, Math.round((Date.parse(payload.endDate) - Date.parse(payload.startDate)) / 86_400_000) + 1),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
    }
    db.leaveRequests.unshift(created)
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: payload.employeeName,
      actorId: payload.employeeId,
      action: 'leave.requested',
      module: 'Leave',
      target: created.id,
      at: new Date().toISOString(),
      detail: `${created.leaveType} leave ${created.startDate} → ${created.endDate} submitted (demo adapter, not persisted).`,
    })
    return structuredClone(created)
  },
  async decide(requestId, decision, note) {
    await demoDelay(300)
    const target = db.leaveRequests.find((r) => r.id === requestId)
    if (!target) throw new Error(`Leave request not found: ${requestId}`)
    target.status = decision
    target.decidedBy = 'Priya Rana (demo)'
    target.decidedAt = new Date().toISOString()
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Priya Rana',
      actorId: 'U-002',
      action: decision === 'APPROVED' ? 'leave.approved' : 'leave.rejected',
      module: 'Leave',
      target: requestId,
      at: new Date().toISOString(),
      detail: `${target.leaveType} leave for ${target.employeeName} ${decision.toLowerCase()}${note ? ` — ${note}` : ''} (demo adapter, not persisted).`,
    })
    return structuredClone(target)
  },
  async cancel(requestId, note) {
    await demoDelay(240)
    const target = db.leaveRequests.find((r) => r.id === requestId)
    if (!target) throw new Error(`Leave request not found: ${requestId}`)
    target.status = 'CANCELLED'
    target.decidedAt = new Date().toISOString()
    void note
    return structuredClone(target)
  },
}

export type { LeaveStatus }
export const leaveService: LeaveService = API_MODE === 'api' ? realService : demoService
