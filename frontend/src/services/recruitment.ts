import type { Candidate, Interview, JobPosting } from '@/types/domain'
import { db } from './demo/store'
import { apiClient, API_MODE } from './api/client'
import { demoDelay, searchAcross } from './query-utils'

/** REAL API CONTRACT: GET /jobs, GET /candidates, GET /interviews (+status transitions). */
export interface RecruitmentService {
  jobs(search: string): Promise<JobPosting[]>
  candidates(search: string, stage: string): Promise<Candidate[]>
  interviews(): Promise<Interview[]>
  moveCandidateStage(candidateId: string, stage: Candidate['stage']): Promise<Candidate>
}

const realService: RecruitmentService = {
  jobs: (search) => apiClient.get<JobPosting[]>('/jobs', { search }),
  candidates: (search, stage) => apiClient.get<Candidate[]>('/candidates', { search, stage }),
  interviews: () => apiClient.get<Interview[]>('/interviews'),
  moveCandidateStage: (candidateId, stage) => apiClient.patch<Candidate>(`/candidates/${candidateId}`, { stage }),
}

const demoService: RecruitmentService = {
  async jobs(search) {
    await demoDelay(180)
    return searchAcross(db.jobs, search, ['title', 'department']).sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  },
  async candidates(search, stage) {
    await demoDelay(200)
    let rows = db.candidates
    rows = searchAcross(rows, search, ['name', 'jobTitle', 'email'])
    if (stage) rows = rows.filter((c) => c.stage.toLowerCase() === stage.toLowerCase())
    return rows.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  },
  async interviews() {
    await demoDelay(160)
    return structuredClone(db.interviews).sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  },
  async moveCandidateStage(candidateId, stage) {
    await demoDelay(280)
    const candidate = db.candidates.find((c) => c.id === candidateId)
    if (!candidate) throw new Error(`Candidate not found: ${candidateId}`)
    candidate.stage = stage
    return structuredClone(candidate)
  },
}

export const recruitmentService: RecruitmentService = API_MODE === 'api' ? realService : demoService
