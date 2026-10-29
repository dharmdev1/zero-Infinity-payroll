import { useState } from 'react'
import { ArrowRight, RefreshCw, Trash2, UserMinus } from 'lucide-react'
import { Badge, Button, InfoNote } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { Dialog as Modal } from '@/components/ui/overlay'
import type { Employee } from '@/types/domain'

/** Change employment status: Active ↔ Probation with a required audit reason. */
export function ChangeStatusDialog({ employee, onClose, onConfirm, pending }: { employee: Employee; onClose: () => void; onConfirm: (status: 'ACTIVE' | 'PROBATION', reason: string) => void; pending: boolean }) {
  const [status, setStatus] = useState<'ACTIVE' | 'PROBATION'>(employee.status === 'ACTIVE' ? 'PROBATION' : 'ACTIVE')
  const [reason, setReason] = useState('')
  const reasonError = reason.trim().length < 10 ? 'Reason is required (minimum 10 characters).' : null

  return (
    <Modal
      open
      onClose={onClose}
      title="Change employment status"
      description={`${employee.name} · ${employee.id} · Current status: ${employeeStatusLabelLocal(employee.status)}`}
      icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><RefreshCw size={20} /></span>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(status, reason)} loading={pending} disabled={!!reasonError}>Update Status</Button>
        </>
      }
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">New status</legend>
        {(['ACTIVE', 'PROBATION'] as const).map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${status === option ? 'border-brand-500 bg-brand-50/50' : 'border-line'}`}
          >
            <input
              type="radio"
              name="new-status"
              checked={status === option}
              onChange={() => setStatus(option)}
              className="accent-[#1F57E0]"
            />
            <span>
              <span className="block text-[13px] font-semibold text-ink">{employeeStatusLabelLocal(option)}</span>
              <span className="block text-xs text-muted">{option === 'ACTIVE' ? 'Full workspace access' : 'Employed, with probation review pending'}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-4">
        <TextInput
          label="Reason for status change"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={reasonError ?? undefined}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">Status changes are recorded in the activity log.</p>
      <InfoNote tone="blue">
        This change does not revoke workspace access. To disable access, choose Deactivate from the employee actions menu.
      </InfoNote>
      <p className="mt-2 text-xs text-muted">Demo adapter: the change is not persisted.</p>
    </Modal>
  )
}

export function DeactivateEmployeeDialog({ employee, onClose, onConfirm, pending }: { employee: Employee; onClose: () => void; onConfirm: (reason: string) => void; pending: boolean }) {
  const [reason, setReason] = useState('Employment ended — confirmed by HR')
  const reasonError = reason.trim().length < 10 ? 'Reason is required (minimum 10 characters).' : null
  return (
    <Modal
      open
      onClose={onClose}
      title={`Deactivate ${employee.name}?`}
      description={`${employee.id} · ${employee.jobTitle} · ${employee.department}`}
      icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-tint text-warning"><UserMinus size={20} /></span>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={pending} disabled={!!reasonError} onClick={() => onConfirm(reason)}>
            Deactivate Employee
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <Badge tone="green" dot>Active</Badge>
        <ArrowRight size={16} className="text-muted" aria-hidden="true" />
        <Badge tone="gray" dot>Inactive</Badge>
      </div>
      <p className="text-[13px] text-ink-deep">
        This employee will lose workspace access. Their profile, documents and employment history will be retained. You can reactivate the employee later.
      </p>
      <div className="mt-4">
        <TextInput label="Reason for deactivation" required value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError ?? undefined} />
        <p className="mt-1.5 text-xs text-muted">Saved to the employee activity log.</p>
      </div>
      <InfoNote tone="orange">
        2 tasks are in progress. Reassign outstanding work in Tasks &amp; projects before completing offboarding.
      </InfoNote>
    </Modal>
  )
}

export function DeleteEmployeeDialog({ employee, onClose, onConfirm, pending }: { employee: Employee; onClose: () => void; onConfirm: (reason: string) => void; pending: boolean }) {
  const [reason, setReason] = useState('Duplicate record — deletion approved by HR')
  const [confirmId, setConfirmId] = useState('')
  const reasonError = reason.trim().length < 10 ? 'Reason is required (minimum 10 characters).' : null
  const idMismatch = confirmId.trim() !== employee.id ? 'The employee ID must match exactly.' : null
  return (
    <Modal
      open
      onClose={onClose}
      title="Permanently delete employee?"
      description={`${employee.name} · ${employee.id} · ${employee.department}`}
      icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger"><Trash2 size={20} /></span>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={pending} disabled={!!reasonError || !!idMismatch} onClick={() => onConfirm(reason)}>
            Delete Permanently
          </Button>
        </>
      }
    >
      <InfoNote tone="red" icon={<span aria-hidden="true">⚠</span>}>
        This cannot be undone. The employee profile, uploaded CV and documents will be permanently removed. Deactivate instead if you need to retain the record.
      </InfoNote>
      <p className="mt-3 text-[13px] text-ink-deep">
        Linked attendance, leave and task history remains in its source modules under the company's retention policy. An audit entry is retained.
      </p>
      <div className="mt-4 space-y-3">
        <TextInput label="Reason for deletion" required value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError ?? undefined} />
        <TextInput label={`Type ${employee.id} to confirm`} required value={confirmId} onChange={(e) => setConfirmId(e.target.value)} error={idMismatch ?? undefined} hint="The employee ID must match exactly." />
      </div>
    </Modal>
  )
}

function employeeStatusLabelLocal(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'PROBATION':
      return 'Probation'
    default:
      return 'Inactive'
  }
}



