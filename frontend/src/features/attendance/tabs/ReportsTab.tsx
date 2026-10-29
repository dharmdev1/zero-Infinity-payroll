import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { reportService } from '@/services/documents'
import { db, DEMO_TODAY } from '@/services/demo/store'

function monthStart(): string {
  return `${DEMO_TODAY.slice(0, 7)}-01`
}

export function AttendanceReportsTab() {
  const [fromDate, setFromDate] = useState(monthStart())
  const [toDate, setToDate] = useState(db.today)
  const [applied, setApplied] = useState({ fromDate: monthStart(), toDate: db.today })

  const report = useQuery({
    queryKey: ['reports', 'attendance', applied.fromDate, applied.toDate],
    enabled: applied.fromDate <= applied.toDate,
    queryFn: () => reportService.attendanceByDepartment(applied.fromDate, applied.toDate),
  })

  const totals = report.data?.totals
  const rows = report.data?.rows ?? []

  const noteExports = (what: string) => {
    window.alert(`${what} export will be generated server-side once the reporting API is connected. The frontend never fabricates report rows.`)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="rep-from" className="mb-1.5 block text-[13px] font-medium text-ink">From date</label>
            <input
              id="rep-from"
              type="date"
              value={fromDate}
              max={db.today}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="rep-to" className="mb-1.5 block text-[13px] font-medium text-ink">To date</label>
            <input
              id="rep-to"
              type="date"
              value={toDate}
              max={db.today}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setApplied({ fromDate: fromDate || monthStart(), toDate: toDate || db.today })}
              disabled={!!fromDate && !!toDate && fromDate > toDate}
            >
              Apply filters
            </Button>
            <Button variant="secondary" onClick={() => { setFromDate(monthStart()); setToDate(db.today); setApplied({ fromDate: monthStart(), toDate: db.today }) }}>
              Reset
            </Button>
          </div>
        </div>
        {fromDate && toDate && fromDate > toDate ? (
          <p className="mt-2 text-xs text-danger" role="alert">From date must be on or before the to date.</p>
        ) : null}
      </Card>

      <InfoNote tone="orange">
        Aggregates shown are denominator-correct: they divide by workdays × active headcount, and today's incomplete rows count toward
        their day. Exports are affordances only until the reporting backend is wired.
      </InfoNote>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eligible employee-days" value={String(totals?.eligibleDays ?? 0)} loading={report.isLoading} icon={null as never} note={`${applied.fromDate} → ${applied.toDate}`} noteTone="blue" />
        <StatCard label="Present" value={String(totals?.present ?? 0)} loading={report.isLoading} icon={null as never} note={totals ? `${totals.rate}% of eligible days` : undefined} noteTone="green" />
        <StatCard label="Absent" value={String(totals?.absent ?? 0)} loading={report.isLoading} icon={null as never} note="No check-in, no approved leave" noteTone="red" />
        <StatCard label="On leave" value={String(totals?.onLeave ?? 0)} loading={report.isLoading} icon={null as never} note="Approved leave days" noteTone="orange" />
      </div>

      <Card>
        <div className="p-6 pb-4">
          <SectionTitle
            title="Attendance by department"
            description="Rate = present ÷ eligible employee-days (workdays × headcount)."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => noteExports('CSV')}>Export CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => noteExports('Excel')}>Export XLSX</Button>
                <Button variant="secondary" size="sm" onClick={() => noteExports('PDF')}>Export PDF</Button>
              </div>
            }
          />
        </div>
        <div className="scroll-x">
          {report.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : (
            <table className="w-full min-w-[680px] text-sm" role="table">
              <thead>
                <tr className="border-y border-line bg-[#F8FAFD]">
                  <th className="table-caption px-6 py-2.5 text-left">Department</th>
                  <th className="table-caption px-4 py-2.5 text-right">Eligible days</th>
                  <th className="table-caption px-4 py-2.5 text-right">Present</th>
                  <th className="table-caption px-4 py-2.5 text-right">Late</th>
                  <th className="table-caption px-4 py-2.5 text-right">Absent</th>
                  <th className="table-caption px-4 py-2.5 text-right">Leave</th>
                  <th className="table-caption px-6 py-2.5 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.department} className="border-t border-line first:border-t-0">
                    <td className="px-6 py-3 text-[13px] font-medium text-ink-deep">{r.department}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-muted">{r.eligibleDays}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.present}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.late}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.absent}</td>
                    <td className="px-4 py-3 text-right text-[13px]">{r.onLeave}</td>
                    <td className="px-6 py-3 text-right text-[13px] font-semibold text-ink">{r.rate}%</td>
                  </tr>
                ))}
                {totals ? (
                  <tr className="border-t-2 border-line bg-canvas/60">
                    <td className="px-6 py-3 text-[13px] font-semibold text-ink">{totals.department}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{totals.eligibleDays}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{totals.present}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{totals.late}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{totals.absent}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold">{totals.onLeave}</td>
                    <td className="px-6 py-3 text-right text-[13px] font-bold text-brand-600">{totals.rate}%</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
        <p className="border-t border-line px-6 py-3 text-xs text-muted">
          Report range: {applied.fromDate} → {applied.toDate} · Late rows are included in Present.
        </p>
      </Card>
    </div>
  )
}
