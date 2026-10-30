import { db, getActiveSession } from './demo/store'
import type { PaginatedResult, PayrollRun, Payslip, SessionUser } from '@/types/domain'
import { hasPermission } from '@/types/rbac'

function resolveViewer(viewer?: SessionUser | null): SessionUser | null {
  return viewer !== undefined ? viewer : getActiveSession()
}

export const payrollService = {
  async runs(status = '', page = 1, pageSize = 10, viewer?: SessionUser | null): Promise<PaginatedResult<PayrollRun>> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'payroll.view')) {
      throw new Error('Unauthorized: Payroll runs are restricted to Super Admin.')
    }
    const filtered = db.payrollRuns.filter((r) => (status ? r.status === status : true))
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async run(runId: string, viewer?: SessionUser | null): Promise<PayrollRun> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'payroll.view')) {
      throw new Error('Unauthorized: Payroll runs are restricted to Super Admin.')
    }
    const found = db.payrollRuns.find((r) => r.id === runId)
    if (!found) throw new Error(`Payroll run ${runId} not found`)
    return found
  },

  async runPayslips(
    runId: string,
    params: { page?: number; pageSize?: number } = {},
    viewer?: SessionUser | null,
  ): Promise<PaginatedResult<Payslip>> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'payroll.view')) {
      throw new Error('Unauthorized: Run payslips are restricted to Super Admin.')
    }
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
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to view payslips.')
    }
    const canViewAllPayroll = hasPermission(v, 'payroll.view')
    if (!canViewAllPayroll && params.employeeId && params.employeeId !== v.employeeId) {
      throw new Error('Unauthorized: You can only view your own payslips.')
    }
    const effectiveEmployeeId = canViewAllPayroll ? params.employeeId : v.employeeId
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
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to access payslips.')
    }
    if (!hasPermission(v, 'payroll.view') && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: You can only access your own payslips.')
    }
    const list = db.payslips.filter((p) => p.employeeId === employeeId)
    return list[0] ?? null
  },

  async employeeYearTotals(employeeId: string, viewer?: SessionUser | null): Promise<Payslip[]> {
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to access payroll totals.')
    }
    if (!hasPermission(v, 'payroll.view') && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: You can only access your own payroll totals.')
    }
    return db.payslips.filter((p) => p.employeeId === employeeId)
  },

  async transition(
    runId: string,
    action: 'submit-review' | 'approve' | 'pay',
    note: string,
    viewer?: SessionUser | null,
  ): Promise<PayrollRun> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'payroll.manage')) {
      throw new Error('Unauthorized: Only Super Admin can manage payroll runs.')
    }
    const run = await this.run(runId, v)
    if (action === 'submit-review') run.status = 'REVIEW'
    if (action === 'approve') {
      run.status = 'APPROVED'
      run.approvedBy = v.name
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
      actor: v.name,
      target: runId,
      detail: `${action} (${run.period}) · ${note}`,
      at: new Date().toISOString(),
    })
    return run
  },
}

