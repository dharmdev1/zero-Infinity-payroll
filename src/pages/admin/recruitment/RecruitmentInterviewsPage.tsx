import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { recruitmentService } from '@/services/recruitment'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNptDateTime } from '@/utils/npt'

export function RecruitmentInterviewsPage() {
  useHeader('Interviews', [{ label: 'Workspace' }, { label: 'Recruitment', to: '/recruitment/jobs' }, { label: 'Interviews' }])

  const interviews = useQuery({ queryKey: ['interviews'], queryFn: () => recruitmentService.interviews() })
  const data = interviews.data ?? []
  const upcoming = data.filter((i) => i.status === 'SCHEDULED')
  const completed = data.filter((i) => i.status === 'COMPLETED')
  const cancelled = data.filter((i) => i.status === 'CANCELLED')

  return (
    <div className="space-y-5">
      <PageHeaderBar title="Interviews" description="Scheduled panels and completed rounds with feedback.">
        <Badge tone="blue" dot>{upcoming.length} upcoming</Badge>
        <Link to="/recruitment/jobs"><Button variant="secondary">Jobs</Button></Link>
        <Link to="/recruitment/candidates"><Button variant="secondary">Candidates</Button></Link>
      </PageHeaderBar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Scheduled" value={String(upcoming.length)} loading={interviews.isLoading} icon={null as never} note="All stages" noteTone="blue" />
        <StatCard label="Completed" value={String(completed.length)} loading={interviews.isLoading} icon={null as never} note="Feedback captured" noteTone="green" />
        <StatCard label="Cancelled" value={String(cancelled.length)} loading={interviews.isLoading} icon={null as never} note="Removed from pipeline" noteTone="red" />
        <StatCard label="Stages" value="4" loading={false} icon={null as never} note="Screening · Technical · HR · Final" noteTone="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-6 pb-2"><SectionTitle title="Upcoming interviews" description="Times shown in Nepal time (NPT)." /></div>
          <ul className="divide-y divide-line">
            {interviews.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="px-6 py-4"><Skeleton className="h-4 w-full" /></li>)
              : upcoming.length === 0
                ? <li><EmptyState title="Nothing scheduled" /></li>
                : upcoming.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{i.candidateName}</p>
                        <p className="text-xs text-muted">{i.jobTitle} · {i.stage} · {i.interviewers.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-ink">{formatNptDateTime(i.dateTime)}</p>
                        <Badge tone={i.mode === 'ON_SITE' ? 'purple' : i.mode === 'REMOTE' ? 'blue' : 'gray'}>{i.mode.toLowerCase()}</Badge>
                      </div>
                    </li>
                  ))}
          </ul>
        </Card>

        <Card>
          <div className="p-6 pb-2"><SectionTitle title="Completed & cancelled" description="Round outcomes and interviewer feedback." /></div>
          <ul className="divide-y divide-line">
            {[...completed, ...cancelled].length === 0
              ? <li><EmptyState title="No completed rounds yet" /></li>
              : [...completed, ...cancelled].map((i) => (
                  <li key={i.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{i.candidateName} · {i.stage}</p>
                        <p className="text-xs text-muted">{i.jobTitle} · {formatNptDateTime(i.dateTime)}</p>
                      </div>
                      <Badge tone={i.status === 'COMPLETED' ? 'green' : 'red'} dot>{i.status.toLowerCase()}</Badge>
                    </div>
                    {i.feedback ? <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-[13px] text-muted">“{i.feedback}”</p> : null}
                  </li>
                ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
