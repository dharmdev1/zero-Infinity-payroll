import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { DefinitionList } from '@/components/data-display/fields'
import { taskService } from '@/services/tasks'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { WorkTask } from '@/types/domain'
import { TASK_STATUSES } from '../task-constants'

export function TaskDetailPage() {
  const { taskId } = useParams()
  useHeader('Task', [{ label: 'Workspace' }, { label: 'Tasks', to: '/tasks' }, { label: taskId ?? '' }])

  const { can } = useAuth()
  const queryClient = useQueryClient()
  const task = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.get(taskId ?? ''),
    enabled: !!taskId,
  })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => taskService.projects(), staleTime: 120_000 })

  const update = useMutation({
    mutationFn: (patch: Partial<WorkTask>) => taskService.update(taskId ?? '', patch),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  })

  const t = task.data
  const project = projects.data?.find((p) => t && p.id === t.projectId)

  if (task.isLoading || !t) {
    return <div className="space-y-3"><Skeleton className="h-8 w-80" /><Skeleton className="h-48 w-full" /></div>
  }
  if (task.isError) {
    return <EmptyState title="Task not found" description="It may have been removed." action={<Link to="/tasks"><Button variant="secondary" size="sm">Back to tasks</Button></Link>} />
  }

  return (
    <div className="space-y-4">
      <PageHeaderBar title={t.title} description={t.projectName ? `Part of ${t.projectName}` : 'Standalone task'}>
        <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
        <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'orange' : 'gray'}>{t.priority} priority</Badge>
      </PageHeaderBar>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionTitle title="Description" />
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-deep">{t.description}</p>

          {can('tasks.manage') && t.status !== 'COMPLETED' ? (
            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-[13px] font-medium text-ink">Move task</p>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((s) => (
                  <Button key={s} size="sm" variant={s === t.status ? 'primary' : 'secondary'} disabled={s === t.status} onClick={() => update.mutate({ status: s })}>
                    {taskLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {update.isSuccess ? <div className="mt-3"><InfoNote tone="green">Status updated (demo adapter, not persisted).</InfoNote></div> : null}
        </Card>

        <Card className="p-6">
          <SectionTitle title="Details" />
          <div className="mt-4">
            <DefinitionList
              rows={[
                {
                  label: 'Assignee',
                  value: (
                    <span className="flex items-center justify-end gap-2">
                      <Avatar name={t.assigneeName} size="xs" /> {t.assigneeName}
                    </span>
                  ),
                },
                { label: 'Due date', value: t.dueDate },
                { label: 'Created', value: t.createdAt },
                { label: 'Project', value: t.projectName ?? '—' },
                ...(project ? [{ label: 'Project client', value: project.client }] : []),
              ]}
            />
            {project ? (
              <Link to={`/projects/${project.id}`} className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:underline">Open project →</Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
