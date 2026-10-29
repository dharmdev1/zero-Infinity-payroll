import type { AuditLogEntry, OrgUser, Paginated } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, paginate, searchAcross } from './query-utils'
import type { ListQuery } from './query-utils'

/** Admin: users, directory counts, audit logs. */
export interface SettingsService {
  users(search: string, page: number, pageSize: number): Promise<Paginated<OrgUser>>
  audit(filters: ListQuery): Promise<Paginated<AuditLogEntry>>
  headcount(): Promise<{ total: number; active: number; probation: number; inactive: number }>
  searchEverything(term: string): Promise<Array<{ label: string; to: string }>>
}

const realService: SettingsService = {
  users: (search, page, pageSize) => apiClient.get<Paginated<OrgUser>>('/settings/users', { search, page, pageSize }),
  audit: (filters) => apiClient.get<Paginated<AuditLogEntry>>('/settings/audit', { ...filters }),
  headcount: () => apiClient.get('/settings/headcount'),
  searchEverything: (term) => apiClient.get('/search', { term }),
}

const demoService: SettingsService = {
  async users(search, page, pageSize) {
    await demoDelay(200)
    return paginate(searchAcross(db.users, search, ['name', 'email', 'employeeId']) as OrgUser[], page, pageSize)
  },
  async audit(filters) {
    await demoDelay(220)
    const { search, page, pageSize, filters: f } = normalizeQuery(filters)
    let rows = db.auditLogs
    rows = searchAcross(rows, search, ['actor', 'action', 'target', 'detail'])
    if (f.module) rows = rows.filter((r) => r.module.toLowerCase() === f.module)
    return paginate(rows, page, pageSize)
  },
  async headcount() {
    await demoDelay(80)
    const active = db.employees.filter((e) => e.status === 'ACTIVE').length
    const probation = db.employees.filter((e) => e.status === 'PROBATION').length
    const inactive = db.employees.filter((e) => e.status === 'INACTIVE').length
    return { total: db.employees.length, active, probation, inactive }
  },
  async searchEverything(term) {
    await demoDelay(90)
    const q = term.trim().toLowerCase()
    if (!q) return []
    const out: Array<{ label: string; to: string }> = []
    for (const emp of db.employees) {
      if (out.length >= 6) break
      if (emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q)) {
        out.push({ label: `${emp.name} · ${emp.id}`, to: `/employees/${emp.id}` })
      }
    }
    for (const task of db.tasks) {
      if (out.length >= 8) break
      if (task.title.toLowerCase().includes(q)) out.push({ label: `Task: ${task.title}`, to: `/tasks/${task.id}` })
    }
    return out
  },
}

export const settingsService: SettingsService = API_MODE === 'api' ? realService : demoService
