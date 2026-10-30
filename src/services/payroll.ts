import { db } from './demo/store'
import type { PaginatedResult, PayrollRun, Payslip, SessionUser } from '@/types/domain'

export const payrollService = {
  async runs(status = '', page = 1, pageSize = 10): Promise<PaginatedResult<PayrollRun>> {
    const filtered = db.payrollRuns.filter((r) => (status ? r.status === status : true))
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async run(runId: string): Promise<PayrollRun> {
    const found = db.payrollRuns.find((r) => r.id === runId)
    if (!found) throw new Error(`Payroll run ${runId} not found`)
    return found
  },

  async runPayslips(runId: string, params: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<Payslip>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const filtered = db.payslips.filter((p) => p.runId === runId)
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async payslips(
    params: { status?: string; employeeId?: string; page?: number; pageSize?: number } = {},
    viewer?: SessionUser | null,
  ): Promise<PaginatedResult<Payslip>> {
    if (viewer?.role === 'EMPLOYEE' && params.employeeId && params.employeeId !== viewer.employeeId) {
      throw new Error('Unauthorized: Employees can only view their own payslips.')
    }
    const effectiveEmployeeId = viewer?.role === 'EMPLOYEE' ? viewer.employeeId : params.employeeId
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 15
    const filtered = db.payslips.filter((p) => {
      if (params.status && p.status !== params.status) return false
      if (effectiveEmployeeId && p.employeeId !== effectiveEmployeeId) return false
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

  async latestForEmployee(employeeId: string, viewer?: SessionUser | null): Promise<Payslip | null> {
    if (viewer?.role === 'EMPLOYEE' && viewer.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only access their own payslips.')
    }
    const list = db.payslips.filter((p) => p.employeeId === employeeId)
    return list[0] ?? null
  },

  async employeeYearTotals(employeeId: string, viewer?: SessionUser | null): Promise<Payslip[]> {
    if (viewer?.role === 'EMPLOYEE' && viewer.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only access their own payroll totals.')
    }
    return db.payslips.filter((p) => p.employeeId === employeeId)
  },

  async transition(runId: string, action: 'submit-review' | 'approve' | 'pay', note: string): Promise<PayrollRun> {
    const run = await this.run(runId)
    if (action === 'submit-review') run.status = 'REVIEW'
    if (action === 'approve') {
      run.status = 'APPROVED'
      run.approvedBy = 'Aarav Karki'
    }
    if (action === 'pay') {
      run.status = 'PAID'
      run.paidAt = db.today
      db.payslips.forEach((p) => {
        if (p.runId === runId) p.status = 'PAID'
      })
    }
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      action: `payroll.run.${action}`,
      module: 'Payroll',
      actor: 'Aarav Karki',
      target: runId,
      detail: `${action} (${run.period}) · ${note}`,
      at: new Date().toISOString(),
    })
    return run
  },
}
