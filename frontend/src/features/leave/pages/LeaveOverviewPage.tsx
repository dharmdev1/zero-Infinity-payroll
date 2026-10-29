import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge } from '@/components/data-display/status'
import { leaveService } from '@/services/leave'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { leaveStatusLabel, LEAVE_TYPES } from '../leave-constants'

export function LeaveOverviewPage() {
  const { session, can } = useAuth()
  useHeader('Leave', [{ label: 'Workspace' }, { label: 'Leave', to: '/leave' }])

  const isAdmin = can('leave.view') && session?.role !== 'EMPLOYEE'
  const employeeId = session?.employeeId ?? ''

  const mine = useQuery({
    queryKey: ['leave', 'mine', employeeId],
    enabled: !!employeeId,
    queryFn: () => leaveService.listMine(employeeId),
  })
  const balances = useQuery({
    queryKey: ['leave', 'balances', employeeId],
    enabled: !!employeeId,
    queryFn: () => leaveService.balances(employeeId, 2026),
  })
  const pending = useQuery({
    queryKey: ['leave', 'pending-count'],
    queryFn: () => leaveService.list({ status: 'PENDING', page: 1, pageSize: 1 }),
    enabled: isAdmin,
    staleTime: 60_000,
  })

  const myRows = mine.data ?? []
  const myPending = myRows.filter((r) => r.status === 'PENDING').length
  const pendingValue = isAdmin ? (pending.data?.total ?? 0) : myPending

  return (
    <div className="space-y-5">
      <PageHeaderBar
        title="Leave"
        description={isAdmin
          ? 'Track leave requests, approvals and team balances for the Mon–Fri Nepal workweek.'
          : 'Your leave balances and requests. Submitted requests stay PENDING until an approver decides.'}
      >
        <Link to="/leave/requests"><Button variant="secondary">All requests</Button></Link>
        {can('leave.approve') ? <Link to="/leave/approvals"><Button>Approvals</Button></Link> : null}
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isAdmin ? 'Pending approvals' : 'My pending requests'} value={String(pendingValue)} loading={isAdmin ? pending.isLoading : mine.isLoading} icon={null as never} note="Waiting on an approver" noteTone="orange" />
        <StatCard label="Approved this year" value={String(myRows.filter((r) => r.status === 'APPROVED').length)} loading={mine.isLoading} icon={null as never} note="Count of approved requests" noteTone="green" />
        <StatCard label="Rejected" value={String(myRows.filter((r) => r.status === 'REJECTED').length)} loading={mine.isLoading} icon={null as never} note="A rejection is final on the server" noteTone="red" />
        <StatCard label="Workweek" value="Mon–Fri" loading={false} icon={null as never} note="Weekends never consume leave days" noteTone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <MyLeaveCard rows={myRows} loading={mine.isLoading} />
        <BalanceCard balances={balances.data} loading={balances.isLoading} />
      </div>
    </div>
  )
}

function MyLeaveCard({ rows, loading }: { rows: Array<{ id: string; leaveType: string; days: number; startDate: string; endDate: string; reason: string; status: keyof typeof leaveStatusLabel }>; loading: boolean }) {
  return (
    <Card className="lg:col-span-3">
      <div className="p-6 pb-2">
        <SectionTitle title="My leave" description="Recent requests you submitted." />
      </div>
      <ul className="scroll-x divide-y divide-line">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="px-6 py-4"><Skeleton className="h-4 w-full" /></li>)
          : rows.length === 0
            ? <li><EmptyState title="No leave requests yet" description="Submit a request to see it tracked here." /></li>
            : rows.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{r.leaveType} leave · {r.days} day{r.days === 1 ? '' : 's'}</p>
                    <p className="text-xs text-muted">{r.startDate} → {r.endDate} · {r.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{r.id}</span>
                    <StatusBadge status={leaveStatusLabel[r.status]} tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : r.status === 'PENDING' ? 'orange' : 'gray'} />
                  </div>
                </li>
              ))}
      </ul>
      <div className="border-t border-line px-6 py-3">
        <Link to="/my/leave" className="text-[13px] font-medium text-brand-600 hover:underline">Open self-service leave →</Link>
      </div>
    </Card>
  )
}

function BalanceCard({ balances, loading }: { balances: Array<{ leaveType: string; usedDays: number; totalDays: number }> | undefined; loading: boolean }) {
  return (
    <Card className="p-6 lg:col-span-2">
      <SectionTitle title="Balances 2026" description="Pending requests never reduce displayed balances." />
      <div className="mt-4 space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          : balances?.map((b) => (
              <div key={b.leaveType}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{b.leaveType}</span>
                  <span className="text-muted">{b.usedDays} / {b.totalDays} days used</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EDF1F7]" role="progressbar" aria-label={`${b.leaveType} balance`} aria-valuenow={Math.round(b.usedDays)} aria-valuemin={0} aria-valuemax={b.totalDays}>
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (b.usedDays / b.totalDays) * 100)}%` }} />
                </div>
              </div>
            ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Types: {LEAVE_TYPES.join(' · ')}</p>
    </Card>
  )
}
