import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, EmptyState, InfoNote } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { TextInput, TextArea } from '@/components/ui/form'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { PayrollRun } from '@/types/domain'
import { formatNpr } from '@/utils/npr'
import { db } from '@/services/demo/store'

export function PayrollRunsPage() {
  useHeader('Payroll runs', [{ label: 'Workspace' }, { label: 'Payroll', to: '/payroll' }, { label: 'Runs' }])
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [period, setPeriod] = useState('November 2026')
  const [notes, setNotes] = useState('')

  const runs = useQuery({
    queryKey: ['payroll', 'runs', { search, page }],
    placeholderData: keepPreviousData,
    queryFn: () => payrollService.runs(search, page, 10),
  })

  const createRun = useMutation({
    mutationFn: () => payrollService.createRun(period.trim() || db.today.slice(0, 7), notes.trim() || 'Created from the runs page'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll'] })
      setCreateOpen(false)
      setNotes('')
    },
  })

  const columns: Array<Column<PayrollRun>> = [
    {
      key: 'period',
      header: 'Period',
      render: (r) => (
        <div>
          <Link to={`/payroll/runs/${r.id}`} className="font-medium text-brand-600 hover:underline">{r.period}</Link>
          <div className="font-mono text-[10px] text-muted">{r.id}</div>
        </div>
      ),
    },
    { key: 'employeesCount', header: 'Employees', align: 'right' },
    { key: 'totalGrossPaisa', header: 'Gross', align: 'right', render: (r) => formatNpr(r.totalGrossPaisa) },
    { key: 'totalDeductionsPaisa', header: 'Deductions', align: 'right', render: (r) => formatNpr(r.totalDeductionsPaisa) },
    { key: 'totalNetPaisa', header: 'Net', align: 'right', render: (r) => <span className="font-semibold text-ink">{formatNpr(r.totalNetPaisa)}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <StatusBadge status={r.status} tone={payrollRunTone(r.status)} /> },
    { key: 'createdAt', header: 'Created', align: 'right', render: (r) => r.createdAt.slice(0, 10) },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Payroll runs" description="Monthly runs move Draft → Review → Approved → Paid. Amounts are NPR, stored as paisa integers.">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}>
          <TextInput className="w-48" placeholder="Search by period" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search payroll runs" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        {can('payroll.manage') ? <Button onClick={() => setCreateOpen(true)}>New run</Button> : null}
      </PageHeaderBar>

      {createRun.isSuccess ? <InfoNote tone="green">Draft run created (demo adapter, not persisted).</InfoNote> : null}

      <DataTable
        columns={columns}
        rows={runs.data?.items ?? []}
        rowKey={(r) => r.id}
        loading={runs.isLoading}
        emptyState={<EmptyState title="No payroll runs" description="Create a run to begin processing." />}
        footer={<Pagination page={page} pageSize={10} total={runs.data?.total ?? 0} onPage={setPage} />}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New payroll run"
        description="Creates a draft run. Employees and amounts load from the backend when live."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={createRun.isPending} onClick={() => createRun.mutate()}>Create draft run</Button>
          </>
        }
      >
        <div className="space-y-4 pt-1">
          <TextInput label="Period" required value={period} onChange={(e) => setPeriod(e.target.value)} hint="Payroll period, e.g. November 2026" />
          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context recorded with the run" />
        </div>
      </Dialog>
    </div>
  )
}
