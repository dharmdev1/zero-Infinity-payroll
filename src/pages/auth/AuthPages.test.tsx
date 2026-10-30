import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from './AuthPages'
import { db, DEMO_SESSIONS } from '@/services/demo/store'

function renderLogin(onSession = vi.fn()) {
  return render(
    <AuthProvider session={null} setSession={onSession} demoSessions={DEMO_SESSIONS}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
    expect(await screen.findByText(/enter a valid work email/i)).toBeDefined()
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
    expect(setSession).toHaveBeenCalledWith(persona)
  })

  it('links to the forgot-password flow and submits reset request', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeDefined()
    await user.type(screen.getByLabelText(/work email/i), 'aarav.karki@zeroinfinity.tech')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/check your inbox/i, {}, { timeout: 2000 })).toBeDefined()
  })

  it('validates reset password token and updates password when token is provided', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider session={null} setSession={vi.fn()} demoSessions={DEMO_SESSIONS}>
        <MemoryRouter initialEntries={['/reset-password?token=demo-reset-token']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    await user.type(screen.getByLabelText(/^new password/i), 'ValidPass9')
    await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass9')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/password updated/i, {}, { timeout: 2000 })).toBeDefined()
  })
})
