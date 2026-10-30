export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Marketing & IT',
  'Design',
  'Operations',
] as const

export const GENDERS = ['Male', 'Female', 'Other'] as const

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'] as const

export const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Relative', 'Friend', 'Other'] as const

export const RELATIONSHIP_OPTIONS = RELATIONSHIPS.map((r) => ({ value: r, label: r }))

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const
