import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { attendanceTone, StatusBadge } from '@/components/data-display/status'
import { attendanceService } from '@/services/attendance'
import { db } from '@/services/demo/store'
import { SHIFT_LABEL } from '@/utils/npt'

export function AttendanceDashboardTab() {
  const today = useQuery({ queryKey: ['attendance', 'date', db.today], queryFn: () => attendanceService.list({ date: db.today, page: 1, pageSize: 200 }) })
  const rows = today.data?.items ?? []

  const counts = {
    present: rows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
    late: rows.filter((r) => r.status === 'LATE').length,
    absent: rows.filter((r) => r.status === 'ABSENT').length,
    leave: rows.filter((r) => r.status === 'ON_LEAVE').length,
  }
  const total = today.data?.total ?? 0
  const rate = total ? Math.round((counts.present / total) * 1000) / 10 : 0

  const byDepartment = Object.entries(
    rows.reduce<Record<string, { present: number; late: number; absent: number; leave: number }>>((acc, r) => {
      acc[r.department] ??= { present: 0, late: 0, absent: 0, leave: 0 }
      if (r.status === 'PRESENT' || r.status === 'LATE') acc[r.department].present += 1
      if (r.status === 'LATE') acc[r.department].late += 1
      if (r.status === 'ABSENT') acc[r.department].absent += 1
      if (r.status === 'ON_LEAVE') acc[r.department].leave += 1
      return acc
    }, {}),
  ).map(([department, v]) => ({ department, ...v }))

  const exceptions = [
    { name: 'Dharm Dev', id: 'EMP-004', status: 'Late', detail: '09:42 AM · 12 minutes late' },
    { name: 'Kabir Joshi', id: 'EMP-009', status: 'Absent', detail: 'No check-in · follow up with lead' },
    { name: 'Nisha Gurung', id: 'EMP-005', status: 'On leave', detail: 'Approved annual leave' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-ink">Attendance dashboard</h2>
          <p className="mt-1 text-[13px] text-muted">Wednesday, 28 October 2026 · End-of-day snapshot at 6:00 PM NPT</p>
        </div>
        <Link to="/attendance/corrections">
          <Button>Manual &amp; corrections</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Present today" value={String(counts.present)} loading={today.isLoading} icon={null as never} note={`${rate}% of ${total} · includes ${counts.late} late`} noteTone="green" />
        <StatCard label="Absent" value={String(counts.absent)} loading={today.isLoading} icon={null as never} note="No check-in and no approved leave" noteTone="red" />
        <StatCard label="Late arrivals" value={String(counts.late)} loading={today.isLoading} icon={null as never} note="Subset of present · not additional" noteTone="orange" />
        <StatCard label="On leave" value={String(counts.leave)} loading={today.isLoading} icon={null as never} note="Approved leave for today" noteTone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h3 className="text-[15px] font-semibold text-ink">Today's attendance breakdown</h3>
          <p className="mt-0.5 text-[13px] text-muted">{total} employees in this reporting snapshot · each employee counted once below</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full" role="img" aria-label={`Attendance breakdown: ${counts.present - counts.late} on time, ${counts.late} late, ${counts.absent} absent, ${counts.leave} on leave`}>
            <div className="bg-success" style={{ width: `${((counts.present - counts.late) / Math.max(total, 1)) * 100}%` }} />
            <div className="bg-warning-accent" style={{ width: `${(counts.late / Math.max(total, 1)) * 100}%` }} />
            <div className="bg-danger" style={{ width: `${(counts.absent / Math.max(total, 1)) * 100}%` }} />
            <div className="bg-brand-600" style={{ width: `${(counts.leave / Math.max(total, 1)) * 100}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'On time', value: counts.present - counts.late, dot: 'bg-success' },
              { label: 'Late', value: counts.late, dot: 'bg-warning-accent' },
              { label: 'Absent', value: counts.absent, dot: 'bg-danger' },
              { label: 'On leave', value: counts.leave, dot: 'bg-brand-600' },
            ].map((s) => (
              <div key={s.label}>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" /> {s.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-[15px] font-semibold text-ink">Standard shift</h3>
          <p className="mt-2 text-[22px] font-bold text-ink">09:30 – 17:30</p>
          <p className="mt-1 text-[13px] text-muted">Monday–Friday · Nepal Standard Time</p>
          <p className="text-[13px] text-muted">(UTC+05:45)</p>
          <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
            Late = check-in after 09:30. Approved leave is separate from absence.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Attendance by department</h3>
              <p className="mt-0.5 text-[13px] text-muted">Checked in includes late arrivals</p>
            </div>
            <Link to="/attendance/records" className="text-[13px] font-medium text-brand-600 hover:underline">
              View records →
            </Link>
          </div>
          <div className="scroll-x">
            <table className="w-full border-collapse text-sm" role="table">
              <thead>
                <tr className="border-y border-line bg-[#F8FAFD]">
                  <th className="th-caption px-4 py-2 text-left">Department</th>
                  <th className="th-caption px-3 py-2 text-right">Total</th>
                  <th className="th-caption px-3 py-2 text-right">Present</th>
                  <th className="th-caption px-3 py-2 text-right">Late¹</th>
                  <th className="th-caption px-3 py-2 text-right">Absent</th>
                  <th className="th-caption px-4 py-2 text-right">Leave</th>
                </tr>
              </thead>
              <tbody>
                {today.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-2.5"><Skeleton className="h-3.5 w-full" /></td>
                      </tr>
                    ))
                  : byDepartment.map((d) => (
                      <tr key={d.department} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-2.5 text-[13px] font-medium text-ink-deep">{d.department}</td>
                        <td className="px-3 py-2.5 text-right text-[13px] text-muted">{d.present + d.late + d.absent + d.leave}</td>
                        <td className="px-3 py-2.5 text-right text-[13px]">{d.present}</td>
                        <td className="px-3 py-2.5 text-right text-[13px]">{d.late}</td>
                        <td className="px-3 py-2.5 text-right text-[13px]">{d.absent}</td>
                        <td className="px-4 py-2.5 text-right text-[13px]">{d.leave}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-6 py-3 text-xs text-muted">¹ Late is included in Present. {counts.present} present + {counts.absent} absent + {counts.leave} leave = {total}.</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-[15px] font-semibold text-ink">Today's exceptions</h3>
          <p className="mt-0.5 text-[13px] text-muted">Selected team updates</p>
          <ul className="mt-4 space-y-4">
            {exceptions.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar name={e.name} tone={e.status === 'Late' ? 'orange' : e.status === 'Absent' ? 'red' : 'blue'} size="sm" />
                  <div>
                    <p className="text-[13px] font-semibold text-brand-600">{e.name}</p>
                    <p className="font-mono text-[10px] text-muted">{e.id}</p>
                    <p className="mt-1 text-[13px] text-muted">{e.detail}</p>
                  </div>
                </div>
                {attendanceService && <StatusBadge status={e.status} tone={attendanceTone(e.status === 'On leave' ? 'On leave' : e.status) === 'blue' ? 'blue' : attendanceTone(e.status)} />}
              </li>
            ))}
          </ul>
          <Link to="/attendance/records" className="mt-4 inline-flex text-[13px] font-medium text-brand-600 hover:underline">
            Review all attendance records →
          </Link>
        </Card>
      </div>

      <p className="text-xs text-muted">Snapshot roster: {total} employees. Employment status (active / probation / inactive) is separate from daily attendance.</p>
      <p className="text-xs text-muted">{SHIFT_LABEL}</p>
      {db.announcements.length >= 0 ? <Badge tone="gray" className="sr-only">demo</Badge> : null}
    </div>
  )
}
