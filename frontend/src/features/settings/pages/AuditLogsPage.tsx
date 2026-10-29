import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { TextInput } from '@/components/ui/form'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { settingsService } from '@/services/settings'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { AuditLogEntry } from '@/types/domain'
import { formatNptDateTime } from '@/utils/npt'

const MODULE_OPTIONS = [
  { value: '', label: 'All modules' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Employees', label: 'Employees' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Payroll', label: 'Payroll' },
  { value: 'Settings', label: 'Settings' },
]

export function AuditLogsPage() {
  useHeader('Audit logs', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/users' }, { label: 'Audit logs' }])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [page, setPage] = useState(1)

  const logs = useQuery({
    queryKey: ['settings', 'audit', { search, module, page }],
    placeholderData: keepPreviousData,
    queryFn: () => settingsService.audit({ ...(search ? { search } : {}), ...(module ? { module } : {}), page, pageSize: 15 }),
  })

  const columns: Array<Column<AuditLogEntry>> = [
    { key: 'action', header: 'Action', render: (l) => <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink">{l.action}</code> },
    { key: 'actor', header: 'Actor', render: (l) => <span className="font-medium text-ink">{l.actor}</span> },
    { key: 'target', header: 'Target' },
    { key: 'detail', header: 'Detail', className: 'max-w-[380px] whitespace-normal' },
    {
      key: 'at',
      header: 'When',
      align: 'right',
      render: (l) => <span className="whitespace-nowrap">{formatNptDateTime(l.at)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Audit logs" description="Append-only audit trail. Every server mutation writes an entry; demo-mode page actions append labeled entries too.">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}>
          <TextInput className="w-52" placeholder="Search log entries" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search audit logs" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <FilterSelect className="w-36" label="Module filter" value={module} onChange={(v) => { setModule(v); setPage(1) }} options={MODULE_OPTIONS} />
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={logs.data?.items ?? []}
        rowKey={(l) => l.id}
        loading={logs.isLoading}
        emptyState={<EmptyState title="No audit entries match" />}
        footer={<Pagination page={page} pageSize={15} total={logs.data?.total ?? 0} onPage={setPage} countsLabel="audit entries" />}
      />
    </div>
  )
}
