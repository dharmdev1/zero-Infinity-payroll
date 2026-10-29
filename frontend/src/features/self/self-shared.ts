import { useAuth } from '@/app/auth-context'

/** Demo persona fallback: EMP-004's self view. In live mode every call uses the session employee ID. */
export function useMyEmployeeId(): string {
  const { session } = useAuth()
  return session?.employeeId ?? 'EMP-004'
}
