import { useQuery } from '@tanstack/react-query'
import { Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, leaveTone } from '@/components/data-display/status'
import { leaveService } from '@/services/leave'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { notifyReportExport } from '../reports-shared'
import { leaveStatusLabel, LEAVE_STATUSES, LEAVE_TYPES } from '@/features/leave/leave-constants'

export function LeaveReportsPage() {
  useHeader('Leave report', [{ label: 'Workspace' }, { label: 'Reports', to: '/reports' }, { label: 'Leave' }])

  const list = useQuery({
    queryKey: ['reports', 'leave', 'all'],
    queryFn: () => leaveService.list({ page: 1, pageSize: 100 }),
  })

  const rows = list.data?.items ?? []
  const byStatus = LEAVE_STATUSES.map((s) => ({ status: s, count: rows.filter((r) => r.status === s).length }))
  const byType = LEAVE_TYPES.map((t) => {
    const scope = rows.filter((r) => r.leaveType === t)
    return { type: t, count: scope.length, days: scope.reduce((acc, r) => acc + r.days, 0) }
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Leave report" description="Requests by status and leave type. Weekends in the Mon–Fri workweek never consume leave days.">
        <Button variant="secondary" size="sm" onClick={() => notifyReportExport('Leave report (CSV)')}>Export CSV</Button>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {byStatus.map((s) => (
          <StatCard
            key={s.status}
            label={`${leaveStatusLabel[s.status]} requests`}
            value={String(s.count)}
            loading={list.isLoading}
            icon={null as never}
            note="All recorded requests"
            noteTone={s.status === 'APPROVED' ? 'green' : s.status === 'REJECTED' ? 'red' : s.status === 'PENDING' ? 'orange' : 'muted'}
          />
        ))}
      </div>

      <Card>
        <div className="p-6 pb-2">
          <SectionTitle title="By leave type" description="Total days requested per type (all statuses)." />
        </div>
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
          {list.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            : byType.map((t) => (
                <div key={t.type} className="rounded-xl border border-line p-4">
                  <p className="text-[13px] font-semibold text-ink">{t.type} leave</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{t.count}</p>
                  <p className="text-xs text-muted">{t.days} total day(s)</p>
                </div>
              ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Latest activity" description="Most recent 6 requests, newest first." />
        <ul className="mt-4 divide-y divide-line">
          {rows.length === 0
            ? <li className="py-3"><EmptyState title="No requests recorded" /></li>
            : rows.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-[13px] text-ink">{r.employeeName} · {r.leaveType} · {r.startDate} → {r.endDate}</span>
                  <StatusBadge status={leaveStatusLabel[r.status]} tone={leaveTone(r.status)} />
                </li>
              ))}
        </ul>
      </Card>
    </div>
  )
}
