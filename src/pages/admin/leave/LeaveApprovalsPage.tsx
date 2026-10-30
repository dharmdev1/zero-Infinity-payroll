import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Badge, Button, Card, EmptyState, InfoNote, Skeleton } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { TextArea } from '@/components/ui/form'
import { leaveService } from '@/services/leave'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { LeaveRequest } from '@/types/domain'
import { formatNptDate } from '@/utils/npt'
import { LeaveSubNav } from '@/modules/leave/LeaveSubNav'

export function LeaveApprovalsPage() {
  useHeader('Leave approvals', [{ label: 'Workspace' }, { label: 'Leave', to: '/leave' }, { label: 'Approvals' }])
  const queryClient = useQueryClient()

  const rows = useQuery({
    queryKey: ['leave', 'approvals-queue'],
    queryFn: () => leaveService.list({ status: 'PENDING', page: 1, pageSize: 50 }),
  })

  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'APPROVED' | 'REJECTED'; note: string }) =>
      leaveService.decide(id, decision, note),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['leave'] }),
  })

  const [dialog, setDialog] = useState<{ request: LeaveRequest; decision: 'APPROVED' | 'REJECTED' } | null>(null)
  const [note, setNote] = useState('')

  const pendingRows = rows.data?.items ?? []
  const approve = dialog?.decision === 'APPROVED'

  return (
    <div className="space-y-4">
      <LeaveSubNav />
      <PageHeaderBar title="Leave approvals" description="Approve or reject pending requests. Every decision is written to the audit log with your note.">
        <Badge tone="orange" dot>{pendingRows.length} pending</Badge>
      </PageHeaderBar>

      {decide.isError ? <InfoNote tone="red">{(decide.error as Error).message}</InfoNote> : null}
      {decide.isSuccess ? <InfoNote tone="green">Decision recorded (demo adapter, not persisted). Balances update only for approved leave.</InfoNote> : null}

      <div className="space-y-3">
        {rows.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-16 w-full" /></Card>)
          : pendingRows.length === 0
            ? <Card><EmptyState title="Queue clear" description="No pending leave requests to review." /></Card>
            : pendingRows.map((r) => (
                <RequestCard key={r.id} request={r} onDecide={(decision) => { setNote(''); setDialog({ request: r, decision }) }} />
              ))}
      </div>

      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={approve ? 'Approve leave request' : 'Reject leave request'}
        description={dialog ? `${dialog.request.leaveType} leave · ${dialog.request.employeeName} · ${dialog.request.days} day(s)` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              loading={decide.isPending}
              variant={approve ? 'success' : 'danger'}
              onClick={async () => {
                if (!dialog) return
                await decide.mutateAsync({ id: dialog.request.id, decision: dialog.decision, note }).catch(() => undefined)
                setDialog(null)
              }}
            >
              {approve ? 'Approve request' : 'Reject request'}
            </Button>
          </>
        }
      >
        <TextArea label="Note for the audit trail" required placeholder="e.g. Team coverage confirmed" value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" />
      </Dialog>
    </div>
  )
}

function RequestCard({ request, onDecide }: { request: LeaveRequest; onDecide: (decision: 'APPROVED' | 'REJECTED') => void }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <Avatar name={request.employeeName} tone="blue" />
        <div>
          <p className="text-sm font-semibold text-ink">
            {request.employeeName}
            <span className="ml-2 font-mono text-[10px] font-normal text-muted">{request.employeeId}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {request.leaveType} leave · {request.days} day{request.days === 1 ? '' : 's'} · {request.startDate} → {request.endDate}
          </p>
          <p className="mt-1 text-[13px] text-muted">{request.reason}</p>
          <p className="mt-1 font-mono text-[10px] text-muted">{request.id} · submitted {formatNptDate(request.submittedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {request.startDate < '2026-10-28' ? <Badge tone="yellow">Retroactive</Badge> : null}
        <Button variant="secondary" onClick={() => onDecide('REJECTED')}>Reject</Button>
        <Button variant="success" onClick={() => onDecide('APPROVED')}>Approve</Button>
      </div>
    </Card>
  )
}
