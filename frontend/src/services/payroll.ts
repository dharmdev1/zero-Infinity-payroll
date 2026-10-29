import type { PaisaAmount, PayrollRun, Paginated, Payslip } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, paginate, searchAcross } from './query-utils'
import type { ListQuery } from './query-utils'

/**
 * REAL API CONTRACT (FastAPI, /api/v1).
 * All run/payslip payloads come from the backend; the frontend never performs
 * payroll math. Sensitive totals decrypt only for permissioned sessions.
 *   GET  /payroll/runs?page
 *   GET  /payroll/runs/{runId}
 *   POST /payroll/runs                    { period, notes }
 *   POST /payroll/runs/{runId}/submit-review|approve|pay
 *   GET  /payroll/runs/{runId}/payslips?page
 *   GET  /payroll/payslips?employeeId&page
 */
export interface PayrollService {
  runs(search: string, page: number, pageSize: number): Promise<Paginated<PayrollRun>>
  run(runId: string): Promise<PayrollRun>
  runPayslips(runId: string, filters: ListQuery): Promise<Paginated<Payslip>>
  createRun(period: string, notes: string): Promise<PayrollRun>
  transition(runId: string, action: 'submit-review' | 'approve' | 'pay', note: string): Promise<PayrollRun>
  payslips(filters: ListQuery): Promise<Paginated<Payslip>>
  latestForEmployee(employeeId: string): Promise<Payslip | null>
  employeeYearTotals(employeeId: string): Promise<Array<{ period: string; netPaisa: PaisaAmount; runId: string; status: string }>>
}

const realService: PayrollService = {
  runs: (search, page, pageSize) => apiClient.get<Paginated<PayrollRun>>('/payroll/runs', { search, page, pageSize }),
  run: (runId) => apiClient.get<PayrollRun>(`/payroll/runs/${runId}`),
  runPayslips: (runId, filters) => apiClient.get<Paginated<Payslip>>(`/payroll/runs/${runId}/payslips`, { ...filters }),
  createRun: (period, notes) => apiClient.post<PayrollRun>('/payroll/runs', { period, notes }),
  transition: (runId, action, note) => apiClient.post<PayrollRun>(`/payroll/runs/${runId}/${action}`, { note }),
  payslips: (filters) => apiClient.get<Paginated<Payslip>>('/payroll/payslips', { ...filters }),
  latestForEmployee: async (employeeId) => {
    const page = await apiClient.get<Paginated<Payslip>>('/payroll/payslips', { employeeId, pageSize: 1, sort: 'period.desc' })
    return page.items[0] ?? null
  },
  employeeYearTotals: (employeeId) => apiClient.get<Array<{ period: string; netPaisa: number; runId: string; status: string }>>('/payroll/payslips/summary', { employeeId }),
}

const demoService: PayrollService = {
  async runs(search, page, pageSize) {
    await demoDelay(200)
    return paginate(searchAcross(db.payrollRuns, search, ['period']), page, pageSize)
  },
  async run(runId) {
    await demoDelay(150)
    const found = db.payrollRuns.find((r) => r.id === runId)
    if (!found) throw new Error(`Payroll run not found: ${runId}`)
    return structuredClone(found)
  },
  async runPayslips(runId, filters) {
    await demoDelay(260)
    const { search, page, pageSize } = normalizeQuery(filters)
    let rows = db.payslips.filter((p) => p.runId === runId)
    rows = searchAcross(rows, search, ['employeeName', 'employeeId', 'department'])
    return paginate(rows.sort((a, b) => a.employeeId.localeCompare(b.employeeId)), page, pageSize)
  },
  async createRun(period, notes) {
    await demoDelay(420)
    const id = `PRN-${period.toLowerCase().replace(/\s+/g, '-').slice(0, 9)}-${Math.floor(Math.random() * 99)}`
    const created: PayrollRun = {
      id,
      period,
      status: 'DRAFT',
      employeesCount: 48,
      totalGrossPaisa: 72_000_000,
      totalDeductionsPaisa: 9_600_000,
      totalNetPaisa: 62_400_000,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      approvedBy: null,
      notes,
    }
    db.payrollRuns.unshift(created)
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'payroll.created',
      module: 'Payroll',
      target: id,
      at: new Date().toISOString(),
      detail: `Draft payroll run created for ${period} (demo adapter, not persisted).`,
    })
    return structuredClone(created)
  },
  async transition(runId, action, note) {
    await demoDelay(340)
    const run = db.payrollRuns.find((r) => r.id === runId)
    if (!run) throw new Error(`Payroll run not found: ${runId}`)
    run.status = action === 'submit-review' ? 'REVIEW' : action === 'approve' ? 'APPROVED' : 'PAID'
    if (action === 'approve') run.approvedBy = 'Admin'
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: `payroll.${action}`,
      module: 'Payroll',
      target: runId,
      at: new Date().toISOString(),
      detail: `Run moved to ${run.status}${note ? ` — ${note}` : ''} (demo adapter, not persisted).`,
    })
    return structuredClone(run)
  },
  async payslips(filters) {
    await demoDelay(220)
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.payslips
    if (f.runId) rows = rows.filter((p) => p.runId === f.runId)
    if (f.employeeId) rows = rows.filter((p) => p.employeeId === f.employeeId)
    if (f.status) rows = rows.filter((p) => p.status.toLowerCase() === f.status)
    rows = searchAcross(rows, search, ['employeeName', 'employeeId', 'period'])
    return paginate(rows.sort((a, b) => b.period.localeCompare(a.period) || a.employeeId.localeCompare(b.employeeId)), page, pageSize)
  },
  async latestForEmployee(employeeId) {
    await demoDelay(140)
    const own = db.payslips.filter((p) => p.employeeId === employeeId).sort((a, b) => b.period.localeCompare(a.period))
    return own[0] ? structuredClone(own[0]) : null
  },
  async employeeYearTotals(employeeId) {
    await demoDelay(160)
    return db.payslips
      .filter((p) => p.employeeId === employeeId)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((p) => ({ period: p.period, netPaisa: p.netPaisa, runId: p.runId, status: p.status }))
  },
}

export const payrollService: PayrollService = API_MODE === 'api' ? realService : demoService
