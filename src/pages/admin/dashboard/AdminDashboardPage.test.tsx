import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { HeaderProvider } from '@/components/layout/header-context'
import { db } from '@/services/demo/store'
import type { SessionUser } from '@/types/domain'
import { AdminDashboardPage } from './AdminDashboardPage'

function renderWithRole(role: 'SUPER_ADMIN' | 'HR_ADMIN') {
  const session = db.demoSessions.find((s) => s.role === role) as SessionUser
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    session,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider session={session} setSession={() => undefined} demoSessions={db.demoSessions}>
          <HeaderProvider resetKey="/dashboard">
            <MemoryRouter initialEntries={['/dashboard']}>
              <AdminDashboardPage />
            </MemoryRouter>
          </HeaderProvider>
        </AuthProvider>
      </QueryClientProvider>,
    ),
  }
}

describe('AdminDashboardPage', () => {
  it('renders SUPER_ADMIN dashboard with Monthly payroll and Finance snapshot and clickable summary links', async () => {
    const { session } = renderWithRole('SUPER_ADMIN')
    expect(screen.getByText(new RegExp(`Good morning, ${session.name}`, 'i'))).toBeDefined()
    expect(screen.getByText(/Monthly payroll/i)).toBeDefined()
    expect(screen.getByText(/Finance snapshot/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Open audit history/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /Total employees/i }).getAttribute('href')).toBe('/employees')
    expect(screen.getByRole('link', { name: /Present today/i }).getAttribute('href')).toBe('/attendance')
    expect(screen.getByRole('link', { name: /Pending tasks/i }).getAttribute('href')).toBe('/tasks')
    expect(screen.getByRole('link', { name: /Monthly payroll/i }).getAttribute('href')).toBe('/payroll')
    await waitFor(() => {
      expect(screen.getByText(/Attendance overview/i)).toBeDefined()
      expect(screen.getByText(/Tasks & deadlines/i)).toBeDefined()
    })
  })

  it('renders HR_ADMIN dashboard with Pending leave requests and Workforce momentum instead of payroll', async () => {
    const { session } = renderWithRole('HR_ADMIN')
    expect(screen.getByText(new RegExp(`Good morning, ${session.name}`, 'i'))).toBeDefined()
    expect(screen.getByText(/Pending leave requests/i)).toBeDefined()
    expect(screen.getByText(/Workforce momentum/i)).toBeDefined()
    expect(screen.queryByText(/Finance snapshot/i)).toBeNull()
    expect(screen.getByRole('button', { name: /Open audit history/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /Total employees/i }).getAttribute('href')).toBe('/employees')
    expect(screen.getByRole('link', { name: /Present today/i }).getAttribute('href')).toBe('/attendance')
    expect(screen.getByRole('link', { name: /Pending tasks/i }).getAttribute('href')).toBe('/tasks')
    expect(screen.getByRole('link', { name: /Pending leave requests/i }).getAttribute('href')).toBe('/leave/approvals')
  })
})
