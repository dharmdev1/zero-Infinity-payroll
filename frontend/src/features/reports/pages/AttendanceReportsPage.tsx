import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { reportService } from '@/services/documents'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { db } from '@/services/demo/store'
import { monthStartFromAnchor } from '../reports-shared'

export function AttendanceReportsPage() {
  useHeader('Attendance report', [{ label: 'Workspace' }, { label: 'Reports', to: '/reports' }, { label: 'Attendance' }])
  const [range, setRange] = useState({ from: monthStartFromAnchor(db.today), to: db.today })

  const report = useQuery({
    queryKey: ['reports', 'attendance', range.from, range.to],
    queryFn: () => reportService.attendanceByDepartment(range.from, range.to),
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Attendance report" description="Present, late, absent and leave days by department (denominator-correct).">
        <Button variant="secondary" size="sm" onClick={() => { window.alert('Attendance XLSX export is a backend reporting endpoint. Nothing is generated client-side.') }}>
          Export XLSX
        </Button>
      </PageHeaderBar>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0">
            <label htmlFor="att-rep-from" className="mb-1.5 block text-[13px] font-medium text-ink">From</label>
            <input id="att-rep-from" type="date" value={range.from} max={db.today} onChange={(e) => setRange((rc) => ({ ...rc, from: e.target.value }))} className="h-10 w-44 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="min-w-0">
            <label htmlFor="att-rep-to" className="mb-1.5 block text-[13px] font-medium text-ink">To</label>
            <input id="att-rep-to" type="date" value={range.to} max={db.today} min={range.from} onChange={(e) => setRange((rc) => ({ ...rc, to: e.target.value }))} className="h-10 w-44 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none" />
          </div>
          <Badge tone="gray">{report.data?.eligibleEmployeeDays ?? '—'} eligible employee-days</Badge>
        </div>
      </Card>

      <Card>
        <div className="p-6 pb-4">
          <SectionTitle title="By department" description="Late counts are included in present." />
        </div>
        {report.isLoading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-[#F8FAFD]">
                  {['Department', 'Eligible days', 'Present', 'Late', 'Absent', 'Leave', 'Rate'].map((h, i) => (
                    <th key={h} className={`table-caption px-4 py-2.5 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.data?.rows.map((r) => (
                  <tr key={r.department} className="border-t border-line first:border-t-0">
                    <td className="px-4 py-3 text-left text-[13px] font-medium text-ink-deep">{r.department}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.eligibleDays}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.present}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.late}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.absent}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.onLeave}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-brand-600">{r.rate}%</td>
                  </tr>
                ))}
                {report.data ? (
                  <tr className="border-t-2 border-line bg-canvas/60">
                    <td className="px-4 py-3 text-left text-[13px] font-semibold text-ink">{report.data.totals.department}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{report.data.totals.eligibleDays}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{report.data.totals.present}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{report.data.totals.late}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{report.data.totals.absent}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{report.data.totals.onLeave}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-brand-600">{report.data.totals.rate}%</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
