import { useQuery } from '@tanstack/react-query'
import { Button, Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { employeeService } from '@/services/employees'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ReportsExportNote, notifyReportExport } from '../reports-shared'

interface DeptRow {
  department: string
  total: number
  active: number
  probation: number
  inactive: number
}

export function EmployeeReportsPage() {
  useHeader('Employees report', [{ label: 'Workspace' }, { label: 'Reports', to: '/reports' }, { label: 'Employees' }])

  const employees = useQuery({ queryKey: ['reports', 'employees'], queryFn: () => employeeService.list({ page: 1, pageSize: 200 }) })

  const rows = employees.data?.items ?? []
  const departments: DeptRow[] = [...new Set(rows.map((e) => e.department))].sort().map((dept) => {
    const scoped = rows.filter((e) => e.department === dept)
    return {
      department: dept,
      total: scoped.length,
      active: scoped.filter((e) => e.status === 'ACTIVE').length,
      probation: scoped.filter((e) => e.status === 'PROBATION').length,
      inactive: scoped.filter((e) => e.status === 'INACTIVE').length,
    }
  })

  const columns: Array<Column<DeptRow>> = [
    { key: 'department', header: 'Department' },
    { key: 'total', header: 'Total', align: 'right' },
    { key: 'active', header: 'Active', align: 'right' },
    { key: 'probation', header: 'Probation', align: 'right' },
    { key: 'inactive', header: 'Inactive', align: 'right' },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Employees report" description="Workforce composition snapshot from the directory.">
        <Button variant="secondary" size="sm" onClick={() => notifyReportExport('Employee census (CSV)')}>Export CSV</Button>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total headcount" value={String(rows.length)} loading={employees.isLoading} icon={null as never} note="All employees on record" noteTone="blue" />
        <StatCard label="Active" value={String(rows.filter((e) => e.status === 'ACTIVE').length)} loading={employees.isLoading} icon={null as never} note="Fully confirmed" noteTone="green" />
        <StatCard label="Probation" value={String(rows.filter((e) => e.status === 'PROBATION').length)} loading={employees.isLoading} icon={null as never} note="Employment review period" noteTone="orange" />
        <StatCard label="Inactive" value={String(rows.filter((e) => e.status === 'INACTIVE').length)} loading={employees.isLoading} icon={null as never} note="Records retained" noteTone="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="p-6 pb-2"><SectionTitle title="Employment status by department" /></div>
          <DataTable columns={columns} rows={departments} rowKey={(r) => r.department} loading={employees.isLoading} />
        </Card>
        <EmploymentTypeBreakdown rows={rows} loading={employees.isLoading} />
      </div>
      <ReportsExportNote />
    </div>
  )
}

function EmploymentTypeBreakdown({ rows, loading }: { rows: Array<{ employmentType: string }>; loading: boolean }) {
  const types = [...new Set(rows.map((e) => e.employmentType))].map((t) => ({ type: t, count: rows.filter((e) => e.employmentType === t).length }))
  return (
    <Card className="p-6">
      <SectionTitle title="Employment types" description="Contract mix across the company." />
      <ul className="mt-4 space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          : types.map((t) => (
              <li key={t.type}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink">{t.type}</span>
                  <span className="text-muted">{t.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EDF1F7]">
                  <div className="h-full bg-brand-600" style={{ width: `${(t.count / Math.max(rows.length, 1)) * 100}%` }} />
                </div>
              </li>
            ))}
      </ul>
    </Card>
  )
}
