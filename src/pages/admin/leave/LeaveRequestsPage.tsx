import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge } from '@/components/data-display/status'
import { leaveService } from '@/services/leave'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { LeaveRequest } from '@/types/domain'
import { leaveStatusLabel, LEAVE_STATUSES, LEAVE_TYPES } from '@/modules/leave/leave-constants'
import { LeaveSubNav } from '@/modules/leave/LeaveSubNav'

export function LeaveRequestsPage() {
  useHeader('Leave requests', [{ label: 'Workspace' }, { label: 'Leave', to: '/leave' }, { label: 'Requests' }])

  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const list = useQuery({
    queryKey: ['leave', 'requests', { status, type, page }],
    placeholderData: keepPreviousData,
    queryFn: () => leaveService.list({ ...(status ? { status } : {}), ...(type ? { leaveType: type } : {}), page, pageSize }),
  })

  const columns: Array<Column<LeaveRequest>> = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.employeeName} size="sm" />
          <div>
            <Link to={`/employees/${r.employeeId}`} className="font-medium text-brand-600 hover:underline">{r.employeeName}</Link>
            <div className="font-mono text-[10px] text-muted">{r.employeeId}</div>
          </div>
        </div>
      ),
    },
    { key: 'leaveType', header: 'Type' },
    { key: 'startDate', header: 'Dates', render: (r) => <span>{r.startDate} → {r.endDate}</span> },
    { key: 'days', header: 'Days', align: 'right' },
    { key: 'reason', header: 'Reason' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <StatusBadge status={leaveStatusLabel[r.status]} tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : r.status === 'PENDING' ? 'orange' : 'gray'} />,
    },
    { key: 'decidedBy', header: 'Decided by', render: (r) => r.decidedBy ?? '—' },
  ]

  return (
    <div className="space-y-4">
      <LeaveSubNav />
      <PageHeaderBar title="Leave requests" description="Every request shows its current status and approver trail.">
        <FilterSelect
          className="w-40"
          label="Status filter"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={[{ value: '', label: 'All statuses' }, ...LEAVE_STATUSES.map((s) => ({ value: s, label: leaveStatusLabel[s] }))]}
        />
        <FilterSelect
          className="w-32"
          label="Type filter"
          value={type}
          onChange={(v) => { setType(v); setPage(1) }}
          options={[{ value: '', label: 'All types' }, ...LEAVE_TYPES.map((t) => ({ value: t, label: t }))]}
        />
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={list.data?.items ?? []}
        rowKey={(r) => r.id}
        loading={list.isLoading}
        emptyState={<EmptyState title="No leave requests match these filters" />}
        footer={<Pagination page={page} pageSize={pageSize} total={list.data?.total ?? 0} onPage={setPage} />}
      />
    </div>
  )
}
