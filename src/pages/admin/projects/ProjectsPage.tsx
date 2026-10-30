import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FolderPlus, Plus, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { getProjectScope, taskService } from '@/services/tasks'
import type { CreateProjectInput, CreateTaskInput } from '@/services/tasks'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { CreateProjectDialog, CreateTaskDialog, projectStatusMeta } from '@/modules/projects'
import { useAuth } from '@/app/auth-context'

export function ProjectsPage() {
  useHeader('Projects', [{ label: 'Workspace' }, { label: 'Projects' }])
  const { session, can } = useAuth()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null)

  const projects = useQuery({
    queryKey: ['projects', session?.employeeId, session?.role],
    queryFn: () => taskService.projects(session),
  })

  const createProjectMut = useMutation({
    mutationFn: (input: CreateProjectInput) => taskService.createProject(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateOpen(false)
    },
  })

  const createTaskMut = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setTaskProjectId(null)
    },
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar
        title="Projects & Team Hierarchy"
        description={
          session?.role === 'EMPLOYEE'
            ? 'Projects where you are appointed as Main Project Lead, Team Lead, or Project Member.'
            : 'Client and internal projects with Main Project Leads, sub-teams, Team Leads, and task load.'
        }
      >
        <Link to="/tasks">
          <Button variant="secondary">Scoped tasks</Button>
        </Link>
        {can('projects.manage') ? (
          <Button onClick={() => setCreateOpen(true)}>
            <FolderPlus size={15} className="mr-1.5" /> Add project
          </Button>
        ) : null}
      </PageHeaderBar>

      {projects.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-28 w-full" />
            </Card>
          ))}
        </div>
      ) : (projects.data ?? []).length === 0 ? (
        <Card>
          <EmptyState
            title="No assigned projects"
            description="You are not currently assigned to any project or team."
            action={
              can('projects.manage') ? (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus size={14} className="mr-1" /> Add first project
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(projects.data ?? []).map((p) => {
            const meta = projectStatusMeta[p.status]
            const scope = getProjectScope(p, session)
            const teams = p.teams ?? []
            return (
              <Card key={p.id} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/projects/${p.id}`} className="text-[15px] font-semibold text-brand-600 hover:underline">
                        {p.name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted">
                        {p.code} · {p.client}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        tone={
                          scope.position === 'PROJECT_LEAD'
                            ? 'purple'
                            : scope.position === 'TEAM_LEAD'
                              ? 'blue'
                              : 'gray'
                        }
                      >
                        {scope.positionLabel}
                      </Badge>
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{p.summary}</p>

                  {teams.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {teams.map((tm) => (
                        <span
                          key={tm.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-soft px-2 py-0.5 text-[11px] text-ink"
                        >
                          <Users size={11} className="text-brand-600" />
                          <span className="font-medium">{tm.name}</span>
                          <span className="text-muted">· Lead: {tm.leadName}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[13px]">
                  <span className="flex items-center gap-2 text-ink">
                    <Avatar name={p.leadName} size="xs" tone="purple" />
                    <span className="font-medium">{p.leadName}</span>
                    <span className="text-xs text-muted">· Main Project Lead</span>
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-muted">
                      {teams.length} team{teams.length === 1 ? '' : 's'} · {p.taskCount} tasks
                    </span>
                    {scope.canCreateTasks ? (
                      <Button size="sm" variant="secondary" onClick={() => setTaskProjectId(p.id)}>
                        <Plus size={13} className="mr-1" /> Delegate task
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {createOpen ? (
        <CreateProjectDialog
          onClose={() => setCreateOpen(false)}
          pending={createProjectMut.isPending}
          onConfirm={(input) => createProjectMut.mutate(input)}
        />
      ) : null}

      {taskProjectId ? (
        <CreateTaskDialog
          defaultProjectId={taskProjectId}
          viewer={session}
          onClose={() => setTaskProjectId(null)}
          pending={createTaskMut.isPending}
          onConfirm={(input) => createTaskMut.mutate(input)}
        />
      ) : null}
    </div>
  )
}
