import { db, getActiveSession } from './demo/store'
import type { Candidate, Interview, JobPosting, SessionUser } from '@/types/domain'
import { hasPermission } from '@/types/rbac'

function resolveViewer(viewer?: SessionUser | null): SessionUser | null {
  return viewer !== undefined ? viewer : getActiveSession()
}

export const recruitmentService = {
  async jobs(department = '', status = '', viewer?: SessionUser | null): Promise<JobPosting[]> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'recruitment.view')) {
      throw new Error('Unauthorized: You do not have permission to view job openings.')
    }
    return db.jobs.filter((j) => {
      if (department && j.department !== department) return false
      if (status && j.status !== status) return false
      return true
    })
  },

  async candidates(search = '', stage = '', viewer?: SessionUser | null): Promise<Candidate[]> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'recruitment.view')) {
      throw new Error('Unauthorized: You do not have permission to view candidates.')
    }
    const q = search.trim().toLowerCase()
    return db.candidates.filter((c) => {
      if (stage && c.stage !== stage) return false
      if (q && !`${c.name} ${c.email} ${c.jobTitle}`.toLowerCase().includes(q)) return false
      return true
    })
  },

  async moveCandidateStage(
    id: string,
    nextStage: Candidate['stage'],
    viewer?: SessionUser | null,
  ): Promise<Candidate> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'recruitment.manage')) {
      throw new Error('Unauthorized: You do not have permission to manage candidate stages.')
    }
    const found = db.candidates.find((c) => c.id === id)
    if (!found) throw new Error(`Candidate ${id} not found`)
    found.stage = nextStage
    return found
  },

  async interviews(viewer?: SessionUser | null): Promise<Interview[]> {
    const v = resolveViewer(viewer)
    if (!v || !hasPermission(v, 'recruitment.view')) {
      throw new Error('Unauthorized: You do not have permission to view interviews.')
    }
    return db.interviews
  },
}

