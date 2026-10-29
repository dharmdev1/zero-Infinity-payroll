export const DEPARTMENTS = ['Engineering', 'Finance', 'Human Resources', 'Marketing & IT', 'Design', 'Operations'] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

export const GENDERS = ['Female', 'Male', 'Other'] as const
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'] as const
export const RELATIONSHIPS = ['Sibling', 'Spouse', 'Parent', 'Friend', 'Colleague'] as const

export type Relationship = (typeof RELATIONSHIPS)[number]

export const RELATIONSHIP_OPTIONS: Array<{ value: string; label: string }> = RELATIONSHIPS.map((r) => ({ value: r, label: r }))
