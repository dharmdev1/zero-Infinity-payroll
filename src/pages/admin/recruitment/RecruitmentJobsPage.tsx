import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { recruitmentService } from '@/services/recruitment'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import type { JobPosting } from '@/types/domain'
import { publishBackendNotice } from '@/utils/backend-ops'

export function RecruitmentJobsPage() {
  useHeader('Jobs', [{ label: 'Workspace' }, { label: 'Recruitment', to: '/recruitment/jobs' }, { label: 'Jobs' }])
  const { can, session } = useAuth()
  const [status, setStatus] = useState('')

  const jobs = useQuery({
    queryKey: ['recruitment', 'jobs', status, session?.userId, session?.role],
    queryFn: () => recruitmentService.jobs('', status, session),
  })

  const columns: Array<Column<JobPosting>> = [
    { key: 'title', header: 'Role', render: (j) => <span className="font-medium text-ink">{j.title}</span> },
    { key: 'department', header: 'Department' },
    { key: 'location', header: 'Location' },
    { key: 'openings', header: 'Openings', align: 'right' },
    { key: 'applicantsCount', header: 'Applicants', align: 'right' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (j) => <Badge tone={j.status === 'OPEN' ? 'green' : j.status === 'PAUSED' ? 'orange' : 'gray'} dot>{j.status.toLowerCase()}</Badge>,
    },
    { key: 'postedAt', header: 'Posted', align: 'right' },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Job openings" description="Active requisitions and applicant counts across departments.">
        <FilterSelect
          className="w-36"
          label="Status filter"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'OPEN', label: 'Open' },
            { value: 'PAUSED', label: 'Paused' },
            { value: 'CLOSED', label: 'Closed' },
          ]}
        />
        <Link to="/recruitment/candidates"><Button variant="secondary">Candidates</Button></Link>
        <Link to="/recruitment/interviews"><Button variant="secondary">Interviews</Button></Link>
        {can('recruitment.manage') ? (
          <Button onClick={() => publishBackendNotice('Creating job requisitions hits POST /recruitment/jobs on the backend.')}>New job</Button>
        ) : null}
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={jobs.data ?? []}
        rowKey={(j) => j.id}
        loading={jobs.isLoading}
        emptyState={<EmptyState title="No job postings match these filters" />}
      />
    </div>
  )
}
