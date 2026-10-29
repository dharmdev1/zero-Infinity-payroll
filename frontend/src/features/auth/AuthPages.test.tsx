import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { LoginPage } from './AuthPages'
import { db, DEMO_SESSIONS } from '@/services/demo/store'

function renderLogin(onSession = vi.fn()) {
  return render(
    <AuthProvider session={null} setSession={onSession} demoSessions={DEMO_SESSIONS}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<p>FORGOT SCREEN</p>} />
          <Route path="/dashboard" element={<p>DASHBOARD SCREEN</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('renders the sign-in form with brand and role personas', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeDefined()
    expect(screen.getByLabelText(/work email/i)).toBeDefined()
    expect(screen.getByLabelText(/password/i)).toBeDefined()
    for (const label of ['Super Admin', 'HR Admin', 'Employee']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeDefined()
    }
  })

  it('validates the form before submitting', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findAllByText(/enter a valid work email/i).catch(() => [])).toBeDefined()
  })

  it('rejects an unknown email with a friendly demo notice', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/work email/i), 'stranger@example.com')
    await user.type(screen.getByLabelText(/password/i), 'longenoughpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/no demo persona matches that email/i)).toBeDefined()
  })

  it('signs in a matching demo persona and routes to the dashboard', async () => {
    const user = userEvent.setup()
    const setSession = vi.fn()
    renderLogin(setSession)
    const persona = db.demoSessions[0]
    await user.type(screen.getByLabelText(/work email/i), persona.email)
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('DASHBOARD SCREEN', {}, { timeout: 3000 })).toBeDefined()
  })

  it('links to the forgot-password flow', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.getByText('FORGOT SCREEN')).toBeDefined()
  })
})
