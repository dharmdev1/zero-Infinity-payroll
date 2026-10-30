import { db } from './demo/store'
import type {
  Project,
  ProjectPosition,
  ProjectStatus,
  ProjectTeam,
  SessionUser,
  TaskPriority,
  TaskStatus,
  WorkTask,
} from '@/types/domain'

export interface TaskListParams {
  assigneeId?: string
  status?: string
  priority?: string
  project?: string
  projectId?: string
  teamId?: string
}

export interface CreateProjectTeamInput {
  id?: string
  name: string
  leadId: string
  memberIds: string[]
}

export interface CreateProjectInput {
  name: string
  code: string
  client: string
  leadId: string
  status?: ProjectStatus
  summary: string
  memberIds?: string[]
  teams?: CreateProjectTeamInput[]
  actor?: string
}

export interface CreateTaskInput {
  title: string
  description: string
  assigneeId: string
  projectId?: string
  teamId?: string
  dueDate: string
  priority: TaskPriority
  status?: TaskStatus
}

export interface ProjectScopeInfo {
  canView: boolean
  canManageProjectStructure: boolean
  canCreateTasks: boolean
  position: ProjectPosition | 'ADMIN' | 'NONE'
  positionLabel: string
  isProjectLead: boolean
  ledTeams: ProjectTeam[]
  memberTeams: ProjectTeam[]
  assignableEmployeeIds: string[]
}

export interface EmployeeProjectAssignmentSummary {
  project: Project
  position: ProjectPosition
  positionLabel: string
  ledTeams: ProjectTeam[]
  memberTeams: ProjectTeam[]
}

function getAllProjectParticipantIds(project: Project): string[] {
  const ids = new Set<string>()
  if (project.leadId) ids.add(project.leadId)
  for (const id of project.memberIds ?? []) ids.add(id)
  for (const team of project.teams ?? []) {
    if (team.leadId) ids.add(team.leadId)
    for (const m of team.memberIds) ids.add(m)
  }
  return Array.from(ids)
}

export function getProjectScope(project: Project, viewer?: SessionUser | null): ProjectScopeInfo {
  const teams = project.teams ?? []
  const allParticipantIds = getAllProjectParticipantIds(project)

  if (!viewer) {
    return {
      canView: true,
      canManageProjectStructure: true,
      canCreateTasks: true,
      position: 'ADMIN',
      positionLabel: 'System Administrator',
      isProjectLead: false,
      ledTeams: teams,
      memberTeams: [],
      assignableEmployeeIds: db.employees.filter((e) => e.status !== 'ARCHIVED' && e.status !== 'TERMINATED').map((e) => e.id),
    }
  }

  const isAdmin = viewer.role === 'SUPER_ADMIN' || viewer.role === 'HR_ADMIN'
  const isProjectLead = project.leadId === viewer.employeeId
  const ledTeams = teams.filter((t) => t.leadId === viewer.employeeId)
  const memberTeams = teams.filter(
    (t) => t.leadId === viewer.employeeId || t.memberIds.includes(viewer.employeeId),
  )
  const isDirectMember = (project.memberIds ?? []).includes(viewer.employeeId)
  const hasAssignedTask = db.tasks.some(
    (t) => t.projectId === project.id && t.assigneeId === viewer.employeeId,
  )

  if (isAdmin) {
    return {
      canView: true,
      canManageProjectStructure: true,
      canCreateTasks: true,
      position: isProjectLead ? 'PROJECT_LEAD' : 'ADMIN',
      positionLabel: isProjectLead
        ? `${viewer.role === 'SUPER_ADMIN' ? 'Super Admin' : 'HR Admin'} · Main Project Lead`
        : viewer.role === 'SUPER_ADMIN'
          ? 'Super Admin Oversight'
          : 'HR Admin Oversight',
      isProjectLead,
      ledTeams: teams,
      memberTeams,
      assignableEmployeeIds:
        allParticipantIds.length > 0
          ? allParticipantIds
          : db.employees.filter((e) => e.status !== 'ARCHIVED' && e.status !== 'TERMINATED').map((e) => e.id),
    }
  }

  if (isProjectLead) {
    return {
      canView: true,
      canManageProjectStructure: false,
      canCreateTasks: true,
      position: 'PROJECT_LEAD',
      positionLabel: 'Main Project Lead',
      isProjectLead: true,
      ledTeams: teams,
      memberTeams,
      assignableEmployeeIds: allParticipantIds,
    }
  }

  if (ledTeams.length > 0) {
    const teamScopeIds = new Set<string>()
    for (const t of ledTeams) {
      teamScopeIds.add(t.leadId)
      for (const m of t.memberIds) teamScopeIds.add(m)
    }
    return {
      canView: true,
      canManageProjectStructure: false,
      canCreateTasks: true,
      position: 'TEAM_LEAD',
      positionLabel: `Team Lead (${ledTeams.map((t) => t.name).join(', ')})`,
      isProjectLead: false,
      ledTeams,
      memberTeams,
      assignableEmployeeIds: Array.from(teamScopeIds),
    }
  }

  if (memberTeams.length > 0 || isDirectMember || hasAssignedTask) {
    return {
      canView: true,
      canManageProjectStructure: false,
      canCreateTasks: false,
      position: 'PROJECT_MEMBER',
      positionLabel:
        memberTeams.length > 0
          ? `Team Member (${memberTeams.map((t) => t.name).join(', ')})`
          : 'Project Member',
      isProjectLead: false,
      ledTeams: [],
      memberTeams,
      assignableEmployeeIds: [],
    }
  }

  return {
    canView: false,
    canManageProjectStructure: false,
    canCreateTasks: false,
    position: 'NONE',
    positionLabel: 'Unassigned',
    isProjectLead: false,
    ledTeams: [],
    memberTeams: [],
    assignableEmployeeIds: [],
  }
}

export function canViewerAccessTask(task: WorkTask, viewer?: SessionUser | null): boolean {
  if (!viewer) return true
  if (viewer.role === 'SUPER_ADMIN' || viewer.role === 'HR_ADMIN') return true
  if (task.assigneeId === viewer.employeeId) return true

  if (task.projectId) {
    const project = db.projects.find((p) => p.id === task.projectId)
    if (project) {
      if (project.leadId === viewer.employeeId) return true
      const ledTeams = (project.teams ?? []).filter((tm) => tm.leadId === viewer.employeeId)
      for (const tm of ledTeams) {
        if (task.teamId === tm.id || tm.memberIds.includes(task.assigneeId) || tm.leadId === task.assigneeId) {
          return true
        }
      }
    }
  }
  return false
}

export function canViewerManageTask(task: WorkTask, viewer?: SessionUser | null): {
  canFullEdit: boolean
  canUpdateStatus: boolean
  canUpdateDeadline: boolean
  assignableEmployeeIds: string[]
} {
  if (!viewer) {
    return {
      canFullEdit: true,
      canUpdateStatus: true,
      canUpdateDeadline: true,
      assignableEmployeeIds: db.employees.map((e) => e.id),
    }
  }

  const project = task.projectId ? db.projects.find((p) => p.id === task.projectId) : undefined
  if (viewer.role === 'SUPER_ADMIN' || viewer.role === 'HR_ADMIN') {
    const ids = project ? getAllProjectParticipantIds(project) : db.employees.map((e) => e.id)
    return {
      canFullEdit: true,
      canUpdateStatus: true,
      canUpdateDeadline: true,
      assignableEmployeeIds: ids.length > 0 ? ids : db.employees.map((e) => e.id),
    }
  }

  if (project && project.leadId === viewer.employeeId) {
    return {
      canFullEdit: true,
      canUpdateStatus: true,
      canUpdateDeadline: true,
      assignableEmployeeIds: getAllProjectParticipantIds(project),
    }
  }

  if (project) {
    const ledTeams = (project.teams ?? []).filter((tm) => tm.leadId === viewer.employeeId)
    const relevantTeam = ledTeams.find(
      (tm) => task.teamId === tm.id || tm.memberIds.includes(task.assigneeId) || tm.leadId === task.assigneeId,
    )
    if (relevantTeam) {
      const teamIds = Array.from(new Set([relevantTeam.leadId, ...relevantTeam.memberIds]))
      return {
        canFullEdit: false,
        canUpdateStatus: true,
        canUpdateDeadline: true,
        assignableEmployeeIds: teamIds,
      }
    }
  }

  if (task.assigneeId === viewer.employeeId) {
    return {
      canFullEdit: false,
      canUpdateStatus: true,
      canUpdateDeadline: false,
      assignableEmployeeIds: [viewer.employeeId],
    }
  }

  return {
    canFullEdit: false,
    canUpdateStatus: false,
    canUpdateDeadline: false,
    assignableEmployeeIds: [],
  }
}

function hydrateTeams(projectId: string, rawTeams: CreateProjectTeamInput[] = []): ProjectTeam[] {
  return rawTeams
    .filter((t) => t.name.trim() && t.leadId)
    .map((t, index) => {
      const lead = db.employees.find((e) => e.id === t.leadId)
      const uniqueMembers = Array.from(new Set(t.memberIds.filter((m) => m && m !== t.leadId)))
      return {
        id: t.id || `TM-${projectId.replace('PRJ-', '')}-${index + 1}`,
        projectId,
        name: t.name.trim(),
        leadId: t.leadId,
        leadName: lead?.name ?? t.leadId,
        memberIds: uniqueMembers,
      }
    })
}

export const taskService = {
  getProjectScope,
  canViewerAccessTask,
  canViewerManageTask,

  getEmployeeProjectPositions(employeeId: string): EmployeeProjectAssignmentSummary[] {
    const summaries: EmployeeProjectAssignmentSummary[] = []
    for (const project of db.projects) {
      const teams = project.teams ?? []
      const isLead = project.leadId === employeeId
      const ledTeams = teams.filter((t) => t.leadId === employeeId)
      const memberTeams = teams.filter((t) => t.leadId === employeeId || t.memberIds.includes(employeeId))
      const isDirect = (project.memberIds ?? []).includes(employeeId)

      if (isLead) {
        summaries.push({
          project,
          position: 'PROJECT_LEAD',
          positionLabel: 'Main Project Lead',
          ledTeams: teams,
          memberTeams,
        })
      } else if (ledTeams.length > 0) {
        summaries.push({
          project,
          position: 'TEAM_LEAD',
          positionLabel: `Team Lead · ${ledTeams.map((t) => t.name).join(', ')}`,
          ledTeams,
          memberTeams,
        })
      } else if (memberTeams.length > 0 || isDirect) {
        summaries.push({
          project,
          position: 'PROJECT_MEMBER',
          positionLabel:
            memberTeams.length > 0
              ? `Member · ${memberTeams.map((t) => t.name).join(', ')}`
              : 'Direct Project Member',
          ledTeams: [],
          memberTeams,
        })
      }
    }
    return summaries
  },

  async list(params: TaskListParams = {}, viewer?: SessionUser | null): Promise<WorkTask[]> {
    return db.tasks.filter((t) => {
      if (!canViewerAccessTask(t, viewer)) return false
      if (params.assigneeId && t.assigneeId !== params.assigneeId) return false
      if (params.status && t.status !== params.status) return false
      if (params.priority && t.priority !== params.priority) return false
      if (params.project && t.projectName !== params.project) return false
      if (params.projectId && t.projectId !== params.projectId) return false
      if (params.teamId && t.teamId !== params.teamId) return false
      return true
    })
  },

  async listMine(employeeId: string, viewer?: SessionUser | null): Promise<WorkTask[]> {
    if (viewer && viewer.role === 'EMPLOYEE' && viewer.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only view their own assigned tasks.')
    }
    return db.tasks.filter((t) => t.assigneeId === employeeId)
  },

  async get(taskId: string, viewer?: SessionUser | null): Promise<WorkTask> {
    const found = db.tasks.find((t) => t.id === taskId)
    if (!found) throw new Error(`Task ${taskId} not found`)
    if (!canViewerAccessTask(found, viewer)) {
      throw new Error('Unauthorized: You do not have permission to view this task.')
    }
    return found
  },

  async create(input: CreateTaskInput, actor?: SessionUser | null): Promise<WorkTask> {
    const emp = db.employees.find((e) => e.id === input.assigneeId)
    if (!emp) throw new Error(`Assignee ${input.assigneeId} not found`)
    const proj = input.projectId ? db.projects.find((p) => p.id === input.projectId) : undefined

    if (actor) {
      const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'HR_ADMIN'
      if (!isAdmin) {
        if (!proj) {
          throw new Error('Unauthorized: Delegated task assignment requires a project context.')
        }
        const scope = getProjectScope(proj, actor)
        if (!scope.canCreateTasks) {
          throw new Error('Unauthorized: Only Project Leads, Team Leads, HR Admins, or Super Admins can create and assign tasks.')
        }
        if (!scope.assignableEmployeeIds.includes(input.assigneeId)) {
          if (scope.position === 'TEAM_LEAD') {
            throw new Error('Unauthorized: Team Leads can only assign tasks to members of their own team.')
          }
          throw new Error('Unauthorized: Project Leads can only assign tasks to members of their project.')
        }
      } else if (proj) {
        const participantIds = getAllProjectParticipantIds(proj)
        if (participantIds.length > 0 && !participantIds.includes(input.assigneeId)) {
          throw new Error('Assignee must be a member or lead of the selected project.')
        }
      }
    }

    let matchedTeam: ProjectTeam | undefined
    if (proj) {
      if (input.teamId) {
        matchedTeam = (proj.teams ?? []).find((tm) => tm.id === input.teamId)
      }
      if (!matchedTeam) {
        matchedTeam = (proj.teams ?? []).find(
          (tm) => tm.leadId === input.assigneeId || tm.memberIds.includes(input.assigneeId),
        )
      }
    }

    const nextNum = db.tasks.length + 101
    const created: WorkTask = {
      id: `TSK-${nextNum}`,
      title: input.title.trim(),
      description: input.description.trim() || 'Task created from workspace.',
      assigneeId: input.assigneeId,
      assigneeName: emp.name,
      projectId: proj?.id,
      projectName: proj?.name,
      teamId: matchedTeam?.id,
      teamName: matchedTeam?.name,
      dueDate: input.dueDate || db.today,
      createdAt: db.today,
      priority: input.priority,
      status: input.status ?? 'TO_DO',
      createdByEmployeeId: actor?.employeeId,
    }
    db.tasks.unshift(created)
    if (proj) {
      proj.taskCount = db.tasks.filter((t) => t.projectId === proj.id).length
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'task.created',
      module: 'Tasks',
      actor: actor?.name ?? 'Admin',
      target: `${created.id} · ${created.title}`,
      newValue: `${created.assigneeName}${created.teamName ? ` (${created.teamName})` : ''}`,
      detail: `Assigned task "${created.title}" to ${created.assigneeName}${proj ? ` under ${proj.name}` : ''}.`,
      at: `${db.today}T11:00:00+05:45`,
    })

    return created
  },

  async update(taskId: string, patch: Partial<WorkTask>, actor?: SessionUser | null): Promise<WorkTask> {
    const idx = db.tasks.findIndex((t) => t.id === taskId)
    if (idx === -1) throw new Error(`Task ${taskId} not found`)
    const current = db.tasks[idx]

    if (actor) {
      const perms = canViewerManageTask(current, actor)
      if (!perms.canUpdateStatus && !perms.canFullEdit) {
        throw new Error('Unauthorized: You cannot modify this task.')
      }
      const isReassigning = patch.assigneeId && patch.assigneeId !== current.assigneeId
      if (isReassigning) {
        if (!perms.assignableEmployeeIds.includes(patch.assigneeId!)) {
          throw new Error('Unauthorized: You can only assign tasks within your authorized project or team scope.')
        }
        if (actor.role === 'EMPLOYEE' && !perms.canFullEdit && !perms.canUpdateDeadline) {
          throw new Error('Unauthorized: Ordinary employees cannot reassign tasks.')
        }
      }
      if (!perms.canFullEdit && !perms.canUpdateDeadline) {
        const illegalKeys = Object.keys(patch).filter((k) => k !== 'status')
        if (illegalKeys.length > 0) {
          throw new Error('Unauthorized: Employees can only update the progress status of their own tasks.')
        }
      }
    }

    const prevAssigneeName = current.assigneeName
    const prevStatus = current.status

    if (patch.assigneeId) {
      const emp = db.employees.find((e) => e.id === patch.assigneeId)
      if (emp) patch.assigneeName = emp.name
    }

    db.tasks[idx] = { ...current, ...patch }
    const updated = db.tasks[idx]

    if (patch.assigneeId && patch.assigneeId !== current.assigneeId) {
      db.auditLogs.unshift({
        id: `AUD-${100 + db.auditLogs.length + 1}`,
        action: 'task.reassigned',
        module: 'Tasks',
        actor: actor?.name ?? 'Admin',
        target: `${updated.id} · ${updated.title}`,
        previousValue: prevAssigneeName,
        newValue: updated.assigneeName,
        detail: `Reassigned task "${updated.title}" from ${prevAssigneeName} to ${updated.assigneeName}.`,
        at: `${db.today}T11:05:00+05:45`,
      })
    } else if (patch.status && patch.status !== prevStatus) {
      db.auditLogs.unshift({
        id: `AUD-${100 + db.auditLogs.length + 1}`,
        action: 'task.status.updated',
        module: 'Tasks',
        actor: actor?.name ?? updated.assigneeName,
        target: `${updated.id} · ${updated.title}`,
        previousValue: prevStatus,
        newValue: updated.status,
        detail: `Updated task status from ${prevStatus} to ${updated.status}.`,
        at: `${db.today}T11:05:00+05:45`,
      })
    }

    return updated
  },

  async projects(viewer?: SessionUser | null): Promise<Project[]> {
    if (!viewer || viewer.role === 'SUPER_ADMIN' || viewer.role === 'HR_ADMIN') {
      return db.projects
    }
    return db.projects.filter((p) => getProjectScope(p, viewer).canView)
  },

  async getProject(projectId: string, viewer?: SessionUser | null): Promise<Project> {
    const found = db.projects.find((p) => p.id === projectId)
    if (!found) throw new Error(`Project ${projectId} not found`)
    if (viewer && !getProjectScope(found, viewer).canView) {
      throw new Error('Unauthorized: You do not have access to this project.')
    }
    return found
  },

  async createProject(input: CreateProjectInput, actor?: SessionUser | null): Promise<Project> {
    if (actor && actor.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can create new projects.')
    }
    const lead = db.employees.find((e) => e.id === input.leadId)
    const nextIdx = db.projects.length + 1
    const id = `PRJ-${String(nextIdx).padStart(2, '0')}`
    const teams = hydrateTeams(id, input.teams ?? [])
    const created: Project = {
      id,
      code: input.code.trim().toUpperCase() || `ZI-${nextIdx}`,
      name: input.name.trim(),
      client: input.client.trim() || 'Internal',
      leadId: input.leadId,
      leadName: lead?.name ?? 'Unassigned',
      status: input.status ?? 'ON_TRACK',
      startedAt: db.today,
      summary: input.summary.trim() || 'Project scope and milestones tracked in workspace.',
      taskCount: 0,
      memberIds: Array.from(new Set(input.memberIds ?? [])),
      teams,
    }
    db.projects.unshift(created)
    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'project.created',
      module: 'Projects',
      actor: actor?.name ?? input.actor ?? lead?.name ?? 'Admin',
      target: `${created.name} (${created.code})`,
      newValue: `Main Lead: ${created.leadName} · ${teams.length} team(s)`,
      detail: `Created project ${created.name} led by ${created.leadName} with ${teams.length} team(s).`,
      at: `${db.today}T10:00:00+05:45`,
    })
    return created
  },

  async updateProject(
    projectId: string,
    patch: Partial<Project> & { rawTeams?: CreateProjectTeamInput[] },
    actor?: SessionUser | null,
  ): Promise<Project> {
    if (actor && actor.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can modify project structure or leads.')
    }
    const idx = db.projects.findIndex((p) => p.id === projectId)
    if (idx === -1) throw new Error(`Project ${projectId} not found`)
    const prev = db.projects[idx]
    const prevLeadName = prev.leadName

    if (patch.leadId) {
      const lead = db.employees.find((e) => e.id === patch.leadId)
      if (lead) patch.leadName = lead.name
    }
    const { rawTeams, ...restPatch } = patch
    const nextTeams = rawTeams !== undefined ? hydrateTeams(projectId, rawTeams) : (restPatch.teams ?? prev.teams ?? [])

    db.projects[idx] = {
      ...prev,
      ...restPatch,
      teams: nextTeams,
    }
    const updated = db.projects[idx]

    if (patch.leadId && patch.leadId !== prev.leadId) {
      db.auditLogs.unshift({
        id: `AUD-${100 + db.auditLogs.length + 1}`,
        action: 'project.lead.changed',
        module: 'Projects',
        actor: actor?.name ?? 'Admin',
        target: `${updated.name} (${updated.code})`,
        previousValue: prevLeadName,
        newValue: updated.leadName,
        detail: `Changed Main Project Lead from ${prevLeadName} to ${updated.leadName}.`,
        at: `${db.today}T10:55:00+05:45`,
      })
    } else {
      db.auditLogs.unshift({
        id: `AUD-${100 + db.auditLogs.length + 1}`,
        action: 'project.updated',
        module: 'Projects',
        actor: actor?.name ?? 'Admin',
        target: `${updated.name} (${updated.code})`,
        newValue: `Main Lead: ${updated.leadName} · ${(updated.teams ?? []).length} team(s)`,
        detail: `Updated project configuration, team leads, and member assignments for ${updated.name}.`,
        at: `${db.today}T10:55:00+05:45`,
      })
    }
    return updated
  },

  async moveTeamMember(input: {
    projectId: string
    employeeId: string
    fromTeamId?: string
    toTeamId: string
    actor?: SessionUser | null
  }): Promise<Project> {
    if (input.actor && input.actor.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can move employees between teams.')
    }
    const project = await this.getProject(input.projectId)
    const teams = (project.teams ?? []).map((t) => ({ ...t, memberIds: [...t.memberIds] }))
    const targetTeam = teams.find((t) => t.id === input.toTeamId)
    if (!targetTeam) throw new Error('Target team not found.')

    for (const team of teams) {
      if (input.fromTeamId ? team.id === input.fromTeamId : team.id !== input.toTeamId) {
        team.memberIds = team.memberIds.filter((id) => id !== input.employeeId)
      }
    }
    if (targetTeam.leadId !== input.employeeId && !targetTeam.memberIds.includes(input.employeeId)) {
      targetTeam.memberIds.push(input.employeeId)
    }

    project.teams = teams
    const emp = db.employees.find((e) => e.id === input.employeeId)

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'project.team_member.moved',
      module: 'Projects',
      actor: input.actor?.name ?? 'Admin',
      target: `${project.name} · ${emp?.name ?? input.employeeId}`,
      newValue: targetTeam.name,
      detail: `Assigned ${emp?.name ?? input.employeeId} to ${targetTeam.name} in ${project.name}.`,
      at: `${db.today}T11:10:00+05:45`,
    })
    return project
  },
}
