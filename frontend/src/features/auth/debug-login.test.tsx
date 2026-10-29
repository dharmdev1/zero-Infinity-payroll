import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/app/auth-context'
import { LoginPage } from '@/features/auth/AuthPages'
import { db, DEMO_SESSIONS, resetDemoDb } from '@/services/demo/store'

describe('debug: login registration', () => {
  it('shows what happens after typing + submit', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider session={null} setSession={() => undefined} demoSessions={DEMO_SESSIONS}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<p>DASHBOARD SCREEN</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    const email = screen.getByLabelText(/work email/i) as HTMLInputElement
    await user.type(email, 'stranger@example.com')
    console.log('EMAIL VALUE AFTER TYPE:', JSON.stringify(email.value))
    await user.type(screen.getByLabelText(/password/i), 'longenoughpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await new Promise((r) => setTimeout(r, 800))
    console.log('BODY ERROR PARAS:', Array.from(document.querySelectorAll('p[role="alert"]')).map((p) => `[id=${p.id}] ${p.textContent}`))
    console.log('FORM ERROR SEARCH:', document.body.querySelector('.text-danger:last-of-type')?.textContent)
    console.log('EMAIL VALUE AFTER SUBMIT:', JSON.stringify(email.value))
    resetDemoDb()
    expect(true).toBe(true)
  })

  it('checks register spread shape', async () => {
    // verify register props are actually reachable after TextInput destructuring
    const user = userEvent.setup()
    render(
      <AuthProvider session={null} setSession={() => undefined} demoSessions={DEMO_SESSIONS}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<p>DASHBOARD SCREEN</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    const persona = db.demoSessions[0]
    const email = screen.getByLabelText(/work email/i) as HTMLInputElement
    await user.type(email, persona.email)
    await user.type(screen.getByLabelText(/password/i), 'password123')
    console.log('TYPE event bubbles; email=', JSON.stringify(email.value))
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await new Promise((r) => setTimeout(r, 900))
    console.log('AFTER PERSONA SUBMIT:', document.body.textContent?.includes('DASHBOARD SCREEN') ? 'REACHED DASHBOARD' : 'STILL ON LOGIN')
    resetDemoDb()
    expect(true).toBe(true)
  })
})
