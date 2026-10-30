import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from './auth-context'
import { DEMO_SESSIONS } from '@/services/demo/store'
import type { SessionUser } from '@/types/domain'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
})

export function AppProviders({ initialSession = null }: { initialSession?: SessionUser | null } = {}) {
  const [session, setSession] = useState<SessionUser | null>(initialSession)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider session={session} setSession={setSession} demoSessions={DEMO_SESSIONS}>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  )
}
