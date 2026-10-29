import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { recruitmentService } from '@/services/recruitment'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { demoModeNote } from '@/utils/backend-ops'

export function RecruitmentJobsPage() {
  useHeader('Open jobs', [{ label: 'Workspace' }, { label: 'Recruitment', to: '/recruitment/jobs' }, { label: 'Jobs' }])
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')

  const jobs = useQuery({
    queryKey: ['jobs', applied],
    queryFn: () => recruitmentService.jobs(applied),
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Open jobs" description="Postings with openings and applicant counts. Postings and applicant actions are managed by HR.">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(search.trim()) }}>
          <TextInput className="w-56" placeholder="Search jobs" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search jobs" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Link to="/recruitment/candidates"><Button variant="secondary">Candidates</Button></Link>
        <Link to="/recruitment/interviews"><Button variant="secondary">Interviews</Button></Link>
      </PageHeaderBar>

      {demoModeNote}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-32 w-full" /></Card>)
          : (jobs.data ?? []).length === 0
            ? <Card><EmptyState title="No job postings match" /></Card>
            : jobs.data?.map((j) => (
                <Card key={j.id} className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink">{j.title}</h3>
                      <p className="text-xs text-muted">{j.department} · {j.location} · {j.employmentType}</p>
                    </div>
                    <Badge tone={j.status === 'OPEN' ? 'green' : j.status === 'DRAFT' ? 'gray' : 'red'} dot>{j.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-2 text-[13px] text-muted">{j.summary}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[13px]">
                    <span className="text-muted">{j.openings} opening{j.openings === 1 ? '' : 's'} · posted {j.postedAt}</span>
                    <span className="font-semibold text-brand-600">{j.applicants} applicants</span>
                  </div>
                </Card>
              ))}
      </div>
    </div>
  )
}
