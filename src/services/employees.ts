import { db, getActiveSession } from './demo/store'
import type { Employee, EmployeeDocument, EmploymentStatus, PaginatedResult, SessionUser } from '@/types/domain'
import type { Role } from '@/types/rbac'

export interface EmployeeListParams {
  search?: string
  department?: string
  status?: string
  includeArchived?: boolean
  page?: number
  pageSize?: number
}

function resolveViewer(viewer?: SessionUser | null): SessionUser | null {
  return viewer !== undefined ? viewer : getActiveSession()
}

function resolveActorRole(role?: Role): Role | undefined {
  return role !== undefined ? role : getActiveSession()?.role
}

function getTargetSystemRole(employeeId: string): Role {
  return db.users.find((u) => u.employeeId === employeeId)?.role ?? 'EMPLOYEE'
}

function countActiveSuperAdmins(): number {
  return db.users.filter((u) => {
    if (u.role !== 'SUPER_ADMIN' || u.status === 'DISABLED') return false
    if (u.employeeId) {
      const emp = db.employees.find((e) => e.id === u.employeeId)
      if (emp && (emp.status === 'INACTIVE' || emp.status === 'TERMINATED' || emp.status === 'ARCHIVED')) {
        return false
      }
    }
    return true
  }).length
}

export function redactEmployeeForViewer(employee: Employee, viewer?: SessionUser | null): Employee {
  const v = resolveViewer(viewer)
  if (v && (v.role === 'SUPER_ADMIN' || v.role === 'HR_ADMIN' || v.employeeId === employee.id)) {
    return employee
  }
  return {
    ...employee,
    personalEmail: 'Protected (HR only)',
    phone: 'Protected (HR only)',
    dateOfBirth: 'Protected',
    address: 'Protected (HR only)',
    emergencyContactName: 'Protected',
    emergencyContactRelationship: 'Protected',
    emergencyContactPhone: 'Protected',
  }
}

export const employeeService = {
  async list(params: EmployeeListParams = {}, viewer?: SessionUser | null): Promise<PaginatedResult<Employee>> {
    const v = resolveViewer(viewer)
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const q = (params.search ?? '').trim().toLowerCase()
    const filtered = db.employees.filter((e) => {
      if (!params.includeArchived && !params.status && e.status === 'ARCHIVED') return false
      if ((!v || v.role === 'EMPLOYEE') && (e.status === 'ARCHIVED' || e.status === 'TERMINATED')) return false
      if (params.department && e.department !== params.department) return false
      if (params.status && e.status !== params.status) return false
      if (q && !`${e.name} ${e.id} ${e.workEmail} ${e.department} ${e.jobTitle}`.toLowerCase().includes(q)) return false
      return true
    })
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize).map((e) => redactEmployeeForViewer(e, v)),
      total: filtered.length,
      page,
      pageSize,
    }
  },

  async get(employeeId: string, viewer?: SessionUser | null): Promise<Employee> {
    const v = resolveViewer(viewer)
    const found = db.employees.find((e) => e.id === employeeId)
    if (!found) throw new Error(`Employee ${employeeId} not found`)
    return redactEmployeeForViewer(found, v)
  },

  async create(
    input: Omit<Employee, 'id' | 'status'> & { systemRole?: Role; actor?: string; actorRole?: Role },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(input.actorRole)
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can create employee records.')
    }
    const requestedRole = input.systemRole ?? 'EMPLOYEE'
    if (actorRole !== 'SUPER_ADMIN' && requestedRole !== 'EMPLOYEE') {
      throw new Error('Unauthorized: Only a Super Admin can create HR Admin or Super Admin accounts.')
    }

    const nextNum = db.employees.length + 1
    const { systemRole: _role, actor, actorRole: _actorRole, ...empFields } = input
    const created: Employee = {
      ...empFields,
      id: `EMP-${String(nextNum).padStart(3, '0')}`,
      status: 'PROBATION',
      avatarTone: 'blue',
    }
    db.employees.unshift(created)

    const userRecord = {
      id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
      name: created.name,
      email: created.workEmail,
      employeeId: created.id,
      role: requestedRole,
      status: 'ACTIVE' as const,
      lastActiveAt: `${db.today}T10:00:00+05:45`,
    }
    db.users.unshift(userRecord)

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.created',
      module: 'Employees',
      actor: actor ?? getActiveSession()?.name ?? 'Admin',
      target: `${created.name} (${created.id})`,
      newValue: `${created.status} · ${requestedRole}`,
      detail: `Created employee record for ${created.name} (${created.department}) with system role ${requestedRole}.`,
      at: `${db.today}T10:00:00+05:45`,
    })
    return created
  },

  async update(employeeId: string, patch: Partial<Employee>, actor?: SessionUser | null): Promise<Employee> {
    const v = resolveViewer(actor)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to update employee profiles.')
    }
    if (v.role === 'EMPLOYEE' && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees cannot modify other employee profiles.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (v.role === 'HR_ADMIN' && v.employeeId !== employeeId && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new Error('Unauthorized: HR Admin cannot modify HR Admin or Super Admin profiles.')
    }
    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    db.employees[idx] = { ...db.employees[idx], ...patch }
    return db.employees[idx]
  },

  async changeStatus(
    employeeId: string,
    status: Extract<EmploymentStatus, 'ACTIVE' | 'PROBATION'>,
    reason: string,
    actor?: { name?: string; role?: Role },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(actor?.role)
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can change employee status.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (actorRole === 'HR_ADMIN' && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new Error('Unauthorized: HR Admin cannot modify the status of HR Admin or Super Admin accounts.')
    }
    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    const prev = db.employees[idx]
    if (prev.status === 'TERMINATED' || prev.status === 'INACTIVE' || prev.status === 'ARCHIVED') {
      throw new Error(
        'Cannot change status of a terminated, deactivated, or archived employee directly. Use Reactivate Account first.',
      )
    }

    const emp: Employee = {
      ...prev,
      status,
      deactivationReason: undefined,
    }
    db.employees[idx] = emp

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.status.changed',
      module: 'Employees',
      actor: actor?.name ?? getActiveSession()?.name ?? 'Admin',
      target: `${emp.name} (${employeeId})`,
      previousValue: prev.status,
      newValue: status,
      reason,
      detail: `Changed employment status from ${prev.status} to ${status} · reason: ${reason}`,
      at: `${db.today}T10:25:00+05:45`,
    })
    return emp
  },

  async terminate(
    employeeId: string,
    options: {
      reason: string
      terminationDate?: string
      actor?: string
      actorRole?: Role
    },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(options.actorRole)
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can terminate accounts.')
    }
    if (!options.reason.trim()) {
      throw new Error('A termination reason is required.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (actorRole === 'HR_ADMIN' && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new Error('Unauthorized: HR Admin can only terminate ordinary Employee accounts, not HR Admins or Super Admins.')
    }
    if (targetRole === 'SUPER_ADMIN' && countActiveSuperAdmins() <= 1) {
      throw new Error('Cannot terminate the last active Super Admin account.')
    }

    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    const prev = db.employees[idx]
    const terminatedAt = options.terminationDate || db.today
    const emp: Employee = {
      ...prev,
      status: 'TERMINATED',
      terminatedAt,
      terminationReason: options.reason.trim(),
    }
    db.employees[idx] = emp

    const user = db.users.find((u) => u.employeeId === employeeId)
    if (user) {
      user.status = 'DISABLED'
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.terminated',
      module: 'Employees',
      actor: options.actor ?? getActiveSession()?.name ?? 'Admin',
      target: `${emp.name} (${employeeId})`,
      previousValue: prev.status,
      newValue: 'TERMINATED',
      reason: options.reason.trim(),
      detail: `Terminated employment effective ${terminatedAt} and disabled login access. Historical payroll, attendance, leave, and task records preserved. Reason: ${options.reason.trim()}`,
      at: `${db.today}T10:35:00+05:45`,
    })
    return emp
  },

  async deactivate(
    employeeId: string,
    reason: string,
    actor?: { name?: string; role?: Role },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(actor?.role)
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can deactivate accounts.')
    }
    if (!reason.trim()) {
      throw new Error('A deactivation reason is required.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (actorRole === 'HR_ADMIN' && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new Error('Unauthorized: HR Admin cannot deactivate another HR Admin or Super Admin.')
    }
    if (targetRole === 'SUPER_ADMIN' && countActiveSuperAdmins() <= 1) {
      throw new Error('Cannot deactivate the last active Super Admin account.')
    }

    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    const prev = db.employees[idx]
    const emp: Employee = {
      ...prev,
      status: 'INACTIVE',
      deactivationReason: reason.trim(),
    }
    db.employees[idx] = emp

    const user = db.users.find((u) => u.employeeId === employeeId)
    if (user) {
      user.status = 'DISABLED'
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.deactivated',
      module: 'Employees',
      actor: actor?.name ?? getActiveSession()?.name ?? 'Admin',
      target: `${emp.name} (${employeeId})`,
      previousValue: prev.status,
      newValue: 'INACTIVE',
      reason: reason.trim(),
      detail: `Temporarily deactivated account and suspended login access · reason: ${reason.trim()}`,
      at: `${db.today}T10:40:00+05:45`,
    })
    return emp
  },

  async reactivate(
    employeeId: string,
    reason: string,
    actor?: { name?: string; role?: Role },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(actor?.role)
    if (!actorRole || actorRole === 'EMPLOYEE') {
      throw new Error('Unauthorized: Only HR Admin or Super Admin can reactivate accounts.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (actorRole === 'HR_ADMIN' && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new Error('Unauthorized: HR Admin cannot reactivate an HR Admin or Super Admin account.')
    }

    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    const prev = db.employees[idx]
    if (prev.status === 'ARCHIVED' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only a Super Admin can reactivate an archived employee account.')
    }

    const emp: Employee = {
      ...prev,
      status: 'ACTIVE',
      deactivationReason: undefined,
      terminatedAt: undefined,
      terminationReason: undefined,
      archivedAt: undefined,
      archiveReason: undefined,
    }
    db.employees[idx] = emp

    const user = db.users.find((u) => u.employeeId === employeeId)
    if (user) {
      user.status = 'ACTIVE'
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.reactivated',
      module: 'Employees',
      actor: actor?.name ?? getActiveSession()?.name ?? 'Admin',
      target: `${emp.name} (${employeeId})`,
      previousValue: prev.status,
      newValue: 'ACTIVE',
      reason: reason.trim() || 'Authorized reactivation',
      detail: `Reactivated employee account and restored workspace login · reason: ${reason.trim() || 'Authorized reactivation'}`,
      at: `${db.today}T10:45:00+05:45`,
    })
    return emp
  },

  async deletePermanently(
    employeeId: string,
    reason: string,
    actor?: { name?: string; role?: Role },
  ): Promise<Employee> {
    const actorRole = resolveActorRole(actor?.role)
    if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only a Super Admin can remove/archive an employee account.')
    }
    if (!reason.trim()) {
      throw new Error('An archival reason is required.')
    }
    const targetRole = getTargetSystemRole(employeeId)
    if (targetRole === 'SUPER_ADMIN' && countActiveSuperAdmins() <= 1) {
      throw new Error('Cannot archive or remove the last active Super Admin account.')
    }

    const idx = db.employees.findIndex((e) => e.id === employeeId)
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`)
    const prev = db.employees[idx]
    const emp: Employee = {
      ...prev,
      status: 'ARCHIVED',
      archivedAt: db.today,
      archiveReason: reason.trim(),
    }
    db.employees[idx] = emp

    const user = db.users.find((u) => u.employeeId === employeeId)
    if (user) {
      user.status = 'DISABLED'
    }

    db.auditLogs.unshift({
      id: `AUD-${100 + db.auditLogs.length + 1}`,
      action: 'employee.archived',
      module: 'Employees',
      actor: actor?.name ?? getActiveSession()?.name ?? 'Super Admin',
      target: `${emp.name} (${employeeId})`,
      previousValue: prev.status,
      newValue: 'ARCHIVED',
      reason: reason.trim(),
      detail: `Soft-deleted / archived employee record and revoked login while preserving financial, attendance, leave, and audit history. Reason: ${reason.trim()}`,
      at: `${db.today}T10:50:00+05:45`,
    })
    return emp
  },

  async documents(employeeId: string, viewer?: SessionUser | null): Promise<EmployeeDocument[]> {
    const v = resolveViewer(viewer)
    if (!v) {
      throw new Error('Unauthorized: Authentication required to access employee documents.')
    }
    if (v.role === 'EMPLOYEE' && v.employeeId !== employeeId) {
      throw new Error('Unauthorized: Employees can only access their own personal documents.')
    }
    return db.employeeDocuments.filter((d) => d.employeeId === employeeId)
  },
}

