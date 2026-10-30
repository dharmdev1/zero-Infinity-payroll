import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderKanban, Network, Plus, ShieldCheck, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, SectionTitle } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { useAuth } from '@/app/auth-context'
import { taskService } from '@/services/tasks'
import type { CreateTaskInput } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { CreateTaskDialog } from '@/modules/projects'

export function ProjectLeadershipWorkspace() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const employeeId = session?.employeeId ?? 'EMP-004'

  const [delegateModal, setDelegateModal] = useState<{
    projectId: string
    teamId?: string
  } | null>(null)

  const positions = taskService.getEmployeeProjectPositions(employeeId)
  const scopedTasksQuery = useQuery({
    queryKey: ['tasks', 'scoped-dashboard', employeeId, session?.role],
    queryFn: () => taskService.list({}, session),
  })

  const createTaskMut = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDelegateModal(null)
    },
  })

  const ledProjects = positions.filter((p) => p.position === 'PROJECT_LEAD')
  const ledTeamEntries = positions.flatMap((p) =>
    p.ledTeams.map((team) => ({ project: p.project, team })),
  )
  const allScopedTasks = scopedTasksQuery.data ?? []

  return (
    <div className="space-y-4">
      {/* Assigned Projects & Team Context */}
      <Card className="p-6">
        <SectionTitle
          title="My Assigned Projects & Team Hierarchy"
          description="Your project and team positions are scoped per project and separate from your system-level role."
          right={
            <Link to="/projects">
              <Button size="sm" variant="secondary">
                <FolderKanban size={14} className="mr-1.5" /> View my projects
              </Button>
            </Link>
          }
        />

        {positions.length === 0 ? (
          <p className="mt-4 text-xs text-muted">You are not currently assigned to any project or team.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {positions.map(({ project, position, positionLabel, memberTeams }) => (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-line bg-surface-soft/50 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      {project.name} ({project.code})
                    </Link>
                    <Badge
                      tone={
                        position === 'PROJECT_LEAD'
                          ? 'purple'
                          : position === 'TEAM_LEAD'
                            ? 'blue'
                            : 'gray'
                      }
                    >
                      {positionLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Main Project Lead: <strong className="text-ink">{project.leadName}</strong> · Client:{' '}
                    {project.client}
                  </p>
                  {memberTeams.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {memberTeams.map((tm) => (
                        <span
                          key={tm.id}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11px] text-ink"
                        >
                          <Users size={11} className="text-brand-600" />
                          <span>Team: {tm.name}</span>
                          <span className="text-muted">· Lead: {tm.leadName}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
                  <Link to={`/projects/${project.id}`} className="font-medium text-brand-600 hover:underline">
                    Open project hierarchy →
                  </Link>
                  {(position === 'PROJECT_LEAD' || position === 'TEAM_LEAD') ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDelegateModal({ projectId: project.id })}
                    >
                      <Plus size={12} className="mr-1" /> Delegate task
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Project Lead Workspace */}
      {ledProjects.length > 0 ? (
        <Card className="p-6">
          <SectionTitle
            title="Project Lead Command Center"
            description="Projects where you serve as Main Project Lead. You can oversee all teams and assign tasks across the project."
          />
          <div className="mt-4 space-y-4">
            {ledProjects.map(({ project }) => {
              const projTasks = allScopedTasks.filter((t) => t.projectId === project.id)
              const completedCount = projTasks.filter((t) => t.status === 'COMPLETED').length
              return (
                <div key={project.id} className="rounded-xl border border-brand-200 bg-brand-50/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-brand-600" />
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-sm font-bold text-ink hover:text-brand-600"
                        >
                          {project.name} ({project.code})
                        </Link>
                        <Badge tone="purple">Main Project Lead</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {(project.teams ?? []).length} team(s) · {projTasks.length} project task(s) ({completedCount}{' '}
                        completed)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setDelegateModal({ projectId: project.id })}
                    >
                      <Plus size={13} className="mr-1" /> Assign project task
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(project.teams ?? []).map((tm) => (
                      <div key={tm.id} className="rounded-lg border border-line bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{tm.name}</span>
                          <Badge tone="blue">Lead: {tm.leadName}</Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          Members:{' '}
                          {tm.memberIds
                            .map((id) => db.employees.find((e) => e.id === id)?.name ?? id)
                            .join(', ') || 'None'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {/* Team Lead Workspace */}
      {ledTeamEntries.length > 0 ? (
        <Card className="p-6">
          <SectionTitle
            title="Team Lead Delegation & Team Tasks"
            description="Teams where you are appointed Team Lead. You can assign tasks to members of your team and track their progress."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ledTeamEntries.map(({ project, team }) => {
              const teamTasks = allScopedTasks.filter(
                (t) =>
                  t.projectId === project.id &&
                  (t.teamId === team.id ||
                    team.memberIds.includes(t.assigneeId) ||
                    t.assigneeId === team.leadId),
              )
              return (
                <div key={team.id} className="flex flex-col justify-between rounded-xl border border-line bg-surface p-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Network size={14} className="text-brand-600" />
                          <span className="text-sm font-semibold text-ink">{team.name}</span>
                          <Badge tone="blue">Team Lead</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          Project: {project.name} ({project.code})
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setDelegateModal({ projectId: project.id, teamId: team.id })
                        }
                      >
                        <Plus size={12} className="mr-1" /> Assign to team
                      </Button>
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Your Team Members ({team.memberIds.length})
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {team.memberIds.map((mId) => {
                          const emp = db.employees.find((e) => e.id === mId)
                          return (
                            <span
                              key={mId}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-soft px-2.5 py-1 text-xs"
                            >
                              <Avatar name={emp?.name ?? mId} size="xs" tone="blue" />
                              <span className="font-medium text-ink">{emp?.name ?? mId}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {teamTasks.length > 0 ? (
                      <div className="mt-3 border-t border-line pt-2.5">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                          Team Tasks ({teamTasks.length})
                        </p>
                        <ul className="space-y-1.5">
                          {teamTasks.slice(0, 3).map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                              <Link to={`/tasks/${t.id}`} className="truncate font-medium text-brand-600 hover:underline">
                                {t.title} ({t.assigneeName})
                              </Link>
                              <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {delegateModal ? (
        <CreateTaskDialog
          defaultProjectId={delegateModal.projectId}
          defaultTeamId={delegateModal.teamId}
          viewer={session}
          onClose={() => setDelegateModal(null)}
          pending={createTaskMut.isPending}
          onConfirm={(input) => createTaskMut.mutate(input)}
        />
      ) : null}
    </div>
  )
}
