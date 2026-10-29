import { useQuery } from '@tanstack/react-query'
import { Card, InfoNote, Skeleton } from '@/components/ui/base'
import { StatusBadge, leaveTone } from '@/components/data-display/status'
import { leaveService } from '@/services/leave'
import { leaveStatusLabel } from '@/features/leave/leave-constants'
import type { LeaveRequest } from '@/types/domain'
import { formatNptDate } from '@/utils/npt'

export function EmployeeLeaveTab({ employeeId }: { employeeId: string }) {
  const balances = useQuery({ queryKey: ['leave', 'balances', employeeId], queryFn: () => leaveService.balances(employeeId, 2026) })
  const requests = useQuery({ queryKey: ['leave', 'recent', employeeId], queryFn: () => leaveService.list({ employeeId, page: 1, pageSize: 5 }) })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-ink">Leave & balances</h3>
        <p className="mt-0.5 text-[13px] text-muted">Leave entitlement and request history.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {balances.isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20 w-32" /></Card>)
          : (balances.data ?? []).map((b) => {
              const remaining = Math.max(0, b.totalDays - b.usedDays)
              return (
                <Card key={b.leaveType} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-ink">{b.leaveType} leave</p>
                    <span className="text-xs text-muted">{b.year}</span>
                  </div>
                  <p className="mt-2 text-[24px] font-bold text-ink">{remaining} days</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDF1F7]" role="progressbar" aria-valuenow={Math.round(b.usedDays)} aria-valuemin={0} aria-valuemax={b.totalDays} aria-label={`${b.leaveType} balance`}>
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${(b.usedDays / b.totalDays) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{b.usedDays} used of {b.totalDays} days</p>
                </Card>
              )
            })}
      </div>

      <Card>
        <div className="p-6 pb-4">
          <h3 className="text-[15px] font-semibold text-ink">Leave requests</h3>
          <p className="mt-0.5 text-[13px] text-muted">{requests.data?.total ?? 0} recent requests</p>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[560px] text-sm" role="table">
            <thead>
              <tr className="border-y border-line bg-[#F8FAFD]">
                <th className="table-caption px-6 py-2.5 text-left">Leave type</th>
                <th className="table-caption px-4 py-2.5 text-left">Dates</th>
                <th className="table-caption px-4 py-2.5 text-left">Duration</th>
                <th className="table-caption px-4 py-2.5 text-left">Reason</th>
                <th className="table-caption px-6 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(requests.data?.items ?? []).map((r: LeaveRequest) => (
                <tr key={r.id}>
                  <td className="px-6 py-3.5 text-[13px] font-medium">{r.leaveType} leave</td>
                  <td className="px-4 py-3.5 text-[13px] text-muted">{formatNptDate(`${r.startDate}T00:00:00Z`)} → {formatNptDate(`${r.endDate}T00:00:00Z`)}</td>
                  <td className="px-4 py-3.5 text-[13px] text-muted">{r.days} day{r.days === 1 ? '' : 's'}</td>
                  <td className="px-4 py-3.5 text-[13px] text-muted">{r.reason}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={leaveStatusLabel[r.status]} tone={leaveTone(r.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InfoNote tone="blue">Pending requests do not reduce available balances until approved. Review and approval actions are managed in Leave requests.</InfoNote>
      <p className="text-xs text-muted">Leave policy: Standard full-time employees · Resets 01 Jan 2027</p>
    </div>
  )
}
