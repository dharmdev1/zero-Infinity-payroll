import type { PayrollRun, Payslip } from '../../types/domain'
import { EMPLOYEES } from './employees.fixture'
import { DEMO_TODAY, hashSeed, seededRandom } from './employees.fixture'

/**
 * Payroll figures are demo placeholders in paisa. The frontend performs no
 * authoritative payroll math; totals shown are the values a future backend
 * would return per run.
 */
export const PAYROLL_RUNS: PayrollRun[] = [
  {
    id: 'PRN-2026-10', period: 'October 2026', status: 'REVIEW', employeesCount: 48,
    totalGrossPaisa: 72000000, totalDeductionsPaisa: 9600000, totalNetPaisa: 62400000,
    createdAt: `${DEMO_TODAY}T09:30:00+05:45`, createdBy: 'Sita Khatri', approvedBy: null,
    notes: 'Draft for review — includes festival allowance for October.',
  },
  {
    id: 'PRN-2026-09', period: 'September 2026', status: 'PAID', employeesCount: 48,
    totalGrossPaisa: 71400000, totalDeductionsPaisa: 9500000, totalNetPaisa: 61900000,
    createdAt: '2026-09-30T09:30:00+05:45', createdBy: 'Sita Khatri', approvedBy: 'Admin',
    notes: 'Paid 30 Sep 2026 via bank transfer batch.',
  },
  {
    id: 'PRN-2026-08', period: 'August 2026', status: 'PAID', employeesCount: 47,
    totalGrossPaisa: 70100000, totalDeductionsPaisa: 9300000, totalNetPaisa: 60800000,
    createdAt: '2026-08-31T09:30:00+05:45', createdBy: 'Sita Khatri', approvedBy: 'Admin',
    notes: 'Paid 31 Aug 2026. EMP-009 had not joined yet.',
  },
]

function payslipFor(run: PayrollRun, employeeId: string, employeeName: string, department: string): Payslip {
  const rnd = seededRandom(hashSeed(run.id, employeeId))
  const base = 1_200_000 + Math.floor(rnd() * 900_000) // 12k – 21k rupees gross
  const allowance = Math.floor(rnd() * 150_000)
  const gross = base + allowance
  const deductions = 130_000 + Math.floor(rnd() * 90_000)
  const taxes = 55_000 + Math.floor(rnd() * 60_000)
  const net = gross - deductions - taxes
  return {
    id: `PSL-${run.id}-${employeeId}`,
    employeeId,
    employeeName,
    department: department as Payslip['department'],
    runId: run.id,
    period: run.period,
    status: run.status === 'PAID' ? 'PAID' : run.status === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL',
    grossPaisa: gross,
    deductionsPaisa: deductions,
    taxesPaisa: taxes,
    netPaisa: net,
  }
}

export function buildPayslips(): Payslip[] {
  const out: Payslip[] = []
  for (const run of PAYROLL_RUNS) {
    for (const emp of EMPLOYEES) {
      if (emp.status === 'INACTIVE' && run.status !== 'PAID') continue
      out.push(payslipFor(run, emp.id, emp.name, emp.department))
    }
  }
  return out
}

export function payslipLineItems(runId: string): Payslip[] {
  const run = PAYROLL_RUNS.find((r) => r.id === runId)!
  return EMPLOYEES.filter((e) => e.status !== 'INACTIVE' || run.status === 'PAID').map((e) =>
    payslipFor(run, e.id, e.name, e.department),
  )
}
