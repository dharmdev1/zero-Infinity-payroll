import { db } from './demo/store'
import type { CompanyDocument, PaginatedResult } from '@/types/domain'

export interface DepartmentAttendanceReportRow {
  department: string
  eligibleDays: number
  present: number
  late: number
  absent: number
  onLeave: number
  rate: number
}

export interface AttendanceReportSummary {
  eligibleEmployeeDays: number
  rows: DepartmentAttendanceReportRow[]
  totals: DepartmentAttendanceReportRow
}

export const documentService = {
  async categories(): Promise<string[]> {
    return ['Handbook', 'Policy', 'Template', 'Compliance']
  },

  async list(params: { category?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResult<CompanyDocument>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 12
    const filtered = db.documents.filter((d) => (params.category ? d.category === params.category : true))
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async get(documentId: string): Promise<CompanyDocument> {
    const found = db.documents.find((d) => d.id === documentId)
    if (!found) throw new Error(`Document ${documentId} not found`)
    return found
  },
}

export const reportService = {
  async attendanceByDepartment(_fromDate: string, _toDate: string): Promise<AttendanceReportSummary> {
    const depts = [...new Set(db.employees.map((e) => e.department))].sort()
    const rows: DepartmentAttendanceReportRow[] = depts.map((department) => {
      const att = db.attendance.filter((r) => r.department === department)
      const present = att.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
      const late = att.filter((r) => r.status === 'LATE').length
      const absent = att.filter((r) => r.status === 'ABSENT').length
      const onLeave = att.filter((r) => r.status === 'ON_LEAVE').length
      const eligibleDays = Math.max(present + absent + onLeave, 1)
      const rate = Math.round((present / eligibleDays) * 1000) / 10
      return { department, eligibleDays, present, late, absent, onLeave, rate }
    })
    const totals = rows.reduce<DepartmentAttendanceReportRow>(
      (acc, r) => ({
        department: 'All departments',
        eligibleDays: acc.eligibleDays + r.eligibleDays,
        present: acc.present + r.present,
        late: acc.late + r.late,
        absent: acc.absent + r.absent,
        onLeave: acc.onLeave + r.onLeave,
        rate: 0,
      }),
      { department: 'All departments', eligibleDays: 0, present: 0, late: 0, absent: 0, onLeave: 0, rate: 0 },
    )
    totals.rate = totals.eligibleDays ? Math.round((totals.present / totals.eligibleDays) * 1000) / 10 : 0
    return {
      eligibleEmployeeDays: totals.eligibleDays,
      rows,
      totals,
    }
  },
}
