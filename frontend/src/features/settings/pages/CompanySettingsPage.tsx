import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { settingsService } from '@/services/settings'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'

const DEFAULT_COMPANY = {
  name: 'Zero Infinity Technologies Pvt. Ltd.',
  timezone: 'Asia/Kathmandu (UTC+05:45)',
  workweek: 'Monday–Friday',
  currency: 'Nepalese Rupee (NPR)',
  shift: '09:30 – 17:30 NPT',
}

export function CompanySettingsPage() {
  useHeader('Company settings', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/company' }, { label: 'Company' }])
  const headcount = useQuery({ queryKey: ['settings', 'headcount'], queryFn: () => settingsService.headcount() })
  const [company, setCompany] = useState(DEFAULT_COMPANY)

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Company settings" description="Organization profile used across the workspace.">
        <Button variant="secondary" onClick={() => window.alert('Saving company settings will hit PUT /settings/company. In demo mode nothing is persisted.')}>
          Save changes
        </Button>
      </PageHeaderBar>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionTitle title="Company profile" description="Display name and operating basics." />
          <dl className="mt-4 space-y-4 text-[13px]">
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Legal name</dt>
              <dd>
                <TextInput className="max-w-md" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} aria-label="Legal name" />
              </dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Timezone</dt>
              <dd className="text-ink">{company.timezone}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Workweek</dt>
              <dd className="text-ink">{company.workweek}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Currency</dt>
              <dd className="text-ink">{company.currency}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Standard shift</dt>
              <dd className="text-ink">{company.shift}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Headcount" description="Directory counts by employment status." />
          <div className="mt-4 space-y-3 text-[13px]">
            {[
              ['Total', headcount.data?.total, 'text-ink'],
              ['Active', headcount.data?.active, 'text-success'],
              ['Probation', headcount.data?.probation, 'text-warning'],
              ['Inactive', headcount.data?.inactive, 'text-muted'],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-muted">{label}</span>
                {headcount.isLoading ? <Skeleton className="h-4 w-10" /> : <span className={`text-sm font-bold ${cls}`}>{value ?? '—'}</span>}
              </div>
            ))}
          </div>
          <Link to="/employees" className="mt-4 inline-flex text-[13px] font-medium text-brand-600 hover:underline">Open directory →</Link>
        </Card>
      </div>

      <InfoNote tone="orange">
        Timezone and workweek are business rules for Nepal time; the server owns them. Changing the workweek would shift attendance
        denominators and payroll eligibility — that is a backend change with data migration.
      </InfoNote>
    </div>
  )
}
