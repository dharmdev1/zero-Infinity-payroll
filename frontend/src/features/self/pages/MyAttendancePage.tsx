import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { Pagination } from '@/components/data-display/table'
import { StatusBadge, attendanceTone, attendanceStatusLabel } from '@/components/data-display/status'
import { attendanceService } from '@/services/attendance'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { DEMO_TODAY } from '@/services/demo/store'
import { formatWorkMinutes, formatNptDate, SHIFT_LABEL } from '@/utils/npt'
import { useMyEmployeeId } from '../self-shared'

export function MyAttendancePage() {
  useHeader('My attendance', [{ label: 'Workspace' }, { label: 'My attendance' }])
  const employeeId = useMyEmployeeId()
  const [page, setPage] = useState(1)

  const rows = useQuery({
    queryKey: ['attendance', 'mine', employeeId, page],
    queryFn: () => attendanceService.list({ employeeId, page, pageSize: 10 }),
    enabled: !!employeeId,
  })
  const summary = useQuery({
    queryKey: ['attendance', 'mine-summary', employeeId],
    queryFn: () => attendanceService.summaryForMonth(employeeId, DEMO_TODAY.slice(0, 7)),
    enabled: !!employeeId,
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My attendance" description={`October 2026 · ${SHIFT_LABEL}`}>
        <Button variant="secondary" onClick={() => window.alert('Check-in will use the backend kiosk/remote endpoint. Demo mode does not record a real check-in.')}>
          Simulate check-in
        </Button>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present days" value={String(summary.data?.presentDays ?? 0)} loading={summary.isLoading} icon={null as never} note="Includes late arrivals" noteTone="green" />
        <StatCard label="Late arrivals" value={String(summary.data?.lateArrivals ?? 0)} loading={summary.isLoading} icon={null as never} note="Check-in after 09:30" noteTone="orange" />
        <StatCard label="Absent days" value={String(summary.data?.absentDays ?? 0)} loading={summary.isLoading} icon={null as never} note="No check-in, no leave" noteTone="red" />
        <StatCard label="Avg work day" value={formatWorkMinutes(summary.data?.averageWorkMinutes ?? null)} loading={summary.isLoading} icon={null as never} note="Across recorded days" noteTone="blue" />
      </div>

      <Card>
        <div className="p-6 pb-2"><SectionTitle title="My attendance records" description="Newest first. Corrections are versioned on the server." /></div>
        <ul className="divide-y divide-line">
          {rows.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="px-6 py-3"><Skeleton className="h-4 w-full" /></li>)
            : (rows.data?.items ?? []).length === 0
              ? <li><EmptyState title="No attendance records" /></li>
              : rows.data?.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{formatNptDate(`${r.date}T00:00:00Z`, true)}</p>
                      <p className="text-xs text-muted">
                        {r.checkIn ?? '—'} → {r.checkOut ?? '—'} · {formatWorkMinutes(r.workMinutes)} · {r.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted">v{r.version}</span>
                      <StatusBadge status={attendanceStatusLabel(r.status)} tone={attendanceTone(r.status)} />
                    </div>
                  </li>
                ))}
        </ul>
        <Pagination page={page} pageSize={10} total={rows.data?.total ?? 0} onPage={setPage} countsLabel="record rows" />
      </Card>

      <InfoNote tone="blue">
        Wrong info on a day? Raise an attendance correction — approvals live with your lead and HR (<span className="font-mono text-xs">self.request.correction</span>).
      </InfoNote>
    </div>
  )
}
