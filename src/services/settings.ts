import { db, getActiveSession } from './demo/store'
import { canViewerAccessTask, getProjectScope } from './tasks'
import type { AuditLogEntry, OrgUser, PaginatedResult, SessionUser } from '@/types/domain'
import type { Role } from '@/types/rbac'
import { hasPermission, ROLE_LABELS } from '@/types/rbac'

function countActiveSuperAdmins(excludeUserId?: string): number {
  return db.users.filter(
    (u) => u.id !== excludeUserId && u.role === 'SUPER_ADMIN' && u.status !== 'DISABLED',
  ).length
}

export interface CompanyProfileSettings {
  name: string
  shortName: string
  logoText: string
  logoImageUrl: string | null
  logoTone: 'blue' | 'indigo' | 'emerald' | 'purple' | 'rose' | 'slate'
  timezone: string
  workweek: string
  currency: string
  shift: string
}

const DEFAULT_COMPANY_PROFILE: CompanyProfileSettings = {
  name: 'Zero Infinity Technologies Pvt. Ltd.',
  shortName: 'Zero Infinity',
  logoText: 'Z',
  logoImageUrl: null,
  logoTone: 'blue',
  timezone: 'Asia/Kathmandu (UTC+05:45)',
  workweek: 'Monday–Friday',
  currency: 'Nepalese Rupee (NPR)',
  shift: '09:30 – 17:30 NPT',
}

let currentCompanyProfile: CompanyProfileSettings = { ...DEFAULT_COMPANY_PROFILE }
const companyListeners = new Set<() => void>()

function notifyCompanyListeners() {
  for (const listener of companyListeners) {
    listener()
  }
}

export const settingsService = {
  getCompanyProfile(): CompanyProfileSettings {
    return currentCompanyProfile
  },

  subscribeCompanyProfile(listener: () => void): () => void {
    companyListeners.add(listener)
    return () => {
      companyListeners.delete(listener)
    }
  },

  updateCompanyProfile(
    patch: Partial<CompanyProfileSettings>,
    options: { actor?: string; recordAudit?: boolean; viewer?: SessionUser | null } = {},
  ): CompanyProfileSettings {
    const v = options.viewer !== undefined ? options.viewer : getActiveSession()
    if (!v || !hasPermission(v, 'settings.company')) {
      throw new Error('Unauthorized: You do not have permission to update company profile settings.')
    }
    const prev = currentCompanyProfile
    const nextName = patch.name !== undefined ? patch.name : prev.name
    const derivedShortName =
      patch.shortName !== undefined
        ? patch.shortName
        : patch.name !== undefined
          ? nextName.replace(/\s*(Pvt\.?\s*Ltd\.?|Technologies.*|Inc\.?|LLC)\s*$/i, '').trim() || nextName
          : prev.shortName

    currentCompanyProfile = {
      ...prev,
      ...patch,
      name: nextName,
      shortName: derivedShortName,
      logoText: (patch.logoText !== undefined ? patch.logoText : prev.logoText).slice(0, 3).toUpperCase() || 'Z',
    }

    if (options.recordAudit) {
      db.auditLogs.unshift({
        id: `AUD-${100 + db.auditLogs.length + 1}`,
        action: 'company.profile.updated',
        module: 'Settings',
        actor: options.actor ?? v.name,
        target: currentCompanyProfile.name,
        previousValue: `${prev.name} (Logo: ${prev.logoImageUrl ? 'Image' : prev.logoText})`,
        newValue: `${currentCompanyProfile.name} (Logo: ${currentCompanyProfile.logoImageUrl ? 'Image' : currentCompanyProfile.logoText})`,
        detail: `Updated company profile name to "${currentCompanyProfile.name}" and brand logo.`,
        at: `${db.today}T10:45:00+05:45`,
      })
    }

    notifyCompanyListeners()
    return currentCompanyProfile
  },
  async headcount(): Promise<{ total: number; active: number; probation: number; inactive: number }> {
    const visible = db.employees.filter((e) => e.status !== 'ARCHIVED')
    return {
      total: visible.length,
      active: visible.filter((e) => e.status === 'ACTIVE').length,
      probation: visible.filter((e) => e.status === 'PROBATION').length,
      inactive: visible.filter((e) => e.status === 'INACTIVE' || e.status === 'TERMINATED').length,
    }
  },

  getEmployeeUser(employeeId: string): OrgUser | undefined {
    return db.users.find((u) => u.employeeId === employeeId)
  },

  getEmployeeRole(employeeId: string): Role {
    return db.users.find((u) => u.employeeId === employeeId)?.role ?? 'EMPLOYEE'
  },

  isAccountActive(employeeIdOrUserId: string): { active: boolean; reason?: string; currentRole?: Role } {
    const user =
      db.users.find((u) => u.employeeId === employeeIdOrUserId) ??
      db.users.find((u) => u.id === employeeIdOrUserId)
    const empId = user?.employeeId ?? employeeIdOrUserId
    const emp = db.employees.find((e) => e.id === empId)

    if (emp) {
      if (emp.status === 'TERMINATED') {
        return {
          active: false,
          reason: `Employment terminated${emp.terminatedAt ? ` on ${emp.terminatedAt}` : ''}. Access has been revoked.`,
          currentRole: user?.role ?? 'EMPLOYEE',
        }
      }
      if (emp.status === 'ARCHIVED') {
        return {
          active: false,
          reason: 'Employee record is archived. Access is permanently disabled.',
          currentRole: user?.role ?? 'EMPLOYEE',
        }
      }
      if (emp.status === 'INACTIVE') {
        return {
          active: false,
          reason: 'Employee account is currently deactivated.',
          currentRole: user?.role ?? 'EMPLOYEE',
        }
      }
    }

    if (user && user.status === 'DISABLED') {
      return {
        active: false,
        reason: 'Workspace user account is disabled.',
        currentRole: user.role,
      }
    }

    return {
      active: true,
      currentRole: user?.role ?? 'EMPLOYEE',
    }
  },

  async users(
    search = '',
    page = 1,
    pageSize = 10,
    viewer?: SessionUser | null,
  ): Promise<PaginatedResult<OrgUser>> {
    const v = viewer !== undefined ? viewer : getActiveSession()
    if (!v || !hasPermission(v, 'settings.users')) {
      throw new Error('Unauthorized: You do not have permission to view workspace users.')
    }
    const q = search.trim().toLowerCase()
    const filtered = db.users.filter((u) => (!q ? true : `${u.name} ${u.email} ${u.role} ${u.employeeId ?? ''}`.toLowerCase().includes(q)))
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async assignEmployeeRole(input: {
    employeeId: string
    role: Role
    status?: OrgUser['status']
    reason: string
    actor?: string
    actorRole?: Role
  }): Promise<OrgUser> {
    const actorRole = input.actorRole ?? getActiveSession()?.role
    if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admin can assign, change, or remove system-level roles.')
    }

    const emp = db.employees.find((e) => e.id === input.employeeId)
    if (!emp) throw new Error(`Employee ${input.employeeId} not found`)

    let user = db.users.find((u) => u.employeeId === emp.id)
    const previousRole = user?.role ?? 'EMPLOYEE'
    const nextStatus = input.status ?? user?.status ?? 'ACTIVE'

    if (
      user &&
      user.role === 'SUPER_ADMIN' &&
      (input.role !== 'SUPER_ADMIN' || nextStatus === 'DISABLED') &&
      countActiveSuperAdmins(user.id) === 0
    ) {
      throw new Error('Cannot demote or disable the last active Super Admin.')
    }

    if (user) {
      user.role = input.role
      if (input.status) user.status = input.status
      user.lastActiveAt = `${db.today}T10:15:00+05:45`
    } else {
      user = {
        id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
        name: emp.name,
        email: emp.workEmail,
        employeeId: emp.id,
        role: input.role,
        status: nextStatus,
        lastActiveAt: `${db.today}T10:15:00+05:45`,
      }
      db.users.unshift(user)
    }

    const demoSession = db.demoSessions.find((s) => s.employeeId === emp.id)
    if (demoSession) {
      demoSession.role = input.role
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'user.role.assigned',
      module: 'Settings',
      actor: input.actor ?? getActiveSession()?.name ?? 'Super Admin',
      target: `${emp.name} (${emp.id})`,
      previousValue: ROLE_LABELS[previousRole],
      newValue: ROLE_LABELS[input.role],
      reason: input.reason,
      detail: `Changed system role from ${ROLE_LABELS[previousRole]} to ${ROLE_LABELS[input.role]} (status: ${user.status}). Reason: ${input.reason}`,
      at: `${db.today}T10:15:00+05:45`,
    })

    return user
  },

  async updateUser(
    userId: string,
    patch: {
      role: Role
      status: OrgUser['status']
      employeeId?: string | null
      reason?: string
      actor?: string
      actorRole?: Role
    },
  ): Promise<OrgUser> {
    const actorRole = patch.actorRole ?? getActiveSession()?.role
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can update user access.')
    }

    const idx = db.users.findIndex((u) => u.id === userId)
    if (idx === -1) throw new Error(`User ${userId} not found`)
    const prev = db.users[idx]

    if (actorRole !== 'SUPER_ADMIN') {
      if (patch.role !== prev.role) {
        throw new Error('Only Super Admin can change system-level roles.')
      }
      if (prev.role === 'SUPER_ADMIN' || prev.role === 'HR_ADMIN') {
        throw new Error('HR Admin cannot modify Super Admin or HR Admin accounts.')
      }
    }

    if (
      prev.role === 'SUPER_ADMIN' &&
      (patch.role !== 'SUPER_ADMIN' || patch.status === 'DISABLED') &&
      countActiveSuperAdmins(prev.id) === 0
    ) {
      throw new Error('Cannot demote or disable the last active Super Admin.')
    }

    const updated: OrgUser = {
      ...prev,
      role: patch.role,
      status: patch.status,
      employeeId: patch.employeeId !== undefined ? patch.employeeId : prev.employeeId,
    }
    db.users[idx] = updated

    if (updated.employeeId) {
      const demoSession = db.demoSessions.find((s) => s.employeeId === updated.employeeId)
      if (demoSession) demoSession.role = updated.role
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'user.access.updated',
      module: 'Settings',
      actor: patch.actor ?? getActiveSession()?.name ?? 'Admin',
      target: `${updated.name} (${updated.id})`,
      previousValue: `${ROLE_LABELS[prev.role]} · ${prev.status}`,
      newValue: `${ROLE_LABELS[updated.role]} · ${updated.status}`,
      reason: patch.reason,
      detail: `Updated role to ${ROLE_LABELS[updated.role]} and status to ${updated.status}.${patch.reason ? ` Reason: ${patch.reason}` : ''}`,
      at: `${db.today}T10:20:00+05:45`,
    })

    return updated
  },

  async inviteUser(input: {
    name: string
    email: string
    employeeId: string | null
    role: Role
    actor?: string
    actorRole?: Role
  }): Promise<OrgUser> {
    const actorRole = input.actorRole ?? getActiveSession()?.role
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can invite users.')
    }
    if (actorRole !== 'SUPER_ADMIN' && input.role !== 'EMPLOYEE') {
      throw new Error('Only Super Admin can invite users with HR Admin or Super Admin system roles.')
    }

    const existing = input.employeeId ? db.users.find((u) => u.employeeId === input.employeeId) : undefined
    if (existing) {
      if (actorRole !== 'SUPER_ADMIN' && existing.role !== input.role) {
        throw new Error('Only Super Admin can change system-level roles.')
      }
      existing.role = input.role
      existing.status = 'ACTIVE'
      return existing
    }
    const created: OrgUser = {
      id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      employeeId: input.employeeId || null,
      role: input.role,
      status: 'INVITED',
      lastActiveAt: `${db.today}T10:30:00+05:45`,
    }
    db.users.unshift(created)

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'user.invited',
      module: 'Settings',
      actor: input.actor ?? getActiveSession()?.name ?? 'Admin',
      target: `${created.name} (${created.email})`,
      newValue: ROLE_LABELS[created.role],
      detail: `Invited workspace user with role ${ROLE_LABELS[created.role]}${created.employeeId ? ` linked to ${created.employeeId}` : ''}.`,
      at: `${db.today}T10:30:00+05:45`,
    })

    return created
  },

  async audit(
    params: { search?: string; module?: string; page?: number; pageSize?: number } = {},
    viewer?: SessionUser | null,
  ): Promise<PaginatedResult<AuditLogEntry>> {
    const v = viewer !== undefined ? viewer : getActiveSession()
    if (!v || !hasPermission(v, 'settings.audit')) {
      throw new Error('Unauthorized: You do not have permission to view audit logs.')
    }
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 15
    const q = (params.search ?? '').trim().toLowerCase()
    const filtered = db.auditLogs.filter((l) => {
      if (params.module && l.module !== params.module) return false
      if (q && !`${l.action} ${l.actor} ${l.target} ${l.detail} ${l.reason ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async searchEverything(term: string, viewer?: SessionUser | null): Promise<Array<{ label: string; to: string }>> {
    const v = viewer !== undefined ? viewer : getActiveSession()
    const q = term.trim().toLowerCase()
    if (!q || !v) return []
    const canViewAdminTasks = hasPermission(v, 'tasks.view')
    const canViewAdminProjects = hasPermission(v, 'projects.view')
    const results: Array<{ label: string; to: string }> = []

    for (const e of db.employees) {
      if (e.status === 'ARCHIVED') continue
      if (v.role === 'EMPLOYEE' && e.status === 'TERMINATED') continue
      if (`${e.name} ${e.id} ${e.department}`.toLowerCase().includes(q)) {
        results.push({
          label: `Employee · ${e.name} (${e.id})`,
          to: `/employees/${e.id}`,
        })
      }
    }
    for (const t of db.tasks) {
      if (!canViewerAccessTask(t, v)) continue
      if (t.title.toLowerCase().includes(q)) {
        results.push({
          label: `Task · ${t.title}`,
          to: canViewAdminTasks ? `/tasks/${t.id}` : '/my/tasks',
        })
      }
    }
    for (const p of db.projects) {
      if (!getProjectScope(p, v).canView) continue
      if (`${p.name} ${p.code}`.toLowerCase().includes(q)) {
        results.push({
          label: `Project · ${p.name}`,
          to: canViewAdminProjects ? `/projects/${p.id}` : '/my/tasks',
        })
      }
    }
    return results.slice(0, 6)
  },
}

