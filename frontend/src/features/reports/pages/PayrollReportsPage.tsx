import { useQuery } from '@tanstack/react-query'
import { Button, Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, payrollRunTone } from '@/components/data-display/status'
import { payrollService } from '@/services/payroll'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ReportsExportNote, notifyReportExport } from '../reports-shared'
import { formatNpr } from '@/utils/npr'
import type { PayrollRun } from '@/types/domain'

export function PayrollReportsPage() {
  useHeader('Payroll report', [{ label: 'Workspace' }, { label: 'Reports', to: '/reports' }, { label: 'Payroll' }])

  const runs = useQuery({ queryKey: ['reports', 'payroll', 'runs'], queryFn: () => payrollService.runs('', 1, 50) })

  const rows: PayrollRun[] = [...(runs.data?.items ?? [])].sort((a, b) => b.period.localeCompare(a.period))
  const ytdNet = rows.reduce((acc, r) => acc + r.totalNetPaisa, 0)

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Payroll report" description="Run totals by period in NPR. Money values are paisa integers end to end — never floating point.">
        <Button variant="secondary" size="sm" onClick={() => notifyReportExport('Payroll report (PDF)')}>Export PDF</Button>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Runs" value={String(rows.length)} loading={runs.isLoading} icon={null as never} note="Most recent first" noteTone="blue" />
        <StatCard label="Net (all runs)" value={formatNpr(ytdNet)} loading={runs.isLoading} icon={null as never} note="Sum of run-level net totals" noteTone="green" />
        <StatCard label="Currency" value="NPR" loading={false} icon={null as never} note="Paisa-integer storage" noteTone="purple" />
      </div>

      <Card>
        <div className="p-6 pb-2"><SectionTitle title="Run totals" description="Server-computed totals; the frontend performs no payroll arithmetic." /></div>
        <div className="overflow-x-auto">
          {runs.isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-[#F8FAFD]">
                  {['Period', 'Run', 'Employees', 'Gross', 'Deductions', 'Net', 'Status'].map((h, i) => (
                    <th key={h} className={`table-caption px-4 py-2.5 ${i < 2 ? 'text-left' : i === 6 ? 'text-center' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line first:border-t-0">
                    <td className="px-4 py-3 text-left text-[13px] font-medium text-ink-deep">{r.period}</td>
                    <td className="px-4 py-3 text-left font-mono text-[11px] text-muted">{r.id}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.employeesCount}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{formatNpr(r.totalGrossPaisa)}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{formatNpr(r.totalDeductionsPaisa)}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-ink">{formatNpr(r.totalNetPaisa)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} tone={payrollRunTone(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <ReportsExportNote />
    </div>
  )
}
