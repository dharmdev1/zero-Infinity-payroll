import type { CompanyDocument, Paginated } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, paginate, searchAcross } from './query-utils'
import type { ListQuery } from './query-utils'

/**
 * REAL API CONTRACT (FastAPI, /api/v1):
 *   GET  /documents?category&search&page       (visibility filtered server-side)
 *   GET  /documents/{documentId}               (metadata + secure download URL)
 *   POST /documents/uploads                    (multipart; server enforces file contract)
 * Upload contract: PDF/JPG/PNG ≤10 MB each; CV PDF/DOCX ≤5 MB; photo JPG/PNG ≤2 MB.
 */
export interface DocumentService {
  list(filters: ListQuery): Promise<Paginated<CompanyDocument>>
  get(documentId: string): Promise<CompanyDocument>
  categories(): Promise<string[]>
}

const realService: DocumentService = {
  list: (filters) => apiClient.get<Paginated<CompanyDocument>>('/documents', { ...filters }),
  get: (documentId) => apiClient.get<CompanyDocument>(`/documents/${documentId}`),
  categories: () => apiClient.get<string[]>('/documents/categories'),
}

const demoService: DocumentService = {
  async list(filters) {
    await demoDelay(200)
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.documents
    rows = searchAcross(rows, search, ['name', 'category', 'owner', 'summary'])
    if (f.category) rows = rows.filter((d) => d.category.toLowerCase() === f.category)
    rows = rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return paginate(rows, page, pageSize)
  },
  async get(documentId) {
    await demoDelay(140)
    const found = db.documents.find((d) => d.id === documentId)
    if (!found) throw new Error(`Document not found: ${documentId}`)
    return structuredClone(found)
  },
  async categories() {
    return ['Policy', 'Template', 'Report', 'Shared', 'Employee']
  },
}

export const documentService: DocumentService = API_MODE === 'api' ? realService : demoService

/** Department-attendance rollup used by attendance report pages. */
export interface AttendanceReportRow {
  department: string
  eligibleDays: number
  present: number
  late: number
  absent: number
  onLeave: number
  rate: number
}

export interface ReportService {
  attendanceByDepartment(fromDate: string, toDate: string): Promise<{ rows: AttendanceReportRow[]; totals: AttendanceReportRow; eligibleEmployeeDays: number }>
}

/** REAL API: GET /reports/attendance?fromDate&toDate — denominator-correct aggregates. */
const realReportService: ReportService = {
  attendanceByDepartment: (fromDate, toDate) => apiClient.get('/reports/attendance', { fromDate, toDate }),
}

const demoReportService: ReportService = {
  async attendanceByDepartment(fromDate, toDate) {
    await demoDelay(260)
    const rows = db.attendance.filter((r) => r.date >= fromDate && r.date <= toDate && r.status !== 'UPCOMING')
    const headcountByDept = new Map<string, number>()
    for (const emp of db.employees.filter((e) => e.status !== 'INACTIVE')) {
      headcountByDept.set(emp.department, (headcountByDept.get(emp.department) ?? 0) + 1)
    }
    const departments = [...headcountByDept.keys()]
    const per: Map<string, { present: number; late: number; absent: number; leave: number }> = new Map(
      departments.map((d) => [d, { present: 0, late: 0, absent: 0, leave: 0 }]),
    )
    for (const r of rows) {
      const bucket = per.get(r.department)
      if (!bucket) continue
      if (r.status === 'PRESENT' || r.status === 'LATE') bucket.present += 1
      if (r.status === 'LATE') bucket.late += 1
      if (r.status === 'ABSENT') bucket.absent += 1
      if (r.status === 'ON_LEAVE') bucket.leave += 1
    }
    const dayCount = new Set(rows.map((r) => r.date)).size
    const out: AttendanceReportRow[] = departments.map((department) => {
      const b = per.get(department)!
      const eligibleDays = (headcountByDept.get(department) ?? 0) * dayCount
      return { department, eligibleDays, present: b.present, late: b.late, absent: b.absent, onLeave: b.leave, rate: eligibleDays ? round1((b.present / eligibleDays) * 100) : 0 }
    })
    const totalsPresent = out.reduce((acc, r) => acc + r.present, 0)
    const totalsEligible = out.reduce((acc, r) => acc + r.eligibleDays, 0)
    const totals: AttendanceReportRow = {
      department: 'All departments',
      eligibleDays: totalsEligible,
      present: totalsPresent,
      late: out.reduce((acc, r) => acc + r.late, 0),
      absent: out.reduce((acc, r) => acc + r.absent, 0),
      onLeave: out.reduce((acc, r) => acc + r.onLeave, 0),
      rate: totalsEligible ? round1((totalsPresent / totalsEligible) * 100) : 0,
    }
    return { rows: out.sort((a, b) => b.eligibleDays - a.eligibleDays), totals, eligibleEmployeeDays: totalsEligible }
  },
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export const reportService: ReportService = API_MODE === 'api' ? realReportService : demoReportService
