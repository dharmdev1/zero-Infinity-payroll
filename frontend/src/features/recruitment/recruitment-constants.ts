import type { Candidate } from '@/types/domain'

export const CANDIDATE_STAGES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All stages' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
]

export const STAGE_TONES: Record<Candidate['stage'], 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'gray'> = {
  APPLIED: 'gray',
  SCREENING: 'purple',
  INTERVIEW: 'blue',
  OFFER: 'orange',
  HIRED: 'green',
  REJECTED: 'red',
}

/** Stage advance ladder used by the candidate table's "Advance" action. */
export function nextStageOf(stage: Candidate['stage']): Candidate['stage'] | null {
  switch (stage) {
    case 'APPLIED': return 'SCREENING'
    case 'SCREENING': return 'INTERVIEW'
    case 'INTERVIEW': return 'OFFER'
    default: return null
  }
}
