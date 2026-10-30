import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Network, Pencil, Plus, ShieldCheck, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { DefinitionList } from '@/components/data-display/fields'
import { getProjectScope, taskService } from '@/services/tasks'
import type { CreateProjectTeamInput, CreateTaskInput } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { CreateTaskDialog, EditProjectDialog, projectStatusMeta } from '@/modules/projects'
import { useAuth } from '@/app/auth-context'
import type { Project } from '@/types/domain'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { session, can } = useAuth()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [defaultTeamId, setDefaultTeamId] = useState<string | undefined>(undefined)

  const project = useQuery({
    queryKey: ['project', projectId, session?.employeeId, session?.role],
    queryFn: () => taskService.getProject(projectId ?? '', session),
    enabled: !!projectId,
  })
  const projectTasks = useQuery({
    queryKey: ['tasks', 'project', projectId, session?.employeeId, session?.role],
    queryFn: () => taskService.list({ projectId: projectId ?? '' }, session),
    enabled: !!projectId,
  })

  const updateProjectMut = useMutation({
    mutationFn: (patch: Partial<Project> & { rawTeams?: CreateProjectTeamInput[] }) =>
      taskService.updateProject(projectId ?? '', patch, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditOpen(false)
    },
  })

  const moveMemberMut = useMutation({
    mutationFn: (input: { employeeId: string; fromTeamId?: string; toTeamId: string }) =>
      taskService.moveTeamMember({
        projectId: projectId ?? '',
        employeeId: input.employeeId,
        fromTeamId: input.fromTeamId,
        toTeamId: input.toTeamId,
        actor: session,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const createTaskMut = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setAddTaskOpen(false)
    },
  })

  useHeader(project.data?.name ?? 'Project', [
    { label: 'Workspace' },
    { label: 'Projects', to: '/projects' },
    { label: project.data?.name ?? '' },
  ])

  if (project.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (project.isError || !project.data) {
    return (
      <Card className="p-6">
        <EmptyState
          title="Project access restricted or not found"
          description="You can only view projects where you are assigned as Main Project Lead, Team Lead, or Project Member."
          action={
            <Link to="/projects">
              <Button variant="secondary" size="sm">
                Back to my projects
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const p = project.data
  const scope = getProjectScope(p, session)
  const tasks = projectTasks.data ?? []
  const done = tasks.filter((t) => t.status === 'COMPLETED').length
  const teams = p.teams ?? []
  const directMembers = (p.memberIds ?? [])
    .map((id) => db.employees.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
  const meta = projectStatusMeta[p.status]

  return (
    <div className="space-y-4">
      <PageHeaderBar title={p.name} description={`${p.code} · ${p.client} · started ${p.startedAt}`}>
        <Badge tone={scope.position === 'PROJECT_LEAD' ? 'purple' : scope.position === 'TEAM_LEAD' ? 'blue' : 'gray'}>
          Your Position: {scope.positionLabel}
        </Badge>
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
        {can('projects.manage') ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1.5" /> Configure hierarchy & teams
          </Button>
        ) : null}
        {scope.canCreateTasks ? (
          <Button
            onClick={() => {
              setDefaultTeamId(scope.ledTeams[0]?.id)
              setAddTaskOpen(true)
            }}
          >
            <Plus size={15} className="mr-1.5" /> Delegate task
          </Button>
        ) : null}
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="Teams"
          value={String(teams.length)}
          icon={null as never}
          note="Active sub-teams under project"
          noteTone="blue"
        />
        <StatCard
          label="Visible Tasks"
          value={String(tasks.length)}
          loading={projectTasks.isLoading}
          icon={null as never}
          note={session?.role === 'EMPLOYEE' ? 'Scoped to your project/team authority' : 'All project tasks'}
          noteTone="blue"
        />
        <StatCard
          label="Completed"
          value={String(done)}
          loading={projectTasks.isLoading}
          icon={null as never}
          note={tasks.length ? `${Math.round((done / tasks.length) * 100)}% of visible scope` : 'No tasks yet'}
          noteTone="green"
        />
        <StatCard
          label="Open"
          value={String(tasks.length - done)}
          loading={projectTasks.isLoading}
          icon={null as never}
          note="In progress or review"
          noteTone="orange"
        />
      </div>

      {/* Complete Project Hierarchy Card */}
      <Card className="p-6">
        <SectionTitle
          title="Project Hierarchy & Delegated Authority"
          description="Main Project Lead oversees the entire project and all teams. Each Team Lead manages and delegates tasks to their assigned team."
          right={
            can('projects.manage') ? (
              <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                <Network size={14} className="mr-1.5" /> Manage teams & members
              </Button>
            ) : undefined
          }
        />

        <div className="mt-4 space-y-4">
          {/* Level 1: Main Project Lead */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={p.leadName} size="md" tone="purple" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">{p.leadName}</span>
                  <Badge tone="purple">Main Project Lead</Badge>
                </div>
                <p className="text-xs text-muted">
                  Oversees {p.name} ({p.code}), all {teams.length} team(s), and can assign tasks across the entire project.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={15} className="text-brand-600" />
              <span>Project-wide task & milestone authority</span>
            </div>
          </div>

          {/* Level 2: Sub-Teams */}
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team, index) => {
              const isViewerTeamLead = team.leadId === session?.employeeId
              const canDelegateToThisTeam =
                session?.role === 'SUPER_ADMIN' ||
                session?.role === 'HR_ADMIN' ||
                scope.isProjectLead ||
                isViewerTeamLead

              return (
                <div key={team.id} className="flex flex-col justify-between rounded-xl border border-line bg-surface p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone="blue">Team {index + 1}</Badge>
                          <h3 className="text-sm font-semibold text-ink">{team.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Team Lead: <strong className="text-ink">{team.leadName}</strong>
                        </p>
                      </div>
                      {canDelegateToThisTeam ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setDefaultTeamId(team.id)
                            setAddTaskOpen(true)
                          }}
                        >
                          <Plus size={12} className="mr-1" /> Assign task
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-3 border-t border-line pt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Team Members ({team.memberIds.length})
                      </p>
                      {team.memberIds.length === 0 ? (
                        <p className="text-xs text-muted">No additional members in this team yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {team.memberIds.map((memberId) => {
                            const emp = db.employees.find((e) => e.id === memberId)
                            const otherTeams = teams.filter((t) => t.id !== team.id)
                            return (
                              <li
                                key={memberId}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-soft/60 px-2.5 py-1.5 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar name={emp?.name ?? memberId} size="xs" tone="blue" />
                                  <div>
                                    <span className="font-medium text-ink">{emp?.name ?? memberId}</span>
                                    <span className="ml-1.5 text-[11px] text-muted">{emp?.jobTitle}</span>
                                  </div>
                                </div>
                                {can('projects.manage') && otherTeams.length > 0 ? (
                                  <select
                                    aria-label={`Move ${emp?.name ?? memberId} to another team`}
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        moveMemberMut.mutate({
                                          employeeId: memberId,
                                          fromTeamId: team.id,
                                          toTeamId: e.target.value,
                                        })
                                      }
                                    }}
                                    className="rounded border border-line bg-white px-1.5 py-0.5 text-[11px] text-muted hover:border-brand-300"
                                  >
                                    <option value="">Move to team...</option>
                                    {otherTeams.map((ot) => (
                                      <option key={ot.id} value={ot.id}>
                                        → {ot.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <Badge tone="gray">Member</Badge>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Direct Project Members */}
          {directMembers.length > 0 ? (
            <div className="rounded-xl border border-line bg-surface-soft/40 p-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-brand-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Direct Project Contributors (Reporting directly to Main Project Lead)
                </p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {directMembers.map((emp) => (
                  <span
                    key={emp.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs"
                  >
                    <Avatar name={emp.name} size="xs" tone="green" />
                    <span className="font-medium text-ink">{emp.name}</span>
                    <span className="text-muted">· {emp.jobTitle}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <SectionTitle title="Project Details" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{p.summary}</p>
          <div className="mt-4 border-t border-line pt-4">
            <DefinitionList
              rows={[
                { label: 'Main Lead', value: p.leadName },
                { label: 'Client', value: p.client },
                { label: 'Started', value: p.startedAt },
                { label: 'Sub-Teams', value: `${teams.length}` },
              ]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6 pb-2">
            <SectionTitle
              title="Scoped Project Tasks"
              description={
                session?.role === 'EMPLOYEE'
                  ? `Showing tasks visible under your ${scope.positionLabel} authority.`
                  : 'All tasks assigned under this project.'
              }
              right={
                scope.canCreateTasks ? (
                  <Button size="sm" variant="secondary" onClick={() => setAddTaskOpen(true)}>
                    <Plus size={14} className="mr-1" /> Delegate task
                  </Button>
                ) : undefined
              }
            />
          </div>
          <ul className="divide-y divide-line">
            {tasks.length === 0 ? (
              <li>
                <EmptyState
                  title="No tasks in your scope for this project"
                  action={
                    scope.canCreateTasks ? (
                      <Button size="sm" onClick={() => setAddTaskOpen(true)}>
                        <Plus size={14} className="mr-1" /> Assign first task
                      </Button>
                    ) : undefined
                  }
                />
              </li>
            ) : (
              tasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <Link to={`/tasks/${t.id}`} className="text-[13px] font-medium text-brand-600 hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted">
                      Assignee: <span className="font-medium text-ink">{t.assigneeName}</span>
                      {t.teamName ? ` · ${t.teamName}` : ''} · due {t.dueDate}
                    </p>
                  </div>
                  <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {editOpen ? (
        <EditProjectDialog
          project={p}
          onClose={() => setEditOpen(false)}
          pending={updateProjectMut.isPending}
          onConfirm={(patch) => updateProjectMut.mutate(patch)}
        />
      ) : null}

      {addTaskOpen ? (
        <CreateTaskDialog
          defaultProjectId={p.id}
          defaultTeamId={defaultTeamId}
          viewer={session}
          onClose={() => setAddTaskOpen(false)}
          pending={createTaskMut.isPending}
          onConfirm={(input) => createTaskMut.mutate(input)}
        />
      ) : null}
    </div>
  )
}
