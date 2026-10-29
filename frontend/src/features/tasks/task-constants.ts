export const TASK_STATUSES = ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const
export const TASK_PRIORITIES = ['High', 'Medium', 'Low'] as const

export const TASK_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TO_DO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

export const TASK_PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
] as const

export const projectStatusMeta = {
  PLANNING: { label: 'Planning', tone: 'blue' as const },
  ACTIVE: { label: 'Active', tone: 'green' as const },
  ON_HOLD: { label: 'On hold', tone: 'orange' as const },
  COMPLETED: { label: 'Completed', tone: 'gray' as const },
}
