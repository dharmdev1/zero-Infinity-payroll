import { Link } from 'react-router-dom'
import { Avatar, Button } from '@/components/ui/base'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, payslipLabel, payslipTone } from '@/components/data-display/status'
import type { Payslip } from '@/types/domain'
import { formatNpr } from '@/utils/npr'
import { notifyBackendScoped } from '@/utils/backend-ops'

/** Shared payslip table for the run detail page and the global payslips list. */
export function PayslipTable({
  rows,
  loading,
  emptyState,
  footer,
  withEmployeeLinks = true,
  withDownload = false,
}: {
  rows: Payslip[]
  loading: boolean
  emptyState?: React.ReactNode
  footer?: React.ReactNode
  withEmployeeLinks?: boolean
  withDownload?: boolean
}) {
  return (
    <DataTable
      columns={payslipColumns(withEmployeeLinks, withDownload)}
      rows={rows}
      rowKey={(p) => p.id}
      loading={loading}
      emptyState={emptyState}
      footer={footer}
    />
  )
}

function payslipColumns(withEmployeeLinks: boolean, withDownload: boolean): Array<Column<Payslip>> {
  const columns: Array<Column<Payslip>> = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.employeeName} size="sm" />
          <div>
            {withEmployeeLinks ? (
              <Link to="/payroll/payslips" className="font-medium text-brand-600 hover:underline">{p.employeeName}</Link>
            ) : (
              <p className="font-medium text-ink">{p.employeeName}</p>
            )}
            <div className="font-mono text-[10px] text-muted">{p.employeeId}</div>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    { key: 'grossPaisa', header: 'Gross', align: 'right', render: (p) => formatNpr(p.grossPaisa) },
    { key: 'deductionsPaisa', header: 'Deductions', align: 'right', render: (p) => formatNpr(p.deductionsPaisa) },
    { key: 'taxesPaisa', header: 'Taxes', align: 'right', render: (p) => formatNpr(p.taxesPaisa) },
    { key: 'netPaisa', header: 'Net', align: 'right', render: (p) => <span className="font-semibold text-ink">{formatNpr(p.netPaisa)}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (p) => <StatusBadge status={payslipLabel(p.status)} tone={payslipTone(p.status)} /> },
  ]
  if (!withDownload) columns.splice(2, 0, { key: 'period', header: 'Period' })
  else {
    columns.push({
      key: 'download',
      header: '',
      align: 'right',
      render: () => (
        <Button size="sm" variant="secondary" onClick={() => notifyBackendScoped('Payslip PDF (signed download URL)')}>
          PDF
        </Button>
      ),
    })
  }
  return columns
}
