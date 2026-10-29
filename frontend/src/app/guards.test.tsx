import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { RequireAuth, RequirePermission } from './guards'
import type { SessionUser } from '@/types/domain'
import { db } from '@/services/demo/store'
import { resetDemoDb } from '@/services/demo/store'

const employeeSession = (): SessionUser => db.demoSessions.find((s) => s.role === 'EMPLOYEE') as SessionUser

function withAuth(ui: React.ReactElement, options: { session: SessionUser | null }) {
  return (
    <AuthProvider session={options.session} setSession={() => undefined} demoSessions={[]} >
      {ui}
    </AuthProvider>
  )
}

describe('RequireAuth (UX-only route guard)', () => {
  it('redirects unauthenticated deep links to /login', () => {
    render(
      withAuth(
        <MemoryRouter initialEntries={['/employees/directory']}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/employees/directory" element={<p>PROTECTED CONTENT</p>} />
            </Route>
            <Route path="/login" element={<p>LOGIN SCREEN</p>} />
          </Routes>
        </MemoryRouter>,
        { session: null },
      ),
    )
    expect(screen.queryByText('PROTECTED CONTENT')).toBeNull()
    expect(screen.getByText('LOGIN SCREEN')).toBeDefined()
  })

  it('allows authenticated sessions through', () => {
    render(
      withAuth(
        <MemoryRouter initialEntries={['/employees/directory']}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/employees/directory" element={<p>PROTECTED CONTENT</p>} />
            </Route>
            <Route path="/login" element={<p>LOGIN SCREEN</p>} />
          </Routes>
        </MemoryRouter>,
        { session: employeeSession() },
      ),
    )
    expect(screen.getByText('PROTECTED CONTENT')).toBeDefined()
  })
})

describe('RequirePermission (UX-only permission guard)', () => {
  it('hides modules outside the role and shows an access notice', () => {
    render(
      withAuth(
        <MemoryRouter initialEntries={['/payroll']}>
          <RequirePermission permission="payroll.view">
            <p>PAYROLL VIEW</p>
          </RequirePermission>
        </MemoryRouter>,
        { session: employeeSession() },
      ),
    )
    expect(screen.queryByText('PAYROLL VIEW')).toBeNull()
    expect(screen.getByText('Access restricted')).toBeDefined()
  })

  it('does not break in-app navigation after a denial', async () => {
    const user = userEvent.setup()
    render(
      withAuth(
        <MemoryRouter initialEntries={['/payroll']}>
          <RequirePermission permission="payroll.view">
            <p>PAYROLL VIEW</p>
          </RequirePermission>
        </MemoryRouter>,
        { session: employeeSession() },
      ),
    )
    const backButton = screen.getByRole('link', { name: /back to dashboard/i })
    await user.click(backButton)
    // Navigation target is asserted by href; router-level rendering of the
    // dashboard is outside this unit's scope.
    expect(backButton.getAttribute('href')).toBe('/dashboard')
    resetDemoDb()
  })
})
