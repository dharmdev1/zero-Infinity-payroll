import type { Role, Permission } from '@/types/rbac'
import type { SessionUser } from '@/types/domain'
import { ROLE_PERMISSIONS, roleHas } from '@/types/rbac'

/**
 * Session abstraction. Today the demo strategy persists a persona selection in
 * localStorage. The future FastAPI backend will own the secure session (e.g.
 * httpOnly cookie), and these functions will read `/api/v1/auth/session`
 * instead — no page code changes either way.
 */
export interface SessionStrategy {
  load(): SessionUser | null
  save(session: SessionUser | null): void
}

const DEMO_SESSION_KEY = 'hrms.demo.session.v1'

function safeParse(json: string | null): SessionUser | null {
  if (!json) return null
  try {
    return JSON.parse(json) as SessionUser
  } catch {
    return null
  }
}

export const demoSessionStrategy: SessionStrategy = {
  load: () => safeParse(localStorage.getItem(DEMO_SESSION_KEY)),
  save: (session) => {
    if (session) localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(DEMO_SESSION_KEY)
  },
}

/** Backend session strategy lives behind the same shape. */
// export const apiSessionStrategy: SessionStrategy = { ... }

export function permissionsOf(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

export function canSession(session: SessionUser | null, permission: Permission): boolean {
  return !!session && roleHas(session.role, permission)
}
