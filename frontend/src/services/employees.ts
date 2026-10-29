import type { Employee, EmployeeDocument, EmploymentStatus, Paginated } from '@/types/domain'
import type { ListQuery } from './query-utils'
import { demoDelay, normalizeQuery, paginate, searchAcross } from './query-utils'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'

/**
 * REAL API CONTRACT (FastAPI, /api/v1):
 *   GET    /employees?search&department&status&page&pageSize
 *   POST   /employees
 *   GET    /employees/{employeeId}
 *   PATCH  /employees/{employeeId}
 *   POST   /employees/{employeeId}/status         { status, reason }
 *   POST   /employees/{employeeId}/deactivate      { reason }
 *   DELETE /employees/{employeeId}                 { reason }
 *   GET    /employees/{employeeId}/documents
 */
export interface EmployeeListFilters extends ListQuery {
  department?: string
  status?: string
  sort?: 'name' | 'employeeId' | 'joiningDate'
}

export interface EmployeeService {
  list(filters: EmployeeListFilters): Promise<Paginated<Employee>>
  get(employeeId: string): Promise<Employee>
  create(payload: Omit<Employee, 'id' | 'avatarTone' | 'status'>): Promise<Employee>
  update(employeeId: string, payload: Partial<Employee>): Promise<Employee>
  changeStatus(employeeId: string, status: EmploymentStatus, reason: string): Promise<Employee>
  deactivate(employeeId: string, reason: string): Promise<Employee>
  deletePermanently(employeeId: string, reason: string): Promise<void>
  documents(employeeId: string): Promise<EmployeeDocument[]>
}

const realService: EmployeeService = {
  async list(filters) {
    return apiClient.get<Paginated<Employee>>('/employees', { ...filters })
  },
  get(employeeId) {
    return apiClient.get<Employee>(`/employees/${employeeId}`)
  },
  create(payload) {
    return apiClient.post<Employee>('/employees', payload)
  },
  update(employeeId, payload) {
    return apiClient.patch<Employee>(`/employees/${employeeId}`, payload)
  },
  changeStatus(employeeId, status, reason) {
    return apiClient.post<Employee>(`/employees/${employeeId}/status`, { status, reason })
  },
  deactivate(employeeId, reason) {
    return apiClient.post<Employee>(`/employees/${employeeId}/deactivate`, { reason })
  },
  async deletePermanently(employeeId, reason) {
    await apiClient.delete<void>(`/employees/${employeeId}`)
    void reason
  },
  documents(employeeId) {
    return apiClient.get<EmployeeDocument[]>(`/employees/${employeeId}/documents`)
  },
}

function nextEmployeeId(): string {
  const max = db.employees.reduce((acc, e) => Math.max(acc, Number(e.id.replace('EMP-', ''))), 0)
  return `EMP-${String(max + 1).padStart(3, '0')}`
}

const demoService: EmployeeService = {
  async list(filters) {
    await demoDelay()
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.employees
    rows = searchAcross(rows, search, ['name', 'id', 'workEmail', 'jobTitle', 'department'])
    if (f.department) rows = rows.filter((e) => e.department.toLowerCase() === f.department)
    if (f.status) rows = rows.filter((e) => e.status.toLowerCase() === f.status)
    const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id))
    return paginate(sorted, page, pageSize)
  },
  async get(employeeId) {
    await demoDelay(140)
    const found = db.employees.find((e) => e.id === employeeId)
    if (!found) throw new Error(`Employee not found: ${employeeId}`)
    return structuredClone(found)
  },
  async create(payload) {
    await demoDelay(340)
    const id = nextEmployeeId()
    const created: Employee = {
      ...structuredClone(payload),
      id,
      name: `${payload.firstName} ${payload.lastName}`,
      status: 'PROBATION',
      avatarTone: 'blue',
    }
    db.employees.push(created)
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'employee.created',
      module: 'Employees',
      target: `${id} · ${created.name}`,
      at: new Date().toISOString(),
      detail: 'Created via demo adapter (not persisted).',
    })
    return structuredClone(created)
  },
  async update(employeeId, payload) {
    await demoDelay(320)
    const target = db.employees.find((e) => e.id === employeeId)
    if (!target) throw new Error(`Employee not found: ${employeeId}`)
    Object.assign(target, structuredClone(payload))
    if (payload.firstName || payload.lastName) target.name = `${target.firstName} ${target.lastName}`
    return structuredClone(target)
  },
  async changeStatus(employeeId, status, reason) {
    await demoDelay(300)
    const target = db.employees.find((e) => e.id === employeeId)
    if (!target) throw new Error(`Employee not found: ${employeeId}`)
    target.status = status
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'employee.status_changed',
      module: 'Employees',
      target: `${employeeId}`,
      at: new Date().toISOString(),
      detail: `Reason recorded: ${reason} (demo adapter, not persisted).`,
    })
    return structuredClone(target)
  },
  async deactivate(employeeId, reason) {
    await demoDelay(280)
    const target = db.employees.find((e) => e.id === employeeId)
    if (!target) throw new Error(`Employee not found: ${employeeId}`)
    target.status = 'INACTIVE'
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'employee.deactivated',
      module: 'Employees',
      target: `${employeeId}`,
      at: new Date().toISOString(),
      detail: `Reason recorded: ${reason} (demo adapter, not persisted).`,
    })
    return structuredClone(target)
  },
  async deletePermanently(employeeId, reason) {
    await demoDelay(320)
    const index = db.employees.findIndex((e) => e.id === employeeId)
    if (index === -1) throw new Error(`Employee not found: ${employeeId}`)
    db.employees.splice(index, 1)
    db.auditLogs.unshift({
      id: `AUD-demo-${Date.now()}`,
      actor: 'Admin',
      actorId: 'U-001',
      action: 'employee.deleted',
      module: 'Employees',
      target: `${employeeId}`,
      at: new Date().toISOString(),
      detail: `Reason recorded: ${reason} (demo adapter, not persisted).`,
    })
  },
  async documents(employeeId) {
    await demoDelay(150)
    const employee = db.employees.find((e) => e.id === employeeId)
    const name = employee?.name.replace(/\s+/g, '_') ?? 'Employee'
    return [
      { id: `${employeeId}-cv`, employeeId, name: `${name}_CV.pdf`, category: 'CV', sizeKb: 486, uploadedAt: employee?.joiningDate ?? '2024-01-01', verification: 'Verified' },
      { id: `${employeeId}-agreement`, employeeId, name: 'Employment_agreement.pdf', category: 'Agreement', sizeKb: 1200, uploadedAt: employee?.joiningDate ?? '2024-01-01', verification: 'Verified' },
      { id: `${employeeId}-identity`, employeeId, name: 'Identity_document.pdf', category: 'Identity', sizeKb: 842, uploadedAt: employee?.joiningDate ?? '2024-01-01', verification: 'Verified' },
    ]
  },
}

export const employeeService: EmployeeService = API_MODE === 'api' ? realService : demoService
