import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CircleUser } from 'lucide-react'
import { Button, Card, InfoNote, SectionTitle } from '@/components/ui/base'
import { useHeader } from '@/components/layout/page-header'
import { employeeService } from '@/services/employees'
import { notifyUpload } from '@/utils/backend-ops'
import type { EmployeeFormValues } from './employee-schema'
import { employeeSchema } from './employee-schema'
import { DEPARTMENTS, GENDERS, EMPLOYMENT_TYPES, RELATIONSHIP_OPTIONS } from '../constants'

export function EmployeeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useHeader(mode === 'create' ? 'Add employee' : 'Edit employee', [{ label: 'Workspace' }, { label: 'Employees', to: '/employees' }, { label: mode === 'create' ? 'Add employee' : 'Edit employee' }])

  const existing = useQuery({ queryKey: ['employee', employeeId], queryFn: () => employeeService.get(employeeId ?? ''), enabled: mode === 'edit' && !!employeeId })
  const managers = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeeService.list({ status: 'ACTIVE', page: 1, pageSize: 50 }) })

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (mode === 'edit' && existing.data) {
      form.reset({ ...existing.data } as unknown as EmployeeFormValues)
    }
  }, [existing.data, form, mode])

  const createMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      employeeService.create({ ...values, name: `${values.firstName} ${values.lastName}` } as never),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      navigate(`/employees/${created.id}`)
    },
  })
  const updateMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      employeeService.update(employeeId ?? '', { ...values, name: `${values.firstName} ${values.lastName}` } as never),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      navigate(`/employees/${employeeId}`)
    },
  })

  const submitting = createMutation.isPending || updateMutation.isPending
  const errors = form.formState.errors
  const err = createMutation.error ?? updateMutation.error

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-ink">{mode === 'create' ? 'Add a new employee' : 'Edit employee'}</h2>
          <p className="mt-1 text-[13px] text-muted">{mode === 'create' ? 'Create an employee record. Fields marked with * are required.' : "Update the employee's record. Changes are recorded in the activity log."}</p>
        </div>
        <Link to={mode === 'edit' && employeeId ? `/employees/${employeeId}` : '/employees'}>
          <Button variant="secondary"><ArrowLeft size={15} className="mr-1.5" /> {mode === 'create' ? 'Back to directory' : 'Back to profile'}</Button>
        </Link>
      </div>

      <InfoNote tone="blue">
        {mode === 'create'
          ? 'Draft employee record — complete the required fields and resolve highlighted items before creating this employee.'
          : 'Edits update the saved record for this employee.'}
      </InfoNote>

      <form
        className="grid gap-4 lg:grid-cols-3"
        onSubmit={form.handleSubmit((values) => (mode === 'create' ? createMutation.mutate(values) : updateMutation.mutate(values)))}
        noValidate
      >
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <SectionTitle title="Personal details" description="Use the employee's legal name as shown on their documents." />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextInputRhf label="First name" required error={errors.firstName?.message} {...form.register('firstName')} />
              <TextInputRhf label="Last name" required error={errors.lastName?.message} {...form.register('lastName')} />
              <DateInput label="Date of birth" error={errors.dateOfBirth?.message} register={form.register('dateOfBirth')} />
              <SelectInputRhf label="Gender" options={GENDERS.map((g) => ({ value: g, label: g }))} register={form.register('gender')} />
              <TextInputRhf label="Nationality" {...form.register('nationality')} />
              <ReadOnly label="Employee ID" value={mode === 'edit' ? employeeId ?? '' : 'Auto-generated on creation'} hint="Assigned by the system · read-only" />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Contact information" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextInputRhf label="Work email" type="email" required error={errors.workEmail?.message} {...form.register('workEmail')} />
              <TextInputRhf label="Mobile number" required error={errors.phone?.message} {...form.register('phone')} />
              <TextInputRhf label="Personal email" type="email" error={errors.personalEmail?.message} {...form.register('personalEmail')} />
              <TextInputRhf label="Residential address" error={errors.address?.message} {...form.register('address')} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Job details" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <SelectInputRhf
                label="Department"
                required
                error={errors.department?.message}
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                register={form.register('department')}
              />
              <TextInputRhf label="Job title" required error={errors.jobTitle?.message} {...form.register('jobTitle')} />
              <DateInput label="Joining date" required error={errors.joiningDate?.message} register={form.register('joiningDate')} />
              <SelectInputRhf
                label="Employment type"
                required
                options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
                register={form.register('employmentType')}
              />
              <SelectInputRhf
                label="Reporting manager"
                options={[{ value: 'Admin', label: 'Admin' }, ...(managers.data?.items ?? []).map((m) => ({ value: m.name, label: m.name }))]}
                register={form.register('reportingManager')}
              />
              <TextInputRhf label="Work location" error={errors.workLocation?.message} {...form.register('workLocation')} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Emergency contact" description="Only used in an emergency. Accessible to authorized HR staff." />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextInputRhf label="Contact name" required error={errors.emergencyContactName?.message} {...form.register('emergencyContactName')} />
              <SelectInputRhf
                label="Relationship"
                required
                options={RELATIONSHIP_OPTIONS}
                register={form.register('emergencyContactRelationship')}
              />
              <TextInputRhf label="Phone number" required error={errors.emergencyContactPhone?.message} {...form.register('emergencyContactPhone')} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-ink">Profile photo</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600" aria-hidden="true"><CircleUser size={22} /></span>
              <div>
                <Button type="button" variant="secondary" size="sm" onClick={() => notifyUpload('Profile photo', 'JPG or PNG ≤2 MB')}>
                  Upload photo
                </Button>
                <p className="mt-1.5 text-xs text-muted">JPG or PNG · Max 2 MB</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-ink">CV / Résumé</h3>
            <p className="mt-1 text-[13px] text-muted">PDF or DOCX · Maximum 5 MB</p>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => notifyUpload('CV', 'PDF/DOCX ≤5 MB')}>
              Upload CV
            </Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-ink">Employment status</h3>
            <p className="mt-2 text-[13px] text-muted">
              {mode === 'create'
                ? 'New employees start on probation. HR can update the status from the employee actions menu.'
                : 'Use Change status from the employee actions menu to update status with an audit reason.'}
            </p>
          </Card>
          <InfoNote tone="blue">
            Compensation data is not part of this record. Salary access remains restricted to authorized Payroll users.
          </InfoNote>
        </div>

        <div className="lg:col-span-3">
          {err ? <p className="mb-3 rounded-lg bg-danger-tint px-4 py-3 text-[13px] text-danger">{String((err as Error).message)}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[13px] text-muted">
              {Object.keys(errors).length > 0
                ? 'Resolve the highlighted fields to continue.'
                : mode === 'create'
                  ? 'A valid save creates the next employee ID, then opens the new profile.'
                  : 'Save Changes validates and persists the record.'}
            </p>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={submitting}>
                {mode === 'create' ? 'Create Employee' : 'Save Changes'}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Demo build: employee creation uses the demo adapter; nothing is persisted.</p>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------ Form controls ------------------------------ */

type FieldTextProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string; hint?: string }

function TextInputRhf({ label, required, error, hint, ...rest }: FieldTextProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <input
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-err` : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${error ? 'border-danger' : 'border-line'}`}
        {...rest}
      />
      {error ? <p id={`${label}-err`} role="alert" className="mt-1.5 text-xs text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

function DateInput({ label, required, error, register }: { label: string; required?: boolean; error?: string; register: Record<string, unknown> }) {
  return (
    <div>
      <p className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </p>
      <input type="date" className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" {...register} />
      {error ? <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  )
}

function SelectInputRhf({ label, required, options, register }: { label: string; required?: boolean; error?: string; options: Array<{ value: string; label: string }>; register: Record<string, unknown> }) {
  return (
    <div>
      <p className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </p>
      <select className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm" {...register}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="mb-1.5 block text-[13px] font-medium text-ink">{label}</p>
      <input readOnly value={value} className="h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-muted" />
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
