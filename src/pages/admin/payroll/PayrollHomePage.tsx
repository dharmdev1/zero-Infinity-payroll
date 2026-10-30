import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNpr } from '@/utils/npr'

export function PayrollHomePage() {
  useHeader('Payroll', [{ label: 'Workspace' }, { label: 'Payroll' }])
  const { session } = useAuth()
  const runs = useQuery({
    queryKey: ['payroll', 'home-runs', session?.userId, session?.role],
    queryFn: () => payrollService.runs('', 1, 10, session),
  })
  const latest = runs.data?.items[0]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Payroll" description="Paisa-exact NPR payroll runs and employee payslips. Restricted to authorized Payroll roles.">
        <Link to="/payroll/runs"><Button variant="secondary">All runs</Button></Link>
        <Link to="/payroll/payslips"><Button>Payslips</Button></Link>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Latest run" value={latest?.period ?? '—'} loading={runs.isLoading} note={latest ? `${latest.id} · ${latest.status}` : undefined} noteTone="blue" />
        <StatCard label="Latest gross" value={latest ? formatNpr(latest.totalGrossPaisa) : '—'} loading={runs.isLoading} note="Before SSPF & tax deductions" noteTone="purple" />
        <StatCard label="Latest net payable" value={latest ? formatNpr(latest.totalNetPaisa) : '—'} loading={runs.isLoading} note="Net disbursement" noteTone="green" />
      </div>

      <Card>
        <div className="p-6 pb-2">
          <SectionTitle title="Recent payroll runs" description="Click a run to review payslips or advance its lifecycle." />
        </div>
        <ul className="divide-y divide-line">
          {runs.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="px-6 py-4"><Skeleton className="h-4 w-full" /></li>)
            : (runs.data?.items ?? []).length === 0
              ? <li><EmptyState title="No payroll runs recorded" /></li>
              : runs.data?.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <Link to={`/payroll/runs/${r.id}`} className="text-[13px] font-semibold text-brand-600 hover:underline">
                        {r.period}
                      </Link>
                      <p className="font-mono text-[10px] text-muted">{r.id} · {r.employeesCount} employees</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-semibold text-ink">{formatNpr(r.totalNetPaisa)}</span>
                      <StatusBadge status={r.status} tone={payrollRunTone(r.status)} />
                    </div>
                  </li>
                ))}
        </ul>
      </Card>

      <InfoNote tone="blue">
        Compensation figures are stored as integer paisa and never exposed in general employee directory endpoints.
      </InfoNote>
    </div>
  )
}
