import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { SelectInput, TextArea } from '@/components/ui/form'
import { StatusBadge, leaveTone } from '@/components/data-display/status'
import { leaveService } from '@/services/leave'
import { employeeService } from '@/services/employees'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { LeaveRequest } from '@/types/domain'
import { DEMO_TODAY } from '@/services/demo/store'
import { useMyEmployeeId } from '@/modules/employees/self-shared'

export function MyLeavePage() {
  useHeader('My leave', [{ label: 'Workspace' }, { label: 'My leave' }])
  const employeeId = useMyEmployeeId()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState('Annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')

  const balances = useQuery({ queryKey: ['leave', 'my-balances', employeeId], queryFn: () => leaveService.balances(employeeId, 2026), enabled: !!employeeId })
  const mine = useQuery({ queryKey: ['leave', 'mine', employeeId], queryFn: () => leaveService.listMine(employeeId), enabled: !!employeeId })
  const me = useQuery({ queryKey: ['employees', 'me', employeeId], queryFn: () => employeeService.get(employeeId), enabled: !!employeeId })

  const create = useMutation({
    mutationFn: () =>
      leaveService.create({
        employeeId,
        employeeName: me.data?.name ?? employeeId,
        leaveType: leaveType as LeaveRequest['leaveType'],
        startDate,
        endDate,
        reason,
      }),
    onSuccess: async () => {
      setDialogOpen(false)
      setReason('')
      setStartDate('')
      setEndDate('')
      await queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })

  const myRows = mine.data ?? []
  const pendingDays = myRows.filter((r) => r.status === 'PENDING').reduce((acc, r) => acc + r.days, 0)

  const submit = async () => {
    if (startDate && endDate && startDate <= endDate && reason.trim()) {
      await create.mutateAsync()
      setFormError('')
    } else {
      setFormError('Fill a valid date range (start ≤ end) and a reason.')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My leave" description="Balances, pending requests and history for 2026. Pending requests do not reduce balances.">
        <Button onClick={() => { setFormError(''); setDialogOpen(true) }}>Request leave</Button>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balances.isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>)
          : balances.data?.map((b) => (
              <Card key={b.leaveType} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-ink">{b.leaveType}</p>
                  <Badge tone={b.usedDays >= b.totalDays ? 'red' : 'green'}>{Math.max(0, b.totalDays - b.usedDays)} left</Badge>
                </div>
                <p className="mt-2 text-[26px] font-bold leading-none text-ink">{b.usedDays}<span className="text-sm font-medium text-muted"> / {b.totalDays} used</span></p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF1F7]" role="progressbar" aria-valuenow={Math.round(b.usedDays)} aria-valuemin={0} aria-valuemax={b.totalDays} aria-label={`${b.leaveType} balance`}>
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (b.usedDays / b.totalDays) * 100)}%` }} />
                </div>
              </Card>
            ))}
      </div>

      {create.isSuccess ? <InfoNote tone="green">Request submitted (demo adapter — it disappears when the page hard-reloads).</InfoNote> : null}

      <Card>
        <div className="p-6 pb-2"><SectionTitle title="My requests" description={pendingDays ? `${pendingDays} day(s) currently pending approval.` : 'Nothing pending.'} /></div>
        <ul className="divide-y divide-line">
          {mine.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="px-6 py-3"><Skeleton className="h-4 w-full" /></li>)
            : myRows.length === 0
              ? <li><EmptyState title="No requests yet" description="Submit your first request with the button above." /></li>
              : myRows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{r.leaveType} · {r.days} day{r.days === 1 ? '' : 's'}</p>
                      <p className="text-xs text-muted">{r.startDate} → {r.endDate} · {r.reason}</p>
                      {r.decidedBy ? <p className="text-xs text-muted">Decided by {r.decidedBy} on {r.decidedAt?.slice(0, 10)}</p> : null}
                    </div>
                    <StatusBadge status={r.status.toLowerCase()} tone={leaveTone(r.status)} />
                  </li>
                ))}
        </ul>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Request leave"
        description="Submits a PENDING request for an approver. Cancel anytime before approval."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={() => void submit()}>Submit request</Button>
          </>
        }
      >
        <div className="space-y-4 pt-1">
          {formError ? <InfoNote tone="red">{formError}</InfoNote> : null}
          <SelectInput
            label="Leave type"
            required
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: 'Annual', label: 'Annual' },
              { value: 'Sick', label: 'Sick' },
              { value: 'Casual', label: 'Casual' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Start date <span className="text-danger">*</span></span>
              <input type="date" value={startDate} min={DEMO_TODAY} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">End date <span className="text-danger">*</span></span>
              <input type="date" value={endDate} min={startDate || DEMO_TODAY} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
          </div>
          <TextArea label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shared with your approver" />
        </div>
      </Dialog>
    </div>
  )
}
