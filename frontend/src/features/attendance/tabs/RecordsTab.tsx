import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, InfoNote } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { TextInput } from '@/components/ui/form'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, attendanceTone } from '@/components/data-display/status'
import { attendanceService } from '@/services/attendance'
import { db } from '@/services/demo/store'
import type { AttendanceRecord } from '@/types/domain'
import { formatWorkMinutes } from '@/utils/npt'

const DEPARTMENTS = ['Engineering', 'Finance', 'Human Resources', 'Marketing & IT', 'Design', 'Operations']

function statusLabel(status: AttendanceRecord['status']): string {
  switch (status) {
    case 'PRESENT': return 'Present'
    case 'LATE': return 'Late'
    case 'ABSENT': return 'Absent'
    case 'ON_LEAVE': return 'On leave'
    case 'WEEKEND': return 'Weekend'
    case 'UPCOMING': return 'Upcoming'
    default: return 'No record'
  }
}

export function AttendanceRecordsTab() {
  const [date, setDate] = useState(db.today)
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const query = useQuery({
    queryKey: ['attendance', 'records', { date, department, status, search: appliedSearch, page }],
    placeholderData: keepPreviousData,
    queryFn: () =>
      attendanceService.list({
        ...(date ? { date } : {}),
        ...(department ? { department } : {}),
        ...(status ? { status } : {}),
        ...(appliedSearch ? { search: appliedSearch } : {}),
        page,
        pageSize,
      }),
  })

  const columns: Array<Column<AttendanceRecord>> = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <Link to={`/employees/${r.employeeId}`} className="font-medium text-brand-600 hover:underline">
            {r.employeeName}
          </Link>
          <div className="font-mono text-[10px] text-muted">{r.employeeId}</div>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    { key: 'date', header: 'Date', align: 'right' },
    { key: 'checkIn', header: 'Check-in', align: 'right', render: (r) => <span className="font-mono">{r.checkIn ?? '—'}</span> },
    { key: 'checkOut', header: 'Check-out', align: 'right', render: (r) => <span className="font-mono">{r.checkOut ?? '—'}</span> },
    { key: 'workMinutes', header: 'Work hrs', align: 'right', render: (r) => formatWorkMinutes(r.workMinutes) },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <StatusBadge status={statusLabel(r.status)} tone={attendanceTone(r.status)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (r) => {
        const actionable = r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'ABSENT'
        return actionable ? (
          <Link
            to={`/attendance/manual?mode=correct&employeeId=${r.employeeId}&date=${r.date}`}
            className="text-[13px] font-medium text-brand-600 hover:underline"
          >
            Correct
          </Link>
        ) : r.status === 'UPCOMING' || r.status === 'NO_RECORD' ? (
          <Link
            to={`/attendance/manual?mode=add&employeeId=${r.employeeId}&date=${r.date}`}
            className="text-[13px] font-medium text-brand-600 hover:underline"
          >
            Add entry
          </Link>
        ) : (
          <span className="text-muted">—</span>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0">
            <label htmlFor="records-date" className="mb-1.5 block text-[13px] font-medium text-ink">Date</label>
            <input
              id="records-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1) }}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <FilterSelect
            label="Department"
            className="min-w-0"
            value={department}
            onChange={(v) => { setDepartment(v); setPage(1) }}
            options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
          />
          <FilterSelect
            label="Status"
            className="min-w-0"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'PRESENT', label: 'Present' },
              { value: 'LATE', label: 'Late' },
              { value: 'ABSENT', label: 'Absent' },
              { value: 'ON_LEAVE', label: 'On leave' },
            ]}
          />
          <form
            className="flex items-end gap-2 sm:col-span-2"
            onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); setPage(1) }}
          >
            <div className="min-w-0 flex-1">
              <TextInput
                id="records-search"
                label="Search"
                placeholder="Name or employee ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>
      </Card>

      <InfoNote tone="blue">
        Snapshot roster includes past employment-status categories; employment status is separate from daily attendance.
      </InfoNote>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        emptyState={
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">No attendance records match these filters</p>
            <p className="mt-1 text-[13px] text-muted">Try clearing the department or status filter.</p>
          </div>
        }
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={query.data?.total ?? 0}
            onPage={setPage}
            countsLabel="record rows"
          />
        }
      />
    </div>
  )
}
