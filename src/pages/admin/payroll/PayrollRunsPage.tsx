import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { PayrollRun } from '@/types/domain'
import { formatNpr } from '@/utils/npr'

export function PayrollRunsPage() {
  useHeader('Payroll runs', [{ label: 'Workspace' }, { label: 'Payroll', to: '/payroll' }, { label: 'Runs' }])
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const runs = useQuery({
    queryKey: ['payroll', 'runs-list', { status, page }],
    placeholderData: keepPreviousData,
    queryFn: () => payrollService.runs(status, page, 10),
  })

  const columns: Array<Column<PayrollRun>> = [
    {
      key: 'period',
      header: 'Period',
      render: (r) => (
        <div>
          <Link to={`/payroll/runs/${r.id}`} className="font-medium text-brand-600 hover:underline">
            {r.period}
          </Link>
          <div className="font-mono text-[10px] text-muted">{r.id}</div>
        </div>
      ),
    },
    { key: 'employeesCount', header: 'Employees', align: 'right' },
    { key: 'totalGrossPaisa', header: 'Gross', align: 'right', render: (r) => formatNpr(r.totalGrossPaisa) },
    { key: 'totalDeductionsPaisa', header: 'Deductions', align: 'right', render: (r) => formatNpr(r.totalDeductionsPaisa) },
    { key: 'totalNetPaisa', header: 'Net payable', align: 'right', render: (r) => <span className="font-semibold text-ink">{formatNpr(r.totalNetPaisa)}</span> },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <StatusBadge status={r.status} tone={payrollRunTone(r.status)} />,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Payroll runs" description="Monthly payroll batches and approval states.">
        <FilterSelect
          className="w-40"
          label="Status filter"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'REVIEW', label: 'Review' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'PAID', label: 'Paid' },
          ]}
        />
        <Link to="/payroll/payslips"><Button variant="secondary">Payslips</Button></Link>
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={runs.data?.items ?? []}
        rowKey={(r) => r.id}
        loading={runs.isLoading}
        emptyState={<EmptyState title="No payroll runs match" />}
        footer={<Pagination page={page} pageSize={10} total={runs.data?.total ?? 0} onPage={setPage} countsLabel="runs" />}
      />
    </div>
  )
}
