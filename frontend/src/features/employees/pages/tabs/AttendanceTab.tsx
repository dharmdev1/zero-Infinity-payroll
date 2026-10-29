import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, InfoNote, Skeleton } from '@/components/ui/base'
import { Pagination } from '@/components/data-display/table'
import { StatusBadge, attendanceTone, attendanceStatusLabel } from '@/components/data-display/status'
import { StatCard } from '@/components/data-display/stat-card'
import { attendanceService } from '@/services/attendance'
import { db } from '@/services/demo/store'
import { ELAPSED_WORKDAYS } from '@/services/attendance'
import { formatWorkMinutes, formatNptDate } from '@/utils/npt'
import { notifyBackendScoped } from '@/utils/backend-ops'

export function EmployeeAttendanceTab({ employeeId }: { employeeId: string }) {
  const [page, setPage] = useState(1)
  const summary = useQuery({ queryKey: ['attendance-summary', employeeId], queryFn: () => attendanceService.summaryForMonth(employeeId, db.today.slice(0, 7)) })
  const list = useQuery({
    queryKey: ['attendance', employeeId, page],
    queryFn: () => attendanceService.list({ employeeId, fromDate: '2026-10-01', toDate: db.today, page, pageSize: 5 }),
  })

  const s = summary.data
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Attendance summary</h3>
          <p className="mt-0.5 text-[13px] text-muted">October 2026 · {ELAPSED_WORKDAYS} elapsed workdays · Nepal Standard Time</p>
        </div>
        <Button variant="secondary" onClick={() => notifyBackendScoped('Employee attendance export')}>Export attendance</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present" value={`${s?.presentDays ?? 0} days`} loading={summary.isLoading} icon={null as never} note={s?.lateArrivals ? `Includes ${s.lateArrivals} late arrival${s.lateArrivals > 1 ? 's' : ''}` : 'No late arrivals this month'} noteTone={s?.lateArrivals ? 'green' : 'muted'} />
        <StatCard label="Absent" value={`${s?.absentDays ?? 0} day${(s?.absentDays ?? 0) === 1 ? '' : 's'}`} loading={summary.isLoading} icon={null as never} note="Unplanned absence" noteTone="red" />
        <StatCard label="On leave" value={`${s?.leaveDays ?? 0} day${(s?.leaveDays ?? 0) === 1 ? '' : 's'}`} loading={summary.isLoading} icon={null as never} note="Approved leave" noteTone="blue" />
        <StatCard label="Average work hours" value={formatWorkMinutes(s?.averageWorkMinutes ?? null)} loading={summary.isLoading} icon={null as never} note="Standard shift · 09:30 – 17:30" noteTone="blue" />
      </div>

      <Card>
        <div className="p-6 pb-4">
          <h3 className="text-[15px] font-semibold text-ink">Attendance records</h3>
          <p className="mt-0.5 text-[13px] text-muted">Latest records for this month</p>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[640px] text-sm" role="table">
            <thead>
              <tr className="border-y border-line bg-[#F8FAFD]">
                <th className="table-caption px-6 py-2.5 text-left">Date</th>
                <th className="table-caption px-4 py-2.5 text-left">Check-in</th>
                <th className="table-caption px-4 py-2.5 text-left">Check-out</th>
                <th className="table-caption px-4 py-2.5 text-left">Work hours</th>
                <th className="table-caption px-4 py-2.5 text-left">Status</th>
                <th className="table-caption px-6 py-2.5 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td></tr>
              ) : (list.data?.items ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3.5 text-[13px] font-medium">{formatNptDate(`${r.date}T00:00:00Z`, true)}</td>
                  <td className="px-4 py-3.5 text-[13px]">{r.checkIn ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[13px]">{r.checkOut ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[13px]">{formatWorkMinutes(r.workMinutes)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={attendanceStatusLabel(r.status)} tone={attendanceTone(r.status)} /></td>
                  <td className="px-6 py-3.5 text-[13px] text-muted">{r.location ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.data ? <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} countsLabel="records" /> : null}
      </Card>
      <InfoNote tone="blue">Attendance records are read-only here. Corrections are managed in the Attendance module and retain an audit history.</InfoNote>
    </div>
  )
}
