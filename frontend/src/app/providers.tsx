import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AuthProvider } from './auth-context'
import { demoSessionStrategy } from '@/services/auth/session'
import { DEMO_SESSIONS } from '@/services/demo/store'

/**
 * Session bootstrap: loads the persisted demo session (localStorage persona
 * selection). With a real backend this becomes a `/auth/session` check backed
 * by the secure server session — same state shape either way.
 */
export function AppProviders({ children }: { children?: ReactNode }) {
  const [session, setSession] = useState(() => demoSessionStrategy.load())
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider session={session} setSession={setSession} demoSessions={DEMO_SESSIONS}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
