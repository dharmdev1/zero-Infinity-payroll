import { useAuth } from '@/app/auth-context'

export function useMyEmployeeId(): string {
  const { session } = useAuth()
  return session?.employeeId ?? 'EMP-004'
}
