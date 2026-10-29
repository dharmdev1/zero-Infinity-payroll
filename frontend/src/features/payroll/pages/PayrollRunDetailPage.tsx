import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { PayslipTable } from '../PayslipTable'
import { formatNpr } from '@/utils/npr'

export function PayrollRunDetailPage() {
  const { runId } = useParams()
  useHeader('Payroll run', [{ label: 'Workspace' }, { label: 'Payroll', to: '/payroll' }, { label: 'Runs', to: '/payroll/runs' }, { label: runId ?? '' }])

  const { can } = useAuth()
  const queryClient = useQueryClient()
  const run = useQuery({ queryKey: ['payroll', 'run', runId], queryFn: () => payrollService.run(runId ?? ''), enabled: !!runId })
  const payslips = useQuery({
    queryKey: ['payroll', 'run-payslips', runId],
    queryFn: () => payrollService.runPayslips(runId ?? '', { page: 1, pageSize: 50 }),
    enabled: !!runId,
  })

  const transition = useMutation({
    mutationFn: ({ action, note }: { action: 'submit-review' | 'approve' | 'pay'; note: string }) =>
      payrollService.transition(runId ?? '', action, note),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const r = run.data
  if (run.isLoading || !r) {
    return <div className="space-y-3"><Skeleton className="h-8 w-72" /><Skeleton className="h-56 w-full" /></div>
  }
  if (run.isError) {
    return <EmptyState title="Payroll run not found" action={<Link to="/payroll/runs"><Button variant="secondary" size="sm">Back to runs</Button></Link>} />
  }

  const nextActions = [
    ...(r.status === 'DRAFT' ? [{ action: 'submit-review' as const, label: 'Submit for review' }] : []),
    ...(r.status === 'REVIEW' ? [{ action: 'approve' as const, label: 'Approve run' }] : []),
    ...(r.status === 'APPROVED' ? [{ action: 'pay' as const, label: 'Pay run' }] : []),
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title={r.period} description={`${r.id} · created by ${r.createdBy}${r.approvedBy ? ` · approved by ${r.approvedBy}` : ''}`}>
        <StatusBadge status={r.status} tone={payrollRunTone(r.status)} />
      </PageHeaderBar>

      {transition.isSuccess ? <InfoNote tone="green">Run moved (demo adapter, not persisted). Server-side this transition is audited and irreversible.</InfoNote> : null}
      {transition.isError ? <InfoNote tone="red">{(transition.error as Error).message}</InfoNote> : null}
      {r.notes ? <InfoNote tone="blue">Run notes: {r.notes}</InfoNote> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={String(r.employeesCount)} loading={run.isLoading} icon={null as never} note="Included in this run" noteTone="blue" />
        <StatCard label="Gross" value={formatNpr(r.totalGrossPaisa)} loading={run.isLoading} icon={null as never} note="Total before deductions" noteTone="purple" />
        <StatCard label="Deductions" value={formatNpr(r.totalDeductionsPaisa)} loading={run.isLoading} icon={null as never} note="SSPF and other withholdings" noteTone="orange" />
        <StatCard label="Net payable" value={formatNpr(r.totalNetPaisa)} loading={run.isLoading} icon={null as never} note="Disbursed once paid" noteTone="green" />
      </div>

      {can('payroll.manage') && r.status !== 'PAID' ? (
        <Card className="p-5">
          <SectionTitle title="Lifecycle actions" description="Each action requires an approving note in the audit log on the server." />
          <div className="mt-4 flex flex-wrap gap-2">
            {nextActions.map((a) => (
              <Button
                key={a.action}
                variant={a.action === 'pay' ? 'success' : 'primary'}
                loading={transition.isPending}
                onClick={() => transition.mutate({ action: a.action, note: `${a.label} via demo UI` })}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      <PayslipTable
        rows={payslips.data?.items ?? []}
        loading={payslips.isLoading}
        emptyState={<EmptyState title="No payslips in this run" />}
      />
    </div>
  )
}
