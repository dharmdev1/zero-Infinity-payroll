import type { AttendanceCorrectionDraft, AttendanceRecord, AttendanceStatus, AttendanceSummary, Paginated } from '@/types/domain'
import { db, ELAPSED_OCT_WORKDAYS } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, paginate } from './query-utils'
import type { ListQuery } from './query-utils'
import { minutesToClock, parseClockToMinutes } from '@/utils/npt'

/**
 * REAL API CONTRACT (FastAPI, /api/v1):
 *   GET  /attendance/records?date&fromDate&toDate&department&status&search&page&pageSize
 *   GET  /attendance/records/{employeeId}/{date}    (with version history)
 *   POST /attendance/records                       (add missing entry — audited)
 *   POST /attendance/records/corrections            { employeeId, date, checkIn, checkOut, reason } — audited, original retained
 *   GET  /attendance/summary/{employeeId}?month     (denominator-correct aggregates)
 * Rejects stale version updates (409). Attendance access does not grant payroll access.
 */
export interface AttendanceListFilters extends ListQuery {
  date?: string
  fromDate?: string
  toDate?: string
  department?: string
  status?: string
  employeeId?: string
}

export interface AttendanceService {
  list(filters: AttendanceListFilters): Promise<Paginated<AttendanceRecord>>
  historyFor(employeeId: string, date: string): Promise<AttendanceRecord[]>
  correctRecord(draft: AttendanceCorrectionDraft): Promise<AttendanceRecord>
  addMissingRecord(draft: AttendanceCorrectionDraft & { shiftLabel: string }): Promise<AttendanceRecord>
  summaryForMonth(employeeId: string, monthPrefix: string): Promise<AttendanceSummary>
}

const realService: AttendanceService = {
  list: (filters) => apiClient.get<Paginated<AttendanceRecord>>('/attendance/records', { ...filters }),
  historyFor: (employeeId, date) => apiClient.get<AttendanceRecord[]>(`/attendance/records/${employeeId}/${date}/history`),
  correctRecord: (draft) => apiClient.post<AttendanceRecord>('/attendance/records/corrections', draft),
  addMissingRecord: (draft) => apiClient.post<AttendanceRecord>('/attendance/records', draft),
  summaryForMonth: (employeeId, monthPrefix) =>
    apiClient.get<AttendanceSummary>(`/attendance/summary/${employeeId}`, { month: monthPrefix }),
}

const demoService: AttendanceService = {
  async list(filters) {
    await demoDelay(240)
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.attendance.filter((r) => r.status !== 'UPCOMING' || f.employeeId)
    if (f.employeeId) rows = rows.filter((r) => r.employeeId === f.employeeId)
    if (f.date) rows = rows.filter((r) => r.date === f.date)
    if (f.fromDate) rows = rows.filter((r) => r.date >= f.fromDate)
    if (f.toDate) rows = rows.filter((r) => r.date <= f.toDate)
    if (f.department) rows = rows.filter((r) => r.department.toLowerCase() === f.department)
    if (f.status) rows = rows.filter((r) => r.status.toLowerCase() === f.status)
    if (search) rows = rows.filter((r) => `${r.employeeName} ${r.employeeId}`.toLowerCase().includes(search))
    rows = [...rows].sort((a, b) => (b.date === a.date ? a.employeeId.localeCompare(b.employeeId) : b.date.localeCompare(a.date)))
    return paginate(rows, page, pageSize)
  },
  async historyFor(employeeId, date) {
    await demoDelay(120)
    const found = db.attendance.find((r) => r.employeeId === employeeId && r.date === date)
    if (!found) return []
    return [structuredClone(found)]
  },
  async correctRecord(draft) {
    await demoDelay(420)
    const found = db.attendance.find((r) => r.employeeId === draft.employeeId && r.date === draft.date)
    if (!found) throw new Error('No attendance record exists for this employee/date. Use Add missing record instead.')
    const original = found.checkIn
    const originalStatus = found.status
    found.checkIn = draft.checkIn ? minutesToClock(parseClockToMinutes(draft.checkIn) ?? null) : null
    found.checkOut = draft.checkOut ? minutesToClock(parseClockToMinutes(draft.checkOut) ?? null) : null
    found.workMinutes = found.checkIn && found.checkOut
      ? Math.max(0, (parseClockToMinutes(found.checkOut) ?? 0) - (parseClockToMinutes(found.checkIn) ?? 0)) : null
    found.status = deriveStatusAfterCorrection(found)
    found.source = 'manual-correction'
    found.version += 1
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'attendance.corrected',
      module: 'Attendance',
      target: `${draft.employeeId} · ${draft.date}`,
      at: new Date().toISOString(),
      detail: `Check-in ${original ?? '—'} → ${found.checkIn ?? '—'}; status ${labelStatus(originalStatus)} → ${labelStatus(found.status)}. Reason: ${draft.reason} (demo adapter, not persisted).`,
    })
    return structuredClone(found)
  },
  async addMissingRecord(draft) {
    await demoDelay(380)
    if (db.attendance.some((r) => r.employeeId === draft.employeeId && r.date === draft.date)) {
      throw new Error('A record already exists for this employee/date — use Correct existing record instead.')
    }
    const employee = db.employees.find((e) => e.id === draft.employeeId)
    const created: AttendanceRecord = {
      id: `ATT-${draft.employeeId.replace('EMP-', 'E')}-${draft.date.slice(5)}`,
      employeeId: draft.employeeId,
      employeeName: employee?.name ?? draft.employeeId,
      department: employee?.department ?? 'Operations',
      date: draft.date,
      checkIn: minutesToClock(parseClockToMinutes(draft.checkIn ?? '') ?? null),
      checkOut: minutesToClock(parseClockToMinutes(draft.checkOut ?? '') ?? null),
      workMinutes: null,
      status: 'UPCOMING',
      location: 'Kathmandu office',
      source: 'manual-entry',
      version: 1,
    }
    if (created.checkIn && created.checkOut) {
      created.workMinutes = Math.max(0, (parseClockToMinutes(created.checkOut) ?? 0) - (parseClockToMinutes(created.checkIn) ?? 0))
    }
    created.status = deriveStatusAfterCorrection(created)
    db.attendance.push(created)
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'attendance.added',
      module: 'Attendance',
      target: `${draft.employeeId} · ${draft.date}`,
      at: new Date().toISOString(),
      detail: `Missing record added (${draft.shiftLabel}). Reason: ${draft.reason} (demo adapter, not persisted).`,
    })
    return structuredClone(created)
  },
  async summaryForMonth(employeeId, monthPrefix) {
    await demoDelay(160)
    const rows = db.attendance.filter((r) => r.employeeId === employeeId && r.date.startsWith(monthPrefix))
    let present = 0
    let late = 0
    let absent = 0
    let leave = 0
    let minutes = 0
    let checkins = 0
    for (const row of rows) {
      if (row.status === 'PRESENT' || row.status === 'LATE') present += 1
      if (row.status === 'LATE') late += 1
      if (row.status === 'ABSENT') absent += 1
      if (row.status === 'ON_LEAVE') leave += 1
      if (row.workMinutes != null) {
        minutes += row.workMinutes
        checkins += 1
      }
    }
    return { presentDays: present, lateArrivals: late, absentDays: absent, leaveDays: leave, averageWorkMinutes: checkins ? Math.round(minutes / checkins) : null }
  },
}

function labelStatus(s: AttendanceStatus): string {
  return { PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent', ON_LEAVE: 'On leave', WEEKEND: 'Weekend', UPCOMING: 'Upcoming', NO_RECORD: 'No record' }[s]
}

/** Status is authoritative on the server; this is the same display rule. */
function deriveStatusAfterCorrection(record: AttendanceRecord): AttendanceStatus {
  if (record.status === 'ON_LEAVE' || record.status === 'ABSENT') return record.status
  const inMin = record.checkIn ? parseClockToMinutes(record.checkIn) : null
  if (inMin == null) return 'ABSENT'
  return inMin > 9 * 60 + 30 ? 'LATE' : 'PRESENT'
}

/** Oct 2026 elapsed workdays (Mon–Fri ≤ demo today) — used in calendar/reports. */
export const ELAPSED_WORKDAYS = ELAPSED_OCT_WORKDAYS

export const attendanceService: AttendanceService = API_MODE === 'api' ? realService : demoService
