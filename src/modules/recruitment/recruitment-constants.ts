import type { Tone } from '@/components/ui/base'
import type { CandidateStage } from '@/types/domain'

export const CANDIDATE_STAGES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All stages' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'HR_ROUND', label: 'HR round' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
]

export const STAGE_TONES: Record<CandidateStage, Tone> = {
  APPLIED: 'gray',
  SCREENING: 'blue',
  TECHNICAL: 'purple',
  HR_ROUND: 'orange',
  OFFER: 'green',
  HIRED: 'green',
  REJECTED: 'red',
}

const PIPELINE_ORDER: CandidateStage[] = ['APPLIED', 'SCREENING', 'TECHNICAL', 'HR_ROUND', 'OFFER', 'HIRED']

export function nextStageOf(stage: CandidateStage): CandidateStage | null {
  const idx = PIPELINE_ORDER.indexOf(stage)
  if (idx === -1 || idx >= PIPELINE_ORDER.length - 1) return null
  return PIPELINE_ORDER[idx + 1]
}
