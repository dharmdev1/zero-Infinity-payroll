import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { leaveService } from '@/services/leave'
import { employeeService } from '@/services/employees'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { LeaveRequest } from '@/types/domain'
import { LeaveSubNav } from '@/modules/leave/LeaveSubNav'

export function LeaveBalancesPage() {
  useHeader('Leave balances', [{ label: 'Workspace' }, { label: 'Leave', to: '/leave' }, { label: 'Balances' }])
  const { session, can } = useAuth()
  const canViewAll = can('leave.view')
  const [employeeId, setEmployeeId] = useState(session?.employeeId ?? 'EMP-001')

  const employeesQuery = useQuery({
    queryKey: ['employees', 'options', 'leave-balances'],
    enabled: canViewAll,
    queryFn: () => employeeService.list({ page: 1, pageSize: 200 }),
  })

  const balances = useQuery({
    queryKey: ['leave', 'balances', employeeId],
    queryFn: () => leaveService.balances(employeeId, 2026),
  })
  const history = useQuery({
    queryKey: ['leave', 'used', employeeId],
    queryFn: () => leaveService.list({ employeeId, page: 1, pageSize: 100 }),
  })

  const approvedRows: LeaveRequest[] = (history.data?.items ?? []).filter((r) => r.status === 'APPROVED')
  const employeeOptions = (employeesQuery.data?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.name} · ${e.id}`,
  }))

  return (
    <div className="space-y-4">
      <LeaveSubNav />
      <PageHeaderBar title="Leave balances" description="Entitlements per employee for 2026. Pending requests are shown but never reduce balances.">
        {canViewAll ? <Link to="/leave/requests"><Button variant="secondary">Requests</Button></Link> : <Link to="/my/leave"><Button variant="secondary">My leave</Button></Link>}
      </PageHeaderBar>

      {canViewAll ? (
        <Card className="p-4">
          <FilterSelect
            className="max-w-xs"
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            options={employeeOptions.length > 0 ? employeeOptions : [{ value: employeeId, label: employeeId }]}
          />
          <p className="mt-2 text-xs text-muted">Pick an employee to load their 2026 balances.</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balances.isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>)
          : balances.data?.map((b) => <BalanceTile key={b.leaveType} balance={b} />)}
      </div>

      <Card>
        <div className="p-6 pb-2">
          <SectionTitle title="Approved leave 2026" description="Counts toward balances above." />
        </div>
        <ul className="divide-y divide-line">
          {approvedRows.length === 0
            ? <li><EmptyState title="No approved leave for this employee" /></li>
            : approvedRows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                  <span className="text-[13px] text-ink">{r.leaveType} · {r.days} day(s) · {r.startDate} → {r.endDate}</span>
                  <span className="font-mono text-[10px] text-muted">{r.id}</span>
                </li>
              ))}
        </ul>
      </Card>

      <InfoNote tone="blue">
        Weekend days are never counted as leave in the Mon–Fri Nepal workweek — a Sat–Sun range does not consume balance.
      </InfoNote>
    </div>
  )
}

function BalanceTile({ balance }: { balance: { leaveType: string; usedDays: number; totalDays: number } }) {
  const remaining = Math.max(0, balance.totalDays - balance.usedDays)
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">{balance.leaveType} leave</p>
        <Badge tone={remaining === 0 ? 'red' : remaining <= 3 ? 'orange' : 'green'}>{remaining} left</Badge>
      </div>
      <p className="mt-2 text-[26px] font-bold leading-none text-ink">
        {balance.usedDays}
        <span className="text-sm font-medium text-muted"> / {balance.totalDays} days used</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF1F7]" role="progressbar" aria-valuenow={Math.round(balance.usedDays)} aria-valuemin={0} aria-valuemax={balance.totalDays} aria-label={`${balance.leaveType} used`}>
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (balance.usedDays / balance.totalDays) * 100)}%` }} />
      </div>
    </Card>
  )
}
