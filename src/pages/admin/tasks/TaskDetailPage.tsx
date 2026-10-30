import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { DefinitionList } from '@/components/data-display/fields'
import { canViewerManageTask, taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { WorkTask } from '@/types/domain'
import { TASK_STATUSES } from '@/modules/tasks/task-constants'

export function TaskDetailPage() {
  const { taskId } = useParams()
  useHeader('Task', [{ label: 'Workspace' }, { label: 'Tasks', to: '/tasks' }, { label: taskId ?? '' }])

  const { session } = useAuth()
  const queryClient = useQueryClient()
  const task = useQuery({
    queryKey: ['task', taskId, session?.employeeId, session?.role],
    queryFn: () => taskService.get(taskId ?? '', session),
    enabled: !!taskId,
  })
  const projects = useQuery({
    queryKey: ['projects', session?.employeeId, session?.role],
    queryFn: () => taskService.projects(session),
    staleTime: 60_000,
  })

  const update = useMutation({
    mutationFn: (patch: Partial<WorkTask>) => taskService.update(taskId ?? '', patch, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  if (task.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (task.isError || !task.data) {
    return (
      <Card className="p-6">
        <EmptyState
          title="Task access restricted or not found"
          description="Employees can only view tasks assigned to them or within a project/team they lead."
          action={
            <Link to="/tasks">
              <Button variant="secondary" size="sm">
                Back to my tasks
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const t = task.data
  const project = projects.data?.find((p) => p.id === t.projectId)
  const taskPerms = canViewerManageTask(t, session)
  const eligibleAssignees = db.employees.filter((e) => taskPerms.assignableEmployeeIds.includes(e.id))

  return (
    <div className="space-y-4">
      <PageHeaderBar
        title={t.title}
        description={
          t.projectName
            ? `Part of ${t.projectName}${t.teamName ? ` · ${t.teamName}` : ''}`
            : 'Standalone task'
        }
      >
        <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
        <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'orange' : 'gray'}>
          {t.priority} priority
        </Badge>
      </PageHeaderBar>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionTitle title="Description" />
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-deep">{t.description}</p>

          {taskPerms.canUpdateStatus ? (
            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-[13px] font-medium text-ink">Update task progress status</p>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === t.status ? 'primary' : 'secondary'}
                    disabled={s === t.status || update.isPending}
                    onClick={() => update.mutate({ status: s })}
                  >
                    {taskLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {(taskPerms.canFullEdit || taskPerms.canUpdateDeadline) ? (
            <div className="mt-6 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">
                  Reassign within scope ({eligibleAssignees.length} eligible)
                </label>
                <select
                  value={t.assigneeId}
                  onChange={(e) => update.mutate({ assigneeId: e.target.value })}
                  className="h-9 w-full rounded-xl border border-line bg-white px-3 text-xs text-ink"
                >
                  {eligibleAssignees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Adjust deadline</label>
                <input
                  type="date"
                  value={t.dueDate}
                  onChange={(e) => update.mutate({ dueDate: e.target.value })}
                  className="h-9 w-full rounded-xl border border-line bg-white px-3 text-xs text-ink"
                />
              </div>
            </div>
          ) : null}

          {update.isError ? (
            <div className="mt-3">
              <InfoNote tone="red">
                {update.error instanceof Error ? update.error.message : 'Unable to update task.'}
              </InfoNote>
            </div>
          ) : null}
          {update.isSuccess ? (
            <div className="mt-3">
              <InfoNote tone="green">Task updated and recorded in audit log.</InfoNote>
            </div>
          ) : null}
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
                ...(t.teamName ? [{ label: 'Assigned Team', value: t.teamName }] : []),
                ...(project ? [{ label: 'Main Project Lead', value: project.leadName }] : []),
              ]}
            />
            {project ? (
              <Link
                to={`/projects/${project.id}`}
                className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:underline"
              >
                Open project hierarchy →
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
