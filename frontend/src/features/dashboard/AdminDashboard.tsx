import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleUser, CalendarClock, CheckSquare, Wallet, ArrowUpRight } from 'lucide-react'
import { Card, Progress, Avatar, Button, Skeleton, Badge, EmptyState } from '@/components/ui/base'
import { StatCard, BarChart, type BarDatum } from '@/components/data-display/stat-card'
import { SectionTitle } from '@/components/ui/base'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { employeeService } from '@/services/employees'
import { attendanceService } from '@/services/attendance'
import { payrollService } from '@/services/payroll'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { formatNpr } from '@/utils/npr'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'

export function AdminDashboard() {
  useHeader('Admin dashboard', [{ label: 'Workspace' }, { label: 'Overview' }])
  const navigate = useNavigate()
  const employees = useQuery({ queryKey: ['employees', 'all'], queryFn: () => employeeService.list({ page: 1, pageSize: 200 }) })
  const attendanceToday = useQuery({ queryKey: ['attendance', 'today'], queryFn: () => attendanceService.list({ date: db.today, page: 1, pageSize: 200 }) })
  const payroll = useQuery({ queryKey: ['payroll', 'runs'], queryFn: () => payrollService.runs('', 1, 10) })
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.list({}) })

  const counts = useMemo(() => {
    const list = employees.data?.items ?? []
    return {
      total: employees.data?.total ?? 0,
      present: (attendanceToday.data?.items ?? []).filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      late: (attendanceToday.data?.items ?? []).filter((r) => r.status === 'LATE').length,
      absent: (attendanceToday.data?.items ?? []).filter((r) => r.status === 'ABSENT').length,
      pendingTasks: (tasks.data ?? []).filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TO_DO' || t.status === 'REVIEW').length,
      payrollGross: payroll.data?.items[0]?.totalNetPaisa ?? 0,
      newThisMonth: list.filter((e) => e.joiningDate >= '2026-10-01').length,
    }
  }, [employees.data, attendanceToday.data, tasks.data, payroll.data])

  const attendanceRate = counts.total ? Math.round((counts.present / counts.total) * 1000) / 10 : 0

  const cashBars: BarDatum[] = useMemo(
    () => [
      { label: 'SEP 1', value: 42 }, { label: '', value: 65 }, { label: '', value: 50 },
      { label: '', value: 78 }, { label: '', value: 58 }, { label: '', value: 71 },
      { label: '', value: 49 }, { label: 'OCT', value: 84, active: true },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-ink md:text-[26px]">Good morning, {useAuth().session?.name}</h2>
          <p className="mt-1 text-[13px] text-muted">Here's what's happening across your company today.</p>
        </div>
        <Card className="px-4 py-2.5">
          <p className="text-[13px] font-medium text-ink">October 2026</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total employees" value={String(counts.total)} loading={employees.isLoading} icon={<CircleUser size={17} />} iconTone="blue" note={counts.newThisMonth ? `+${counts.newThisMonth} this month` : undefined} noteTone="blue" />
        <StatCard label="Present today" value={String(counts.present)} loading={attendanceToday.isLoading} icon={<CalendarClock size={17} />} iconTone="green" note={`${attendanceRate}% attendance${counts.late ? ` · ${counts.late} late` : ''}`} noteTone={counts.late ? 'orange' : 'green'} />
        <StatCard label="Pending tasks" value={String(counts.pendingTasks)} loading={tasks.isLoading} icon={<CheckSquare size={17} />} iconTone="purple" note="Across active work" noteTone="muted" />
        <StatCard label="Monthly payroll" value={formatNpr(counts.payrollGross)} loading={payroll.isLoading} icon={<Wallet size={17} />} iconTone="orange" note="October payroll" noteTone="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="p-6 lg:col-span-4">
          <SectionTitle title="Attendance overview" description="Today's team attendance" right={<Badge tone="green" dot>Live</Badge>} />
          <div className="mt-5">
            {attendanceToday.isLoading ? (
              <Skeleton className="h-16 w-40" />
            ) : (
              <>
                <p className="text-[40px] font-bold leading-none text-ink">{attendanceRate}%</p>
                <p className="mt-1 text-[13px] text-muted">of employees checked in</p>
                <Progress className="mt-4" value={attendanceRate} />
              </>
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
            {[
              { label: 'Present', value: counts.present - counts.late, tone: 'green' as const },
              { label: 'Late', value: counts.late, tone: 'orange' as const },
              { label: 'Absent', value: counts.absent, tone: 'red' as const },
            ].map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted sm:justify-start">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.tone === 'green' ? 'bg-success' : s.tone === 'orange' ? 'bg-warning-accent' : 'bg-danger'}`} aria-hidden="true" />
                  {s.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <SectionTitle title="Finance snapshot" description="Company account activity" right={<span className="text-xs font-semibold text-muted">OCT 2026</span>} />
          <p className="mt-5 text-[13px] text-muted">Net cash movement</p>
          <p className="text-[22px] font-bold text-ink">+ NPR 2,48,500</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-success">
            <ArrowUpRight size={12} /> 12.8%
          </div>
          <div className="mt-4">
            <BarChart data={cashBars} ariaLabel="Monthly net cash movement, September to October" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <div className="p-6 pb-3">
            <SectionTitle
              title="Tasks & deadlines"
              description="Keep track of work across the team"
              right={
                <Link to="/tasks" className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-600 hover:bg-brand-100/70">
                  View all <ArrowRight size={13} />
                </Link>
              }
            />
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[560px] text-sm" role="table">
              <thead>
                <tr className="border-y border-line bg-[#F8FAFD]">
                  <th className="table-caption px-6 py-2.5 text-left">Task</th>
                  <th className="table-caption px-4 py-2.5 text-left">Assignee</th>
                  <th className="table-caption px-4 py-2.5 text-left">Deadline</th>
                  <th className="table-caption px-6 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {(tasks.data ?? []).filter((t) => t.status !== 'COMPLETED').slice(0, 4).map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-b-0">
                    <td className="px-6 py-3.5 text-[13px] font-medium">
                      <Link to={`/tasks/${t.id}`} className="text-ink-deep hover:text-brand-600 hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-muted">{t.assigneeName}</td>
                    <td className="px-4 py-3.5 text-[13px] text-muted">{t.dueDate === db.today ? 'Today' : new Date(`${t.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                    </td>
                  </tr>
                ))}
                {tasks.isLoading ? <tr><td colSpan={4} className="px-6 py-6"><Skeleton className="h-4 w-full" /></td></tr> : null}
                {!tasks.isLoading && (tasks.data ?? []).length === 0 ? <tr><td colSpan={4}><EmptyState title="No pending tasks" /></td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <SectionTitle title="Recent activity" description="Latest updates from your team" />
          <ul className="mt-4 space-y-4">
            {[
              { name: 'Sita K.', action: 'submitted a leave request', time: '10 min ago' },
              { name: 'Aarav R.', action: 'completed Website QA task', time: '32 min ago' },
              { name: 'Mina T.', action: 'uploaded a candidate CV', time: '1 hr ago' },
              { name: 'Finance', action: 'new bank statement imported', time: '2 hrs ago' },
            ].map((a) => (
              <li key={a.name} className="flex items-start gap-3">
                <Avatar name={a.name} tone={a.name === 'Finance' ? 'orange' : 'blue'} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{a.name}</p>
                  <p className="text-[13px] text-muted">{a.action}</p>
                  <p className="text-xs text-muted/80">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-5 w-full" onClick={() => navigate('/settings/audit-logs')}>
            Open audit history
          </Button>
        </Card>
      </div>
    </div>
  )
}
