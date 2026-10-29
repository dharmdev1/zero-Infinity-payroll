import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '@/components/ui/base'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ReportsExportNote } from '../reports-shared'

const REPORTS = [
  { title: 'Employees', to: '/reports/employees', description: 'Headcount, departments, employment types and tenure.' },
  { title: 'Attendance', to: '/reports/attendance', description: 'Present / late / absent / leave by department and period.' },
  { title: 'Leave', to: '/reports/leave', description: 'Requests by status and type for the Mon–Fri workweek.' },
  { title: 'Payroll', to: '/reports/payroll', description: 'Run totals in NPR (paisa-int safe) by period.' },
]

export function ReportsHome() {
  useHeader('Reports', [{ label: 'Workspace' }, { label: 'Reports' }])
  const { can } = useAuth()

  return (
    <div className="space-y-5">
      <PageHeaderBar title="Reports" description="Read-only reporting over the HRMS data model. Aggregates are denominator-correct.">
        {can('reports.export') ? <Badge tone="gray">Export permission detected</Badge> : null}
      </PageHeaderBar>
      <ReportsExportNote />

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((c) => (
          <Card key={c.to} className="flex flex-col items-start gap-3 p-6">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-[13px] text-muted">{c.description}</p>
            </div>
            <Link to={c.to}><Button variant="secondary" size="sm">Open {c.title.toLowerCase()} report</Button></Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
