import { useState } from 'react'
import { Badge, Button, InfoNote } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { SelectInput, TextArea, TextInput } from '@/components/ui/form'
import type { Employee, OrgUser } from '@/types/domain'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, ROLES } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import { settingsService } from '@/services/settings'
import { db } from '@/services/demo/store'

export function SystemRoleSelector({
  value,
  currentRole,
  onChange,
  label = 'Select system role (Super Admin only)',
}: {
  value: Role
  currentRole?: Role
  onChange: (role: Role) => void
  label?: string
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      <div className="grid gap-2">
        {ROLES.map((r) => {
          const selected = value === r
          const tone = r === 'SUPER_ADMIN' ? 'blue' : r === 'HR_ADMIN' ? 'green' : 'purple'
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={`flex items-start justify-between gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                selected
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                  : 'border-line bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{ROLE_LABELS[r]}</span>
                  {currentRole === r ? <Badge tone="gray">Current</Badge> : null}
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{ROLE_DESCRIPTIONS[r]}</p>
              </div>
              <Badge tone={tone}>{ROLE_PERMISSIONS[r].length} perms</Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AssignRoleDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (role: Role, status: OrgUser['status'], reason: string) => void
}) {
  const existingUser = settingsService.getEmployeeUser(employee.id)
  const currentRole = existingUser?.role ?? 'EMPLOYEE'
  const [role, setRole] = useState<Role>(currentRole)
  const [status, setStatus] = useState<OrgUser['status']>(existingUser?.status ?? 'ACTIVE')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A documented governance reason is required when assigning or changing system roles.')
      return
    }
    setError('')
    onConfirm(role, status, reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Change system-level role (Super Admin only)"
      description={`Configure system-level role permissions and account access for ${employee.name} (${employee.id} · ${employee.jobTitle}).`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Save system role
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}

        <SystemRoleSelector value={role} currentRole={currentRole} onChange={setRole} />

        <SelectInput
          label="Workspace account status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrgUser['status'])}
          options={[
            { value: 'ACTIVE', label: 'Active (Full role access enabled)' },
            { value: 'INVITED', label: 'Invited (Pending onboarding login)' },
            { value: 'DISABLED', label: 'Disabled (Workspace login suspended)' },
          ]}
        />

        <TextArea
          label="Audit reason for system role change"
          required
          placeholder="e.g. Promoted to HR Admin by Super Admin to oversee people operations"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

export function ChangeStatusDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (status: 'ACTIVE' | 'PROBATION', reason: string) => void
}) {
  const [status, setStatus] = useState<'ACTIVE' | 'PROBATION'>(employee.status === 'PROBATION' ? 'ACTIVE' : 'PROBATION')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A documented reason is required for the audit log.')
      return
    }
    setError('')
    onConfirm(status, reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Change employment status"
      description={`Update active/probation status for ${employee.name} (${employee.id}).`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Save status
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <SelectInput
          label="New status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'PROBATION')}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'PROBATION', label: 'Probation' },
          ]}
        />
        <TextArea
          label="Reason for audit"
          required
          placeholder="e.g. Completed 3-month probation review"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

export function TerminateEmployeeDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (input: { terminationDate: string; reason: string }) => void
}) {
  const [terminationDate, setTerminationDate] = useState(db.today)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A termination reason is required for statutory and audit compliance.')
      return
    }
    setError('')
    onConfirm({ terminationDate: terminationDate || db.today, reason: reason.trim() })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Terminate / Sack employment"
      description={`End employment for ${employee.name} (${employee.id}). Login access is immediately disabled while historical payroll, attendance, leave, and task records are preserved.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={submit}>
            Confirm termination
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <InfoNote tone="orange">
          Terminating sets employment status to <strong>TERMINATED</strong>, revokes active login sessions, and preserves all historical payroll, attendance, leave, and project/task audit trails.
        </InfoNote>
        <TextInput
          label="Effective termination date"
          type="date"
          required
          value={terminationDate}
          onChange={(e) => setTerminationDate(e.target.value)}
        />
        <TextArea
          label="Termination / dismissal reason"
          required
          placeholder="e.g. Contract conclusion / involuntary dismissal following disciplinary review"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

export function DeactivateEmployeeDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A documented reason is required to temporarily deactivate an account.')
      return
    }
    setError('')
    onConfirm(reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Deactivate account (Temporary suspension)"
      description={`Temporarily disable workspace login for ${employee.name} (${employee.id}) while preserving all records. The account can be reactivated later by an authorized administrator.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={submit}>
            Deactivate account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <TextArea
          label="Reason for temporary deactivation"
          required
          placeholder="e.g. Extended unpaid sabbatical / security credential hold"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

export function ReactivateEmployeeDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A documented reason is required to reactivate an account.')
      return
    }
    setError('')
    onConfirm(reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Reactivate employee account"
      description={`Restore active employment status and workspace login access for ${employee.name} (${employee.id}).`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Reactivate account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <TextArea
          label="Reason for reactivation"
          required
          placeholder="e.g. Returned from sabbatical / security clearance restored"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

export function DeleteEmployeeDialog({
  employee,
  onClose,
  pending,
  onConfirm,
}: {
  employee: Employee
  onClose: () => void
  pending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('A documented reason is required to archive/remove an account.')
      return
    }
    setError('')
    onConfirm(reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Remove / Archive account (Super Admin only)"
      description={`Soft-delete and archive ${employee.name} (${employee.id}) from active directories without destroying historical financial, attendance, leave, or audit records.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={submit}>
            Archive account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <InfoNote tone="blue">
          Archiving removes this account from active operational rosters and revokes login while keeping statutory payroll, attendance, and audit records intact.
        </InfoNote>
        <TextArea
          label="Reason for account archival"
          required
          placeholder="e.g. Post-retention archival approved by Super Admin"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}
