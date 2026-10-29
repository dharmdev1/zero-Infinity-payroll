import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button, Card, InfoNote } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { useAuth } from '@/app/auth-context'
import { API_MODE, API_BASE_URL, API_VERSION_PREFIX } from '@/services/api/client'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import { db } from '@/services/demo/store'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid work email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-16 lg:py-0 lg:justify-center">
        <Link to="/login" className="mb-10 flex items-center gap-3" aria-label="Zero Infinity Technologies">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-mono text-lg font-semibold text-white">H</span>
          <span className="font-mono text-lg font-semibold tracking-tight text-ink-deep">Zero Infinity</span>
        </Link>
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-[28px] font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="mx-auto mt-14 w-full max-w-md text-xs text-muted">Company HRMS • Secure workspace</p>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-600 lg:block" aria-hidden="true">
        <div className="flex h-full flex-col justify-center gap-8 px-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <ShieldCheck size={14} /> Company HRMS
            </span>
            <p className="mt-6 max-w-md text-[28px] font-bold leading-snug text-white">Everything your people need, in one secure workspace.</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
              Attendance in Nepal time, leave approvals, tasks, recruitment, NPR payroll and company documents — designed for Zero Infinity Technologies.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-white/85">
            {['Role-aware dashboards for admin, HR and employees', 'Mon–Fri workweek · Asia/Kathmandu (UTC+05:45)', 'Payroll formatted in NPR with paisa precision', 'Append-only audit trail for sensitive actions'].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/50">
            {API_MODE === 'demo'
              ? 'Demo frontend — no backend connected yet. FastAPI + MySQL integration is planned; nothing here is persisted.'
              : `Connected to ${API_BASE_URL || ''}${API_VERSION_PREFIX}`}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { signInDemo, session } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    setFormError(null)
    // Frontend-only phase: no real auth endpoint exists yet. The demo sign-in
    // selects a clearly labelled persona for each role. Real authentication
    // (session cookie) will be provided by the FastAPI backend later.
    await new Promise((r) => setTimeout(r, 420))
    const persona = db.demoSessions.find((s) => s.email.toLowerCase() === values.email.toLowerCase())
    if (!persona) {
      setFormError('No demo persona matches that email. Use one of the role buttons below.')
      setSubmitting(false)
      return
    }
    signInDemo(persona)
    navigate('/dashboard', { replace: true })
  })

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout title="Sign in" subtitle="Use your Zero Infinity work account.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextInput
          id="login-email"
          label="Work email"
          type="email"
          required
          autoComplete="username"
          placeholder="name@zeroinfinity.tech"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextInput
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError ? <p className="text-xs text-danger">{formError}</p> : null}
        <button type="button" className="flex text-xs font-medium text-brand-600" onClick={() => navigate('/forgot-password')}>
          Forgot password?
        </button>
        <Button type="submit" className="w-full" loading={submitting}>
          Sign in
        </Button>
        <InfoNote tone="blue">
          Frontend-only build: choose a role below to preview that workspace. Passwords are not verified against a server yet.
        </InfoNote>
        <div className="grid gap-2.5">
          {(['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] as Role[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                const persona = db.demoSessions.find((s) => s.role === role)
                if (persona) {
                  signInDemo(persona)
                  navigate('/dashboard', { replace: true })
                }
              }}
              disabled={!db.demoSessions.some((s) => s.role === role)}
              className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-left hover:border-brand-500 hover:bg-brand-50/40 disabled:opacity-50"
            >
              <span>
                <span className="block text-[13px] font-semibold text-ink">{ROLE_LABELS[role]}</span>
                <span className="block text-xs text-muted">{ROLE_DESCRIPTIONS[role]}</span>
              </span>
              <ArrowRight size={15} className="text-brand-600" />
            </button>
          ))}
        </div>
      </form>
    </AuthLayout>
  )
}

const forgotSchema = z.object({ email: z.string().trim().email('Enter a valid work email address') })
type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = handleSubmit(async () => {
    // No backend endpoint yet: state is local-only and clearly demonstrated.
    await new Promise((r) => setTimeout(r, 380))
    setSent(true)
  })

  return (
    <AuthLayout title="Forgot password" subtitle="We'll email a secure reset link to your work address.">
      {sent ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto text-success" />
          <p className="mt-3 text-sm font-semibold text-ink">Check your inbox</p>
          <p className="mt-1 text-[13px] text-muted">If an account exists for that email, a reset link is on its way. (Demo — no email is actually sent yet.)</p>
          <Link to="/login" className="mt-5 inline-flex">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <TextInput label="Work email" type="email" required placeholder="name@zeroinfinity.tech" error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-xs font-medium text-brand-600">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}

const resetSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type ResetForm = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const [search] = useSearchParams()
  const token = search.get('token')
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onSubmit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 380))
    setDone(true)
  })

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your work account.">
      {!token ? (
        <InfoNote tone="orange">This page needs a valid reset link. Request a new link from “Forgot password”.</InfoNote>
      ) : done ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto text-success" />
          <p className="mt-3 text-sm font-semibold text-ink">Password updated</p>
          <p className="mt-1 text-[13px] text-muted">You can now sign in with your new password. (Demo — no backend persistence yet.)</p>
          <Link to="/login" className="mt-5 inline-flex">
            <Button>Go to sign in</Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <TextInput label="New password" type="password" required error={errors.password?.message} hint="Minimum 8 characters with 1 uppercase and 1 number." {...register('password')} />
          <TextInput label="Confirm password" type="password" required error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
