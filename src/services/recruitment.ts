import { db } from './demo/store'
import type { Candidate, Interview, JobPosting } from '@/types/domain'

export const recruitmentService = {
  async jobs(department = '', status = ''): Promise<JobPosting[]> {
    return db.jobs.filter((j) => {
      if (department && j.department !== department) return false
      if (status && j.status !== status) return false
      return true
    })
  },

  async candidates(search = '', stage = ''): Promise<Candidate[]> {
    const q = search.trim().toLowerCase()
    return db.candidates.filter((c) => {
      if (stage && c.stage !== stage) return false
      if (q && !`${c.name} ${c.email} ${c.jobTitle}`.toLowerCase().includes(q)) return false
      return true
    })
  },

  async moveCandidateStage(id: string, nextStage: Candidate['stage']): Promise<Candidate> {
    const found = db.candidates.find((c) => c.id === id)
    if (!found) throw new Error(`Candidate ${id} not found`)
    found.stage = nextStage
    return found
  },

  async interviews(): Promise<Interview[]> {
    return db.interviews
  },
}
