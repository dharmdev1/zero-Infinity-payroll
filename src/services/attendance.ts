import { db, getActiveSession } from './demo/store'
import type { AttendanceMonthSummary, AttendanceRecord, PaginatedResult, SessionUser } from '@/types/domain'
import { hasPermission } from '@/types/rbac'
import { deriveAttendanceHint, parseClockToMinutes } from '@/utils/npt'

export interface AttendanceListParams {
  employeeId?: string
  date?: string
  fromDate?: string
  toDate?: string
  department?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

function resolveViewer(viewer?: SessionUser | null): SessionUser | null {
  return viewer !== undefined ? viewer : getActiveSession()
}

export const attendanceService = {
  async list(params: AttendanceListParams = {}, viewer?: SessionUser | null): Promise<PaginatedResult<AttendanceRecord>> {
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to view attendance records.')
    }
    if (v.role === 'EMPLOYEE' && params.employeeId && params.employeeId !== v.employeeId) {
      throw new Error('Unauthorized: Employees can only view their own attendance records.')
    }
    const effectiveEmployeeId = v.role === 'EMPLOYEE' ? v.employeeId : params.employeeId
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const q = (params.search ?? '').trim().toLowerCase()
    const filtered = db.attendance.filter((r) => {
      if (effectiveEmployeeId && r.employeeId !== effectiveEmployeeId) return false
      if (params.date && r.date !== params.date) return false
      if (params.fromDate && r.date < params.fromDate) return false
      if (params.toDate && r.date > params.toDate) return false
      if (params.department && r.department !== params.department) return false
      if (params.status && r.status !== params.status) return false
      if (q && !`${r.employeeName} ${r.employeeId}`.toLowerCase().includes(q)) return false
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

  async summaryForMonth(employeeId: string, month: string, viewer?: SessionUser | null): Promise<AttendanceMonthSummary> {
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to access attendance summary.')
    }
    if (v.role === 'EMPLOYEE' && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only access their own attendance summary.')
    }
    const rows = db.attendance.filter((r) => r.employeeId === employeeId && r.date.startsWith(month))
    const presentDays = rows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
    const lateArrivals = rows.filter((r) => r.status === 'LATE').length
    const absentDays = rows.filter((r) => r.status === 'ABSENT').length
    const leaveDays = rows.filter((r) => r.status === 'ON_LEAVE').length
    const worked = rows.map((r) => r.workMinutes).filter((m): m is number => m != null && m > 0)
    const averageWorkMinutes = worked.length > 0 ? Math.round(worked.reduce((a, b) => a + b, 0) / worked.length) : 488
    return {
      employeeId,
      month,
      presentDays: presentDays || 18,
      lateArrivals: lateArrivals || 1,
      absentDays,
      leaveDays,
      averageWorkMinutes,
    }
  },

  async historyFor(employeeId: string, date: string, viewer?: SessionUser | null): Promise<AttendanceRecord[]> {
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to view attendance history.')
    }
    if (v.role === 'EMPLOYEE' && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only view their own attendance history.')
    }
    return db.attendance.filter((r) => r.employeeId === employeeId && r.date === date)
  },

  async addMissingRecord(
    input: {
      employeeId: string
      date: string
      checkIn: string
      checkOut: string
      reason: string
      shiftLabel?: string
    },
    viewer?: SessionUser | null,
  ): Promise<AttendanceRecord> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'attendance.write')) {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can add manual attendance records.')
    }
    const emp = db.employees.find((e) => e.id === input.employeeId)
    const hint = deriveAttendanceHint({
      date: input.date,
      isFuture: input.date > db.today,
      onApprovedLeave: false,
      checkInMinutes: parseClockToMinutes(input.checkIn),
      checkOutMinutes: parseClockToMinutes(input.checkOut),
    })
    const record: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: input.employeeId,
      employeeName: emp?.name ?? input.employeeId,
      department: emp?.department ?? 'Engineering',
      date: input.date,
      checkIn: input.checkIn || null,
      checkOut: input.checkOut || null,
      workMinutes: hint.workMinutes,
      status: hint.status,
      source: 'Manual',
      version: 1,
      shiftLabel: input.shiftLabel,
    }
    db.attendance.unshift(record)
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      action: 'attendance.added',
      module: 'Attendance',
      actor: v.name,
      target: `${input.employeeId} · ${input.date}`,
      detail: `Added manual record (${input.checkIn}–${input.checkOut}) · reason: ${input.reason}`,
      at: new Date().toISOString(),
    })
    return record
  },

  async correctRecord(
    input: {
      employeeId: string
      date: string
      checkIn: string
      checkOut: string
      reason: string
    },
    viewer?: SessionUser | null,
  ): Promise<AttendanceRecord> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'attendance.write')) {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can correct attendance records.')
    }
    const existing = db.attendance.find((r) => r.employeeId === input.employeeId && r.date === input.date)
    if (!existing) {
      throw new Error('No existing record found for this employee and date.')
    }
    const hint = deriveAttendanceHint({
      date: input.date,
      isFuture: input.date > db.today,
      onApprovedLeave: existing.status === 'ON_LEAVE',
      checkInMinutes: parseClockToMinutes(input.checkIn),
      checkOutMinutes: parseClockToMinutes(input.checkOut),
    })
    existing.checkIn = input.checkIn || existing.checkIn
    existing.checkOut = input.checkOut || existing.checkOut
    existing.workMinutes = hint.workMinutes
    existing.status = hint.status
    existing.version += 1
    existing.source = 'Manual'
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      action: 'attendance.corrected',
      module: 'Attendance',
      actor: v.name,
      target: `${input.employeeId} · ${input.date}`,
      detail: `Corrected to v${existing.version} (${input.checkIn}–${input.checkOut}) · reason: ${input.reason}`,
      at: new Date().toISOString(),
    })
    return existing
  },
}

