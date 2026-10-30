import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Button, Card, InfoNote, SectionTitle } from '@/components/ui/base'
import { SelectInput, TextArea, TextInput } from '@/components/ui/form'
import { StatusBadge, attendanceTone } from '@/components/data-display/status'
import { attendanceService } from '@/services/attendance'
import { employeeService } from '@/services/employees'
import { db } from '@/services/demo/store'
import { deriveAttendanceHint, parseClockToMinutes, formatNptDate } from '@/utils/npt'

type Mode = 'add' | 'correct'

export function AttendanceManualTab() {
  const [params] = useSearchParams()
  const location = useLocation()
  const queryClient = useQueryClient()

  const modeParam = params.get('mode') as Mode | null
  const initialMode: Mode = modeParam === 'add' || modeParam === 'correct'
    ? modeParam
    : location.pathname.endsWith('/corrections')
      ? 'correct'
      : 'add'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [employeeId, setEmployeeId] = useState(params.get('employeeId') ?? 'EMP-001')
  const [date, setDate] = useState(params.get('date') ?? db.today)
  const [shiftLabel, setShiftLabel] = useState('09:30 – 17:30')
  const [checkIn, setCheckIn] = useState('09:30 AM')
  const [checkOut, setCheckOut] = useState('05:30 PM')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const employeesQuery = useQuery({
    queryKey: ['employees', 'options', 'manual'],
    queryFn: () => employeeService.list({ page: 1, pageSize: 200 }),
  })
  const employees = employeesQuery.data?.items ?? []

  const existingQuery = useQuery({
    queryKey: ['attendance', 'history', employeeId, date],
    enabled: mode === 'correct',
    queryFn: () => attendanceService.historyFor(employeeId, date),
  })
  const existing = existingQuery.data ?? []
  const recordExists = existing.length > 0

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'add') {
        return attendanceService.addMissingRecord({ employeeId, date, checkIn, checkOut, reason, shiftLabel })
      }
      return attendanceService.correctRecord({
        employeeId,
        date,
        checkIn,
        checkOut,
        reason,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!employeeId) next.employeeId = 'Select an employee.'
    if (!date) next.date = 'Pick the attendance date.'
    if (!reason.trim()) next.reason = 'A documented reason is required for audit.'
    for (const [field, value] of [['checkIn', checkIn], ['checkOut', checkOut]] as const) {
      if (value && parseClockToMinutes(value) == null) next[field] = 'Use a time like 09:30 AM.'
    }
    if (checkIn && checkOut && parseClockToMinutes(checkOut) != null && parseClockToMinutes(checkOut)! < parseClockToMinutes(checkIn)!) {
      next.checkOut = 'Check-out cannot be before check-in.'
    }
    if (mode === 'correct' && !recordExists) {
      next.date = 'No existing record for this employee/date — switch to "Add missing record".'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.reset()
    if (validate()) mutation.mutate()
  }

  // Audit-note preview mirrors what the backend will record (server is authoritative).
  const preview = `Admin will write: "${mode === 'add' ? 'attendance.added' : 'attendance.corrected'}" · ${employeeId} · ${date} · check-in ${checkIn || '—'}, check-out ${checkOut || '—'} · reason: ${reason || '—'}`

  return (
    <div className="space-y-4">
      <InfoNote tone="orange">
        Manual entries and corrections are audited. The original values are retained; corrections bump the record version.
        In demo mode these changes live only for this browser session and are not persisted.
      </InfoNote>

      <div className="inline-flex rounded-lg border border-line bg-white p-1" role="tablist" aria-label="Manual entry type">
        {(['add', 'correct'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setErrors({}); mutation.reset() }}
            className={`rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
              mode === m ? 'bg-brand-600 text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {m === 'add' ? 'Add missing record' : 'Correct existing record'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <form className="space-y-4" onSubmit={submit} noValidate aria-label="Manual attendance form">
            <SelectInput
              label="Employee"
              required
              value={employeeId}
              error={errors.employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={employees.length === 0
                ? [{ value: employeeId, label: employeeId }]
                : employees.map((e) => ({ value: e.id, label: `${e.name} · ${e.id} · ${e.department}` }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Date"
                type="date"
                required
                value={date}
                error={errors.date}
                onChange={(e) => setDate(e.target.value)}
              />
              {mode === 'add' ? (
                <SelectInput
                  label="Shift"
                  value={shiftLabel}
                  onChange={(e) => setShiftLabel(e.target.value)}
                  options={[
                    { value: '09:30 – 17:30', label: 'Standard · 09:30 – 17:30' },
                    { value: '10:00 – 18:00', label: 'Late shift · 10:00 – 18:00' },
                  ]}
                />
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Check-in"
                type="time"
                required
                value={checkIn}
                error={errors.checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
              <TextInput
                label="Check-out"
                type="time"
                value={checkOut}
                error={errors.checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <TextArea
              label="Reason for audit"
              required
              placeholder="e.g. Kiosk sync delay verified with the front desk"
              value={reason}
              error={errors.reason}
              onChange={(e) => setReason(e.target.value)}
            />

            {mutation.isError ? (
              <InfoNote tone="red">{(mutation.error as Error).message}</InfoNote>
            ) : null}
            {mutation.isSuccess ? (
              <InfoNote tone="green">
                {mode === 'add' ? 'Missing record added' : 'Record corrected'} — audit entry written (
                <span className="font-mono text-xs">{mode === 'add' ? 'attendance.added' : 'attendance.corrected'}</span>).
                This is a demo adapter action and is not persisted; refresh resets the demo snapshot.
              </InfoNote>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button type="submit" loading={mutation.isPending}>
                {mode === 'add' ? 'Add record' : 'Save correction'}
              </Button>
              <Link to="/attendance/records" className="text-[13px] font-medium text-brand-600 hover:underline">
                View attendance records →
              </Link>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <SectionTitle title="Audit note preview" description="Matches the server-side audit trail format." />
            <p className="mt-3 rounded-lg border border-line bg-[#F8FAFD] px-4 py-3 font-mono text-xs leading-relaxed text-muted">
              {preview}
            </p>
          </Card>

          {mode === 'correct' ? (
            <Card className="p-6">
              <SectionTitle title="Current record" description="Original values are retained server-side." />
              {existingQuery.isLoading ? (
                <p className="mt-3 text-[13px] text-muted">Checking for an existing record…</p>
              ) : recordExists ? (
                <div className="mt-3 space-y-3 text-[13px]">
                  {existing.map((r) => {
                    const hint = deriveAttendanceHint({ date: r.date, isFuture: false, onApprovedLeave: r.status === 'ON_LEAVE', checkInMinutes: parseClockToMinutes(r.checkIn ?? '') , checkOutMinutes: parseClockToMinutes(r.checkOut ?? '') })
                    return (
                      <div key={r.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={hint.status} tone={attendanceTone(hint.status)} />
                          <span className="font-mono text-[10px] text-muted">v{r.version}</span>
                        </div>
                        <dl className="mt-2 space-y-1 text-muted">
                          <div className="flex justify-between"><dt>Check-in</dt><dd className="text-ink">{r.checkIn ?? '—'}</dd></div>
                          <div className="flex justify-between"><dt>Check-out</dt><dd className="text-ink">{r.checkOut ?? '—'}</dd></div>
                          <div className="flex justify-between"><dt>Date</dt><dd className="text-ink">{formatNptDate(`${r.date}T00:00:00Z`)}</dd></div>
                        </dl>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-muted">
                  No record exists for {employeeId} on this date. Switch to <strong>Add missing record</strong>.
                </p>
              )}
            </Card>
          ) : (
            <Card className="p-6">
              <SectionTitle title="Rules" description="Applied on the backend when live." />
              <ul className="mt-3 space-y-2 text-[13px] text-muted">
                <li>• Late = check-in after 09:30 NPT.</li>
                <li>• Approved leave is separate from absence.</li>
                <li>• Corrections bump the record version; the original never changes silently.</li>
                <li>• Every action requires a documented reason.</li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
