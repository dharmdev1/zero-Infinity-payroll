import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, InfoNote } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { useAuth } from '@/app/auth-context'
import { ROLE_LABELS } from '@/types/rbac'
import { settingsService } from '@/services/settings'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import type { SessionUser } from '@/types/domain'

export function LoginPage() {
  const { setSession, demoSessions } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formNotice, setFormNotice] = useState('')

  const attemptPersonaLogin = (persona: SessionUser) => {
    setFormNotice('')
    const check = settingsService.isAccountActive(persona.employeeId || persona.userId)
    if (!check.active) {
      setFormNotice(check.reason ?? 'This account is disabled or terminated.')
      return
    }
    try {
      setSession({
        ...persona,
        role: check.currentRole ?? persona.role,
      })
      navigate('/dashboard')
    } catch (err) {
      setFormNotice(err instanceof Error ? err.message : 'Unable to sign in.')
    }
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')
    setFormNotice('')

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Enter a valid work email address.')
      return
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    const matchedUser = db.users.find((u) => u.email.toLowerCase() === trimmedEmail)
    const matchedEmployee = db.employees.find((emp) => emp.workEmail.toLowerCase() === trimmedEmail)

    if (matchedUser || matchedEmployee) {
      const checkId = matchedEmployee?.id ?? matchedUser?.id ?? ''
      const check = settingsService.isAccountActive(checkId)
      if (!check.active) {
        setFormNotice(check.reason ?? 'This account has been disabled or terminated.')
        return
      }
    }

    const persona = demoSessions.find((s) => s.email.toLowerCase() === trimmedEmail)
    if (persona) {
      attemptPersonaLogin(persona)
      return
    }

    if (matchedUser && matchedEmployee) {
      attemptPersonaLogin({
        userId: matchedUser.id,
        employeeId: matchedEmployee.id,
        name: matchedEmployee.name,
        email: matchedEmployee.workEmail,
        role: matchedUser.role,
        department: matchedEmployee.department,
        jobTitle: matchedEmployee.jobTitle,
      })
      return
    }

    setFormNotice('No demo persona matches that email. Pick one of the demo personas below or use their email.')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-mono text-base font-bold text-white">
              H
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-ink-deep">Zero Infinity Technologies</p>
              <p className="text-xs text-muted">Company HRMS Workspace</p>
            </div>
          </div>
          <Badge tone="orange">Demo Mode Only</Badge>
        </div>

        <Card className="p-6">
          <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5 text-xs text-brand-700">
            <p className="font-semibold">Explicit Demo Authentication Sandbox</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed">
              This preview environment starts unauthenticated and uses simulated demo personas. Select a persona below to test System Roles vs. Project/Team Positions.
            </p>
          </div>

          <h1 className="text-[22px] font-bold text-ink">Sign in to your account</h1>
          <p className="mt-1 text-[13px] text-muted">Use your Zero Infinity work email or select an explicit demo persona below.</p>

          {formNotice ? (
            <div className="mt-4">
              <InfoNote tone="red">{formNotice}</InfoNote>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSignIn} noValidate>
            <TextInput
              label="Work email"
              type="email"
              required
              placeholder="name@zeroinfinity.tech"
              value={email}
              error={emailError}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              error={passwordError}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">NPT (UTC+05:45)</span>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-brand-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Quick demo personas (Demo Only)</p>
              <span className="text-[11px] text-subtle">Explicit selection required</span>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {demoSessions.slice(0, 3).map((p) => {
                const check = settingsService.isAccountActive(p.employeeId || p.userId)
                const roleLabel = ROLE_LABELS[check.currentRole ?? p.role]
                return (
                  <Button
                    key={p.userId}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!check.active}
                    onClick={() => attemptPersonaLogin(p)}
                  >
                    {roleLabel}
                  </Button>
                )
              })}
            </div>

            <div className="mt-3 space-y-2">
              {demoSessions.map((p) => {
                const check = settingsService.isAccountActive(p.employeeId || p.userId)
                const currentRole = check.currentRole ?? p.role
                const positions = taskService.getEmployeeProjectPositions(p.employeeId)
                const posSummary =
                  positions.length > 0
                    ? positions.map((pos) => `${pos.positionLabel} (${pos.project.code})`).join(' · ')
                    : 'No project assignment'
                return (
                  <div
                    key={`card-${p.userId}`}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-soft/50 px-3.5 py-2.5 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink">{p.name}</span>
                        <Badge tone={currentRole === 'SUPER_ADMIN' ? 'purple' : currentRole === 'HR_ADMIN' ? 'blue' : 'gray'}>
                          {currentRole}
                        </Badge>
                        {!check.active ? <Badge tone="red">Disabled</Badge> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">{posSummary}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!check.active}
                      onClick={() => attemptPersonaLogin(p)}
                    >
                      Use {p.name.split(' ')[0]} →
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid work email address.')
      return
    }
    setError('')
    setSent(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-[22px] font-bold text-ink">Forgot password</h1>
        <p className="mt-1 text-[13px] text-muted">Enter your work email and we will send a password reset link.</p>

        {sent ? (
          <div className="mt-4 space-y-3">
            <InfoNote tone="green">Check your inbox — if an account exists for {email}, a reset link is on its way.</InfoNote>
            <Link to="/reset-password?token=demo-reset-token" className="inline-block text-xs font-medium text-brand-600 hover:underline">
              Open demo reset link →
            </Link>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            <TextInput
              label="Work email"
              type="email"
              required
              value={email}
              error={error}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <Link to="/login" className="text-[13px] font-medium text-brand-600 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Missing or invalid reset token.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setUpdated(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-[22px] font-bold text-ink">Reset password</h1>
        <p className="mt-1 text-[13px] text-muted">Choose a strong password for your Zero Infinity account.</p>

        {updated ? (
          <div className="mt-4 space-y-3">
            <InfoNote tone="green">Password updated — you can now sign in with your new password.</InfoNote>
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Return to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            {error ? <InfoNote tone="red">{error}</InfoNote> : null}
            <TextInput
              label="New password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextInput
              label="Confirm password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Update password
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
