import { useQuery } from '@tanstack/react-query'
import { Card, EmptyState, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, attendanceStatusLabel, attendanceTone } from '@/components/data-display/status'
import { attendanceService } from '@/services/attendance'
import { db } from '@/services/demo/store'
import { formatNptDate, formatWorkMinutes } from '@/utils/npt'

export function EmployeeAttendanceTab({ employeeId }: { employeeId: string }) {
  const summary = useQuery({
    queryKey: ['attendance', 'summary', employeeId],
    queryFn: () => attendanceService.summaryForMonth(employeeId, db.today.slice(0, 7)),
  })
  const rows = useQuery({
    queryKey: ['attendance', 'emp-records', employeeId],
    queryFn: () => attendanceService.list({ employeeId, page: 1, pageSize: 15 }),
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Present days" value={String(summary.data?.presentDays ?? 0)} loading={summary.isLoading} note="Includes late arrivals" noteTone="green" />
        <StatCard label="Late arrivals" value={String(summary.data?.lateArrivals ?? 0)} loading={summary.isLoading} note="After 09:30 NPT" noteTone="orange" />
        <StatCard label="Absent days" value={String(summary.data?.absentDays ?? 0)} loading={summary.isLoading} note="Unexcused" noteTone="red" />
        <StatCard label="Avg work day" value={formatWorkMinutes(summary.data?.averageWorkMinutes ?? null)} loading={summary.isLoading} note="Recorded workdays" noteTone="blue" />
      </div>

      <Card>
        <div className="p-6 pb-2">
          <h3 className="text-[15px] font-semibold text-ink">Recent attendance</h3>
        </div>
        <ul className="divide-y divide-line">
          {rows.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="px-6 py-3">
                  <Skeleton className="h-4 w-full" />
                </li>
              ))
            : (rows.data?.items ?? []).length === 0
              ? (
                  <li>
                    <EmptyState title="No attendance records" />
                  </li>
                )
              : rows.data?.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div>
                      <p className="text-[13px] font-medium text-ink">{formatNptDate(`${r.date}T00:00:00Z`, true)}</p>
                      <p className="text-xs text-muted">
                        {r.checkIn ?? '—'} → {r.checkOut ?? '—'} · {formatWorkMinutes(r.workMinutes)}
                      </p>
                    </div>
                    <StatusBadge status={attendanceStatusLabel(r.status)} tone={attendanceTone(r.status)} />
                  </li>
                ))}
        </ul>
      </Card>
    </div>
  )
}
