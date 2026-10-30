import type { Tone } from '@/components/ui/base'
import type { ProjectStatus, TaskStatus } from '@/types/domain'

export const TASK_STATUSES: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']

export const TASK_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TO_DO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'In review' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

export const TASK_PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
] as const

export const projectStatusMeta: Record<ProjectStatus, { label: string; tone: Tone }> = {
  ON_TRACK: { label: 'On track', tone: 'green' },
  AT_RISK: { label: 'At risk', tone: 'orange' },
  COMPLETED: { label: 'Completed', tone: 'blue' },
}
