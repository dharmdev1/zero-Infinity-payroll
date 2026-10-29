import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarClock, CheckSquare, Landmark, Wallet } from 'lucide-react'
import { Badge, Button, Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { attendanceService } from '@/services/attendance'
import { leaveService } from '@/services/leave'
import { payrollService } from '@/services/payroll'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { formatNpr } from '@/utils/npr'
import { formatNptDate } from '@/utils/npt'

function dayTile(date: string, today: string) {
  const isAfter = date > today
  if (isAfter) return { label: '—', dot: 'bg-brand-500/40', tile: '' }
  return { label: '8.0h', dot: 'bg-success', tile: '' }
}

export function EmployeeDashboard() {
  const { session } = useAuth()
  const selfId = session?.employeeId ?? 'EMP-004'
  useHeader('My dashboard', [{ label: 'My workspace' }, { label: 'Dashboard' }])

  const attendanceMonth = useQuery({ queryKey: ['attendance', 'summary', selfId], queryFn: () => attendanceService.summaryForMonth(selfId, db.today.slice(0, 7)) })
  const myTasks = useQuery({ queryKey: ['tasks', 'mine', selfId], queryFn: () => taskService.listMine(selfId) })
  const balances = useQuery({ queryKey: ['leave', 'balances', selfId], queryFn: () => leaveService.balances(selfId, 2026) })
  const payslip = useQuery({ queryKey: ['payroll', 'latest', selfId], queryFn: () => payrollService.latestForEmployee(selfId) })

  const activeTasks = useMemo(() => (myTasks.data ?? []).filter((t) => t.status !== 'COMPLETED').length, [myTasks.data])
  const annual = balances.data?.find((b) => b.leaveType === 'Annual')
  const availableAnnual = annual ? Math.max(0, annual.totalDays - annual.usedDays) : 0

  const weekDays = useMemo(() => {
    const start = new Date(`${db.today}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - 2) // Wednesday context; design starts Mon
    const mondayOffset = (start.getUTCDay() + 6) % 7
    start.setUTCDate(start.getUTCDate() - mondayOffset)
    return Array.from({ length: 5 }).map((_, i) => {
      const date = new Date(start)
      date.setUTCDate(date.getUTCDate() + i)
      const iso = date.toISOString().slice(0, 10)
      return iso
    })
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-ink md:text-[26px]">
            Good morning, {session?.name.split(' ')[0]} <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">Here's your workday at a glance. Have a productive day!</p>
        </div>
        <Card className="px-4 py-2.5">
          <p className="text-[13px] font-medium text-ink">{formatNptDate(`${db.today}T09:00:00+05:45`, true)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance this month" value={`${attendanceMonth.data?.presentDays ?? 0} days`} loading={attendanceMonth.isLoading} icon={<CalendarClock size={17} />} iconTone="blue" note="Present so far" noteTone="blue" />
        <StatCard label="Tasks in progress" value={`${activeTasks} tasks`} loading={myTasks.isLoading} icon={<CheckSquare size={17} />} iconTone="purple" note="2 due this week" noteTone="blue" />
        <StatCard label="Leave balance" value={`${availableAnnual} days`} loading={balances.isLoading} icon={<Landmark size={17} />} iconTone="green" note="Available to use" noteTone="green" />
        <StatCard label="Latest payslip" value={payslip.data ? formatNpr(payslip.data.netPaisa) : '—'} loading={payslip.isLoading} icon={<Wallet size={17} />} iconTone="orange" note={payslip.data?.period ?? '—'} noteTone="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="p-6 lg:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Today's attendance</h3>
              <p className="mt-0.5 text-[13px] text-muted">Keep your attendance up to date</p>
            </div>
            <Badge tone="orange" dot>
              NOT CHECKED IN
            </Badge>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[13px] text-muted">Current status</p>
              <p className="mt-1 text-lg font-bold text-ink">Not checked in</p>
              <p className="text-xs text-muted">Remember to check in when you start work.</p>
            </div>
            <div>
              <p className="text-[13px] text-muted">Expected work hours</p>
              <p className="mt-1 text-lg font-bold text-ink">9:30 AM – 5:30 PM</p>
              <p className="text-xs text-muted">Monday–Friday · NPT (UTC+05:45)</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                // Check-in is a device action on the real system (kiosk/endpoint).
                // In this frontend-only build the action is intentionally not
                // simulated as persisted attendance.
                window.alert('Demo mode: check-in requires a kiosk device or the attendance API. Nothing was recorded.')
              }}
            >
              <span className="inline-flex items-center gap-1.5">Check in</span>
            </Button>
            <Link to="/my/attendance">
              <Button variant="secondary">Request correction</Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">My week</h3>
              <p className="mt-0.5 text-[13px] text-muted">Attendance summary · This week</p>
            </div>
            <Badge tone="green" dot>
              ON TRACK
            </Badge>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {weekDays.map((iso, i) => {
              const shape = dayTile(iso, db.today)
              return (
                <div key={iso} className={`rounded-lg border border-line bg-canvas px-1 py-3 text-center ${iso === db.today ? 'bg-brand-50/60' : ''}`}>
                  <p className="table-caption tracking-wider">{['MON', 'TUE', 'WED', 'THU', 'FRI'][i]}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{shape.label}</p>
                  <span className={`mx-auto mt-2 block h-1.5 w-1.5 rounded-full ${shape.dot}`} aria-hidden="true" />
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            {attendanceMonth.data?.presentDays ?? 0} days completed this month
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-6 pb-4">
            <SectionTitle title="My tasks" description="Your assigned work and upcoming deadlines" />
            <Link to="/my/tasks" className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-600 hover:bg-brand-100/70">
              View all →
            </Link>
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[520px] text-sm" role="table">
              <thead>
                <tr className="border-b border-line bg-[#F8FAFD]">
                  <th className="table-caption px-6 py-2.5 text-left">Task</th>
                  <th className="table-caption px-4 py-2.5 text-left">Due date</th>
                  <th className="table-caption px-4 py-2.5 text-left">Priority</th>
                  <th className="table-caption px-6 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-6 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  : (myTasks.data ?? [])
                      .filter((t) => t.status !== 'COMPLETED')
                      .slice(0, 4)
                      .map((t) => (
                        <tr key={t.id} className="border-b border-line last:border-b-0">
                          <td className="px-6 py-3.5 text-[13px] font-medium">
                            <Link to={`/tasks/${t.id}`} className="text-ink-deep hover:text-brand-600 hover:underline">
                              {t.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-muted">{t.dueDate === db.today ? 'Today' : new Date(`${t.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</td>
                          <td className={`px-4 py-3.5 text-[13px] ${t.priority === 'High' ? 'text-danger' : t.priority === 'Medium' ? 'text-warning' : 'text-muted'}`}>{t.priority}</td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card className="p-6">
            <SectionTitle title="Leave & holidays" description="Plan time away from work" />
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[13px] font-medium text-muted">Annual leave remaining</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[26px] font-bold text-ink">{availableAnnual} days</p>
                <Badge tone="orange" dot>
                  1 REQUEST PENDING
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Link to="/my/leave">
                  <Button size="md">Request leave</Button>
                </Link>
                <Link to="/leave/balances" className="text-[13px] font-medium text-brand-600 hover:underline">
                  View holidays
                </Link>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <SectionTitle title="Company announcements" description="Updates from your team" />
            <ul className="mt-3 space-y-3">
              {db.announcements.slice(0, 1).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600" aria-hidden="true">i</span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{a.title}</p>
                    <p className="text-[13px] text-muted">{a.body}</p>
                    <p className="mt-1 text-xs text-muted/80">Posted {formatWeekday(a.postedAt)} · {a.author}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/my/documents" className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:underline">
              All announcements →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatWeekday(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(iso))
}
