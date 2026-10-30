import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { HeaderProvider } from '@/components/layout/header-context'
import { db } from '@/services/demo/store'
import type { SessionUser } from '@/types/domain'
import { EmployeeDashboardPage } from './EmployeeDashboardPage'

describe('EmployeeDashboardPage', () => {
  it('renders employee dashboard sections, summary cards, and weekday strip', async () => {
    const session = db.demoSessions.find((s) => s.role === 'EMPLOYEE') as SessionUser
    const firstName = session.name.split(' ')[0]
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider session={session} setSession={() => undefined} demoSessions={db.demoSessions}>
          <HeaderProvider resetKey="/dashboard">
            <MemoryRouter initialEntries={['/dashboard']}>
              <EmployeeDashboardPage />
            </MemoryRouter>
          </HeaderProvider>
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByText(new RegExp(`Good morning, ${firstName}`, 'i'))).toBeDefined()
    expect(screen.getByText(/Attendance this month/i)).toBeDefined()
    expect(screen.getByText(/Today's attendance/i)).toBeDefined()
    expect(screen.getByText(/My week/i)).toBeDefined()
    expect(screen.getByText(/My tasks/i)).toBeDefined()
    expect(screen.getByText(/Leave & holidays/i)).toBeDefined()
    expect(screen.getByText(/Company announcements/i)).toBeDefined()

    expect(screen.getByRole('link', { name: /Attendance this month/i }).getAttribute('href')).toBe('/my/attendance')
    expect(screen.getByRole('link', { name: /Tasks in progress/i }).getAttribute('href')).toBe('/my/tasks')
    expect(screen.getByRole('link', { name: /Leave balance/i }).getAttribute('href')).toBe('/my/leave')
    expect(screen.getByRole('link', { name: /Latest payslip/i }).getAttribute('href')).toBe('/my/payslips')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Check in/i })).toBeDefined()
    })
  })
})
