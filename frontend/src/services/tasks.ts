import type { Project, WorkTask } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, normalizeQuery, searchAcross } from './query-utils'
import type { ListQuery } from './query-utils'

/**
 * REAL API CONTRACT (FastAPI, /api/v1):
 *   GET /tasks?project&status&priority&assignee&page
 *   GET /tasks/{taskId}
 *   PATCH /tasks/{taskId}                      { title?, status?, priority?, dueDate? }
 *   GET /projects
 *   GET /projects/{projectId}
 */
export interface TaskListFilters extends ListQuery {
  project?: string
  status?: string
  priority?: string
  assignee?: string
}

export interface TaskService {
  list(filters: TaskListFilters): Promise<WorkTask[]>
  get(taskId: string): Promise<WorkTask>
  listMine(employeeId: string): Promise<WorkTask[]>
  update(taskId: string, patch: Partial<WorkTask>): Promise<WorkTask>
  projects(): Promise<Project[]>
  getProject(projectId: string): Promise<Project>
}

const realService: TaskService = {
  list: (filters) => apiClient.get<WorkTask[]>('/tasks', { ...filters }),
  get: (taskId) => apiClient.get<WorkTask>(`/tasks/${taskId}`),
  listMine: async (employeeId) => (await apiClient.get<WorkTask[]>('/tasks', { assignee: employeeId })),
  update: (taskId, patch) => apiClient.patch<WorkTask>(`/tasks/${taskId}`, patch),
  projects: () => apiClient.get<Project[]>('/projects'),
  getProject: (projectId) => apiClient.get<Project>(`/projects/${projectId}`),
}

const demoService: TaskService = {
  async list(filters) {
    await demoDelay(200)
    const { search, filters: f } = normalizeQuery(filters)
    let rows = db.tasks
    rows = searchAcross(rows, search, ['title', 'assigneeName', 'projectName'])
    if (f.project) rows = rows.filter((t) => t.projectName?.toLowerCase() === f.project)
    if (f.status) rows = rows.filter((t) => t.status.toLowerCase() === f.status)
    if (f.priority) rows = rows.filter((t) => t.priority.toLowerCase() === f.priority)
    if (f.assignee) rows = rows.filter((t) => t.assigneeId === f.assignee)
    return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  },
  async get(taskId) {
    await demoDelay(140)
    const found = db.tasks.find((t) => t.id === taskId)
    if (!found) throw new Error(`Task not found: ${taskId}`)
    return structuredClone(found)
  },
  async listMine(employeeId) {
    await demoDelay(180)
    return structuredClone(db.tasks.filter((t) => t.assigneeId === employeeId))
  },
  async update(taskId, patch) {
    await demoDelay(300)
    const task = db.tasks.find((t) => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    Object.assign(task, patch)
    return structuredClone(task)
  },
  async projects() {
    await demoDelay(180)
    return structuredClone(db.projects)
  },
  async getProject(projectId) {
    await demoDelay(140)
    const found = db.projects.find((p) => p.id === projectId)
    if (!found) throw new Error(`Project not found: ${projectId}`)
    return structuredClone(found)
  },
}

export const taskService: TaskService = API_MODE === 'api' ? realService : demoService
