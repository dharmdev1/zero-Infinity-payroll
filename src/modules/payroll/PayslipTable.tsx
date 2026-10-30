import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/base'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, payslipLabel, payslipTone } from '@/components/data-display/status'
import type { Payslip } from '@/types/domain'
import { formatNpr } from '@/utils/npr'
import { notifyBackendScoped } from '@/utils/backend-ops'

export function PayslipTable({
  rows,
  loading = false,
  withEmployeeLinks = true,
  withDownload = false,
  emptyState,
  footer,
}: {
  rows: Payslip[]
  loading?: boolean
  withEmployeeLinks?: boolean
  withDownload?: boolean
  emptyState?: ReactNode
  footer?: ReactNode
}) {
  const columns: Array<Column<Payslip>> = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (p) => (
        <div>
          {withEmployeeLinks ? (
            <Link to={`/employees/${p.employeeId}`} className="font-medium text-brand-600 hover:underline">
              {p.employeeName}
            </Link>
          ) : (
            <span className="font-medium text-ink">{p.employeeName}</span>
          )}
          <div className="font-mono text-[10px] text-muted">{p.employeeId}</div>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    { key: 'period', header: 'Period' },
    { key: 'grossPaisa', header: 'Gross', align: 'right', render: (p) => formatNpr(p.grossPaisa) },
    { key: 'deductionsPaisa', header: 'Deductions', align: 'right', render: (p) => formatNpr(p.deductionsPaisa) },
    { key: 'netPaisa', header: 'Net pay', align: 'right', render: (p) => <span className="font-semibold text-ink">{formatNpr(p.netPaisa)}</span> },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => <StatusBadge status={payslipLabel(p.status)} tone={payslipTone(p.status)} />,
    },
    ...(withDownload
      ? [
          {
            key: 'download',
            header: '',
            align: 'right' as const,
            render: (p: Payslip) => (
              <Button size="sm" variant="secondary" onClick={() => notifyBackendScoped(`Payslip PDF (${p.id})`)}>
                PDF
              </Button>
            ),
          },
        ]
      : []),
  ]

  return <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} loading={loading} emptyState={emptyState} footer={footer} />
}
