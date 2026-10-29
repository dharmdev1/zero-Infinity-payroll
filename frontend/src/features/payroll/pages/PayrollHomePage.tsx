import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNpr } from '@/utils/npr'

export function PayrollHomePage() {
  useHeader('Payroll', [{ label: 'Workspace' }, { label: 'Payroll' }])
  const runs = useQuery({ queryKey: ['payroll', 'runs', 'home'], queryFn: () => payrollService.runs('', 1, 5) })
  const latest = runs.data?.items[0]

  return (
    <div className="space-y-5">
      <PageHeaderBar
        title="Payroll"
        description="Runs, approvals and payslips for Nepalese Rupee payroll. Payroll math and sensitive totals come only from the backend; this page renders exactly what the server returns."
      >
        <Link to="/payroll/runs"><Button variant="secondary">All runs</Button></Link>
        <Link to="/payroll/payslips"><Button>Payslips</Button></Link>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Runs" value={String(runs.data?.total ?? 0)} loading={runs.isLoading} icon={null as never} note="Most recent 5 shown below" noteTone="blue" />
        <StatCard label="Latest gross total" value={latest ? formatNpr(latest.totalGrossPaisa) : '—'} loading={runs.isLoading} icon={null as never} note={latest ? `${latest.period} · ${latest.employeesCount} employees` : undefined} noteTone="purple" />
        <StatCard label="Latest net total" value={latest ? formatNpr(latest.totalNetPaisa) : '—'} loading={runs.isLoading} icon={null as never} note="After deductions and taxes" noteTone="green" />
        <StatCard label="Currency" value="NPR" loading={false} icon={null as never} note="Stored as paisa integers — no floating point" noteTone="orange" />
      </div>

      <Card>
        <div className="p-6 pb-2"><SectionTitle title="Recent runs" /></div>
        <ul className="divide-y divide-line">
          {runs.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="px-6 py-4"><Skeleton className="h-5 w-full" /></li>)
            : runs.data?.items.length === 0
              ? <li><EmptyState title="No payroll runs yet" description="Create one from the Runs page." /></li>
              : runs.data?.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <Link to={`/payroll/runs/${r.id}`} className="text-[13px] font-semibold text-brand-600 hover:underline">{r.period}</Link>
                      <p className="font-mono text-[10px] text-muted">{r.id} · {r.employeesCount} employees</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-ink">{formatNpr(r.totalNetPaisa)}</span>
                      <StatusBadge status={r.status} tone={payrollRunTone(r.status)} />
                    </div>
                  </li>
                ))}
        </ul>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Run lifecycle" description="Every transition is audited server-side." />
        <ol className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {['Draft', 'Review', 'Approved', 'Paid'].map((stage, i) => (
            <li key={stage} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden="true">→</span> : null}
              <span className="rounded-full border border-line px-3 py-1.5 text-ink">{stage}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
