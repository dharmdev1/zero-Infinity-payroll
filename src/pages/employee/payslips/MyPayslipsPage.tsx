import { useQuery } from '@tanstack/react-query'
import { Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard, BarChart } from '@/components/data-display/stat-card'
import { StatusBadge, payslipLabel, payslipTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNpr } from '@/utils/npr'
import { useMyEmployeeId } from '@/modules/employees/self-shared'

export function MyPayslipsPage() {
  useHeader('My payslips', [{ label: 'Workspace' }, { label: 'My payslips' }])
  const employeeId = useMyEmployeeId()

  const latest = useQuery({ queryKey: ['payroll', 'my-latest', employeeId], queryFn: () => payrollService.latestForEmployee(employeeId), enabled: !!employeeId })
  const totals = useQuery({ queryKey: ['payroll', 'my-totals', employeeId], queryFn: () => payrollService.employeeYearTotals(employeeId), enabled: !!employeeId })

  const chart = (totals.data ?? []).map((t) => ({ label: t.period.replace(' 2026', '').slice(0, 3), value: Math.round(t.netPaisa / 100) }))

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My payslips" description="Net pay history in NPR. Figures come from approved runs only." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Latest period" value={latest.data?.period ?? '—'} loading={latest.isLoading} icon={null as never} note={latest.data ? latest.data.runId : 'No payslips yet'} noteTone="blue" />
        <StatCard label="Latest net pay" value={latest.data ? formatNpr(latest.data.netPaisa) : '—'} loading={latest.isLoading} icon={null as never} note="After deductions and taxes" noteTone="green" />
        <StatCard label="Payslips recorded" value={String(totals.data?.length ?? 0)} loading={totals.isLoading} icon={null as never} note="2026 runs available to you" noteTone="purple" />
      </div>

      <Card className="p-6">
        <SectionTitle title="Net pay by month" description="Rupees (whole). The backend keeps paisa precision; charts round for display only." />
        <div className="mt-6 min-h-[120px]">
          {totals.isLoading
            ? <Skeleton className="h-32 w-full" />
            : chart.length === 0
              ? <EmptyState title="No payroll history yet" description="Payslips appear after your first processed run." />
              : <BarChart data={chart} ariaLabel="Net pay by month" height={170} />}
        </div>
      </Card>

      <Card>
        <div className="p-6 pb-2"><SectionTitle title="All my payslips" /></div>
        <ul className="divide-y divide-line">
          {totals.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="px-6 py-3"><Skeleton className="h-4 w-full" /></li>)
            : (totals.data ?? []).length === 0
              ? <li><EmptyState title="No payslips" /></li>
              : totals.data?.map((p) => (
                  <li key={`${p.runId}-${p.period}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{p.period}</p>
                      <p className="font-mono text-[10px] text-muted">{p.runId}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-semibold text-ink">{formatNpr(p.netPaisa)}</span>
                      <StatusBadge status={payslipLabel(p.status)} tone={payslipTone(p.status)} />
                    </div>
                  </li>
                ))}
        </ul>
      </Card>
    </div>
  )
}
