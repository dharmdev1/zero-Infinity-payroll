import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { DefinitionList } from '@/components/data-display/fields'
import { taskService } from '@/services/tasks'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { projectStatusMeta } from '../task-constants'

export function ProjectDetailPage() {
  const { projectId } = useParams()

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => taskService.getProject(projectId ?? ''),
    enabled: !!projectId,
  })
  const projectTasks = useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => taskService.list({}),
  })

  useHeader(project.data?.name ?? 'Project', [
    { label: 'Workspace' },
    { label: 'Projects', to: '/projects' },
    { label: project.data?.name ?? '' },
  ])

  const p = project.data
  const tasks = (projectTasks.data ?? []).filter((t) => t.projectId === projectId)
  const done = tasks.filter((t) => t.status === 'COMPLETED').length

  if (project.isLoading || !p) {
    return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>
  }
  if (project.isError) {
    return <EmptyState title="Project not found" action={<Link to="/projects"><Button variant="secondary" size="sm">Back to projects</Button></Link>} />
  }

  const meta = projectStatusMeta[p.status]

  return (
    <div className="space-y-4">
      <PageHeaderBar title={p.name} description={`${p.code} · ${p.client} · started ${p.startedAt}`}>
        <Badge tone={meta.tone} dot>{meta.label}</Badge>
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tasks" value={String(tasks.length)} loading={projectTasks.isLoading} icon={null as never} note="Assigned to this project" noteTone="blue" />
        <StatCard label="Completed" value={String(done)} loading={projectTasks.isLoading} icon={null as never} note={tasks.length ? `${Math.round((done / tasks.length) * 100)}% of scope` : 'No tasks yet'} noteTone="green" />
        <StatCard label="Open" value={String(tasks.length - done)} loading={projectTasks.isLoading} icon={null as never} note="Includes in-review work" noteTone="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <SectionTitle title="Summary" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{p.summary}</p>
          <div className="mt-4 border-t border-line pt-4">
            <DefinitionList
              rows={[
                { label: 'Lead', value: p.leadName },
                { label: 'Client', value: p.client },
                { label: 'Started', value: p.startedAt },
              ]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6 pb-2">
            <SectionTitle title="Project tasks" description="Newest first by due date." />
          </div>
          <ul className="divide-y divide-line">
            {tasks.length === 0
              ? <li><EmptyState title="No tasks assigned to this project" /></li>
              : tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <Link to={`/tasks/${t.id}`} className="text-[13px] font-medium text-brand-600 hover:underline">{t.title}</Link>
                      <p className="text-xs text-muted">{t.assigneeName} · due {t.dueDate}</p>
                    </div>
                    <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                  </li>
                ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
