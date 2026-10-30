import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge, Button, InfoNote } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { SelectInput, TextArea, TextInput } from '@/components/ui/form'
import { db } from '@/services/demo/store'
import { getProjectScope } from '@/services/tasks'
import type { CreateProjectInput, CreateProjectTeamInput, CreateTaskInput } from '@/services/tasks'
import type { Project, ProjectStatus, SessionUser, TaskPriority, TaskStatus } from '@/types/domain'

function TeamBuilderSection({
  teams,
  setTeams,
  directMemberIds,
  setDirectMemberIds,
  activeEmployees,
}: {
  teams: CreateProjectTeamInput[]
  setTeams: (next: CreateProjectTeamInput[]) => void
  directMemberIds: string[]
  setDirectMemberIds: (next: string[]) => void
  activeEmployees: typeof db.employees
}) {
  const addTeam = () => {
    const defaultLead = activeEmployees[0]?.id ?? 'EMP-004'
    setTeams([
      ...teams,
      {
        name: `Team ${teams.length + 1}`,
        leadId: defaultLead,
        memberIds: [],
      },
    ])
  }

  const updateTeam = (idx: number, patch: Partial<CreateProjectTeamInput>) => {
    setTeams(teams.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  const removeTeam = (idx: number) => {
    setTeams(teams.filter((_, i) => i !== idx))
  }

  const toggleTeamMember = (teamIdx: number, empId: string) => {
    const team = teams[teamIdx]
    if (!team) return
    const exists = team.memberIds.includes(empId)
    const nextMembers = exists ? team.memberIds.filter((id) => id !== empId) : [...team.memberIds, empId]
    updateTeam(teamIdx, { memberIds: nextMembers })
  }

  const toggleDirectMember = (empId: string) => {
    const exists = directMemberIds.includes(empId)
    setDirectMemberIds(exists ? directMemberIds.filter((id) => id !== empId) : [...directMemberIds, empId])
  }

  return (
    <div className="space-y-4 border-t border-line pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink">Project Teams & Sub-Leads</p>
          <p className="text-[11.5px] text-muted">Create teams under this project, assign Team Leads, and select team members.</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={addTeam}>
          <Plus size={13} className="mr-1" /> Add team
        </Button>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-muted">
          No sub-teams configured yet. Click &ldquo;Add team&rdquo; to create Team 1, Team 2, and assign Team Leads.
        </p>
      ) : (
        <div className="space-y-3">
          {teams.map((team, idx) => (
            <div key={team.id ?? idx} className="space-y-3 rounded-xl border border-line bg-surface-soft/50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="blue">Team {idx + 1}</Badge>
                <button
                  type="button"
                  onClick={() => removeTeam(idx)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-danger-600 hover:underline"
                >
                  <Trash2 size={12} /> Remove team
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Team name"
                  required
                  value={team.name}
                  onChange={(e) => updateTeam(idx, { name: e.target.value })}
                />
                <SelectInput
                  label="Team Lead (Project Position)"
                  value={team.leadId}
                  onChange={(e) => updateTeam(idx, { leadId: e.target.value })}
                  options={activeEmployees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.name} (${emp.department})`,
                  }))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink">Team members</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeEmployees
                    .filter((emp) => emp.id !== team.leadId)
                    .map((emp) => {
                      const selected = team.memberIds.includes(emp.id)
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggleTeamMember(idx, emp.id)}
                          className={[
                            'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                            selected
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-line bg-white text-muted hover:border-brand-200 hover:text-ink',
                          ].join(' ')}
                        >
                          {selected ? '✓ ' : '+ '}
                          {emp.name}
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-ink">Direct Project Members (Unassigned to a specific sub-team)</p>
        <p className="mb-2 text-[11px] text-muted">Employees working directly under the Main Project Lead.</p>
        <div className="flex flex-wrap gap-1.5">
          {activeEmployees.map((emp) => {
            const selected = directMemberIds.includes(emp.id)
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggleDirectMember(emp.id)}
                className={[
                  'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  selected
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-line bg-white text-muted hover:border-brand-200 hover:text-ink',
                ].join(' ')}
              >
                {selected ? '✓ ' : '+ '}
                {emp.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CreateProjectDialog({
  onClose,
  pending,
  onConfirm,
}: {
  onClose: () => void
  pending: boolean
  onConfirm: (input: CreateProjectInput) => void
}) {
  const activeEmployees = db.employees.filter(
    (e) => e.status !== 'INACTIVE' && e.status !== 'TERMINATED' && e.status !== 'ARCHIVED',
  )
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [client, setClient] = useState('')
  const [leadId, setLeadId] = useState(activeEmployees[0]?.id ?? 'EMP-001')
  const [status, setStatus] = useState<ProjectStatus>('ON_TRACK')
  const [summary, setSummary] = useState('')
  const [directMemberIds, setDirectMemberIds] = useState<string[]>([])
  const [teams, setTeams] = useState<CreateProjectTeamInput[]>([
    {
      name: 'Core Delivery Team',
      leadId: activeEmployees[3]?.id ?? activeEmployees[0]?.id ?? 'EMP-004',
      memberIds: activeEmployees[7] ? [activeEmployees[7].id] : [],
    },
  ])
  const [error, setError] = useState('')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!code.trim() && val.trim().length >= 2) {
      const prefix = val
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 4)
      setCode(`${prefix || 'PRJ'}-${db.projects.length + 1}`)
    }
  }

  const submit = () => {
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    if (!client.trim()) {
      setError('Client or department sponsor is required.')
      return
    }
    if (!leadId) {
      setError('Please select a Main Project Lead.')
      return
    }
    setError('')
    onConfirm({
      name: name.trim(),
      code: code.trim() || `ZI-${db.projects.length + 1}`,
      client: client.trim(),
      leadId,
      status,
      summary: summary.trim() || `${name.trim()} delivery and milestone tracking.`,
      memberIds: directMemberIds,
      teams,
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Create new project & team hierarchy"
      description="Assign a Main Project Lead, create multiple teams with Team Leads, and assign project members."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Create project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <TextInput
              label="Project name"
              required
              placeholder="e.g. Website Development Project"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div>
            <TextInput
              label="Project code"
              required
              placeholder="e.g. WDP-04"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Client / Sponsor"
            required
            placeholder="e.g. Himalayan Bank / Internal"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <SelectInput
            label="Initial status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            options={[
              { value: 'ON_TRACK', label: 'On track' },
              { value: 'AT_RISK', label: 'At risk' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
        </div>

        <SelectInput
          label="Main Project Lead (Oversees entire project & teams)"
          required
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={activeEmployees.map((e) => ({
            value: e.id,
            label: `${e.name} · ${e.jobTitle} (${e.department})`,
          }))}
        />

        <TextArea
          label="Project summary & scope"
          placeholder="Outline key deliverables, sprint goals, and team responsibilities..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <TeamBuilderSection
          teams={teams}
          setTeams={setTeams}
          directMemberIds={directMemberIds}
          setDirectMemberIds={setDirectMemberIds}
          activeEmployees={activeEmployees}
        />
      </div>
    </Dialog>
  )
}

export function EditProjectDialog({
  project,
  onClose,
  pending,
  onConfirm,
}: {
  project: Project
  onClose: () => void
  pending: boolean
  onConfirm: (patch: Partial<Project> & { rawTeams?: CreateProjectTeamInput[] }) => void
}) {
  const activeEmployees = db.employees.filter(
    (e) => e.status !== 'INACTIVE' && e.status !== 'TERMINATED' && e.status !== 'ARCHIVED',
  )
  const [name, setName] = useState(project.name)
  const [client, setClient] = useState(project.client)
  const [leadId, setLeadId] = useState(project.leadId)
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [summary, setSummary] = useState(project.summary)
  const [directMemberIds, setDirectMemberIds] = useState<string[]>(project.memberIds ?? [])
  const [teams, setTeams] = useState<CreateProjectTeamInput[]>(
    (project.teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      leadId: t.leadId,
      memberIds: [...t.memberIds],
    })),
  )
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) {
      setError('Project name cannot be empty.')
      return
    }
    setError('')
    onConfirm({
      name: name.trim(),
      client: client.trim() || project.client,
      leadId,
      status,
      summary: summary.trim(),
      memberIds: directMemberIds,
      rawTeams: teams,
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Edit project hierarchy, leads & teams"
      description={`Configure Main Project Lead, teams, Team Leads, and members for ${project.code}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <TextInput label="Project name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Client / Sponsor" value={client} onChange={(e) => setClient(e.target.value)} />
          <SelectInput
            label="Project status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            options={[
              { value: 'ON_TRACK', label: 'On track' },
              { value: 'AT_RISK', label: 'At risk' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
        </div>
        <SelectInput
          label="Main Project Lead"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={activeEmployees.map((e) => ({
            value: e.id,
            label: `${e.name} · ${e.jobTitle} (${e.department})`,
          }))}
        />
        <TextArea label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />

        <TeamBuilderSection
          teams={teams}
          setTeams={setTeams}
          directMemberIds={directMemberIds}
          setDirectMemberIds={setDirectMemberIds}
          activeEmployees={activeEmployees}
        />
      </div>
    </Dialog>
  )
}

export function CreateTaskDialog({
  defaultProjectId,
  defaultTeamId,
  defaultAssigneeId,
  viewer,
  onClose,
  pending,
  onConfirm,
}: {
  defaultProjectId?: string
  defaultTeamId?: string
  defaultAssigneeId?: string
  viewer?: SessionUser | null
  onClose: () => void
  pending: boolean
  onConfirm: (input: CreateTaskInput) => void
}) {
  const manageableProjects = useMemo(
    () => db.projects.filter((p) => getProjectScope(p, viewer).canCreateTasks),
    [viewer],
  )

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? manageableProjects[0]?.id ?? db.projects[0]?.id ?? '',
  )
  const selectedProject = useMemo(
    () => db.projects.find((p) => p.id === projectId),
    [projectId],
  )
  const projectScope = useMemo(
    () => (selectedProject ? getProjectScope(selectedProject, viewer) : null),
    [selectedProject, viewer],
  )

  const assignableEmployees = useMemo(() => {
    const active = db.employees.filter(
      (e) => e.status !== 'INACTIVE' && e.status !== 'TERMINATED' && e.status !== 'ARCHIVED',
    )
    if (!projectScope) return active
    return active.filter((e) => projectScope.assignableEmployeeIds.includes(e.id))
  }, [projectScope])

  const [teamId, setTeamId] = useState(
    defaultTeamId ?? projectScope?.ledTeams[0]?.id ?? '',
  )
  const [assigneeId, setAssigneeId] = useState(
    defaultAssigneeId && assignableEmployees.some((e) => e.id === defaultAssigneeId)
      ? defaultAssigneeId
      : (assignableEmployees[0]?.id ?? ''),
  )
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [status, setStatus] = useState<TaskStatus>('TO_DO')
  const [dueDate, setDueDate] = useState(db.today)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleProjectChange = (nextProjectId: string) => {
    setProjectId(nextProjectId)
    const nextProj = db.projects.find((p) => p.id === nextProjectId)
    if (nextProj) {
      const nextScope = getProjectScope(nextProj, viewer)
      setTeamId(nextScope.ledTeams[0]?.id ?? '')
      const firstEmp = db.employees.find((e) => nextScope.assignableEmployeeIds.includes(e.id))
      if (firstEmp) setAssigneeId(firstEmp.id)
    }
  }

  const submit = () => {
    if (!title.trim()) {
      setError('Task title is required.')
      return
    }
    if (!projectId && viewer?.role === 'EMPLOYEE') {
      setError('Please select a project within your leadership scope.')
      return
    }
    if (!assigneeId) {
      setError('Please select an authorized assignee.')
      return
    }
    setError('')
    onConfirm({
      title: title.trim(),
      description: description.trim() || 'Assigned via workspace project management.',
      assigneeId,
      projectId: projectId || undefined,
      teamId: teamId || undefined,
      dueDate: dueDate || db.today,
      priority,
      status,
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Create & delegate task"
      description={
        projectScope
          ? `Delegating as ${projectScope.positionLabel}. Assignable scope is restricted to your authorized project/team members.`
          : 'Assign a deliverable to an employee and link it to a project.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Assign task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        {projectScope ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs text-brand-700">
            Authority scope: <strong>{projectScope.positionLabel}</strong> ({assignableEmployees.length} eligible assignee{assignableEmployees.length === 1 ? '' : 's'})
          </div>
        ) : null}

        <TextInput
          label="Task title"
          required
          placeholder="e.g. Implement role-based access audit export"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectInput
            label="Project"
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            options={manageableProjects.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.code})`,
            }))}
          />
          <SelectInput
            label="Assignee (Scoped to your authority)"
            required
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={assignableEmployees.map((e) => ({
              value: e.id,
              label: `${e.name} (${e.department})`,
            }))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectInput
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
          <SelectInput
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { value: 'TO_DO', label: 'To do' },
              { value: 'IN_PROGRESS', label: 'In progress' },
              { value: 'REVIEW', label: 'In review' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
          <TextInput
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <TextArea
          label="Description"
          placeholder="Add acceptance criteria, links, or notes for the assignee..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </Dialog>
  )
}
