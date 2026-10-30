import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { Avatar, Badge, Button, Card, InfoNote } from '@/components/ui/base'
import { Dialog } from '@/components/ui/overlay'
import { SelectInput, TextArea } from '@/components/ui/form'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, ROLES, PERMISSION_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import { SettingsSubNav } from '@/modules/settings/SettingsSubNav'
import { settingsService } from '@/services/settings'
import { db } from '@/services/demo/store'
import { useAuth } from '@/app/auth-context'

const roleBadgeTone = (role: Role): 'blue' | 'green' | 'purple' =>
  role === 'SUPER_ADMIN' ? 'blue' : role === 'HR_ADMIN' ? 'green' : 'purple'

export function RolesSettingsPage() {
  useHeader('Roles', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/company' }, { label: 'Roles' }])
  const { session, can } = useAuth()
  const queryClient = useQueryClient()
  const [assignRoleTarget, setAssignRoleTarget] = useState<Role | null>(null)
  const [roleError, setRoleError] = useState('')

  const usersQuery = useQuery({
    queryKey: ['settings', 'users', 'all'],
    queryFn: () => settingsService.users('', 1, 100),
  })

  const assignMut = useMutation({
    mutationFn: (input: { employeeId: string; role: Role; reason: string }) =>
      settingsService.assignEmployeeRole({
        employeeId: input.employeeId,
        role: input.role,
        reason: input.reason,
        actor: session?.name ?? 'Super Admin',
        actorRole: session?.role,
      }),
    onSuccess: () => {
      setRoleError('')
      void queryClient.invalidateQueries({ queryKey: ['settings', 'users'] })
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      setAssignRoleTarget(null)
    },
    onError: (err) => setRoleError(err instanceof Error ? err.message : 'Unable to change system role.'),
  })

  const allUsers = usersQuery.data?.items ?? db.users

  return (
    <div className="space-y-4">
      <SettingsSubNav />
      <PageHeaderBar
        title="System Roles vs. Project/Team Positions"
        description="Only Super Admin can change the 3 system-level roles below. Project Lead and Team Lead positions are scoped per project and do not grant HR Admin or Super Admin permissions."
      >
        {can('settings.roles') ? (
          <Button onClick={() => setAssignRoleTarget('HR_ADMIN')}>
            <ShieldCheck size={15} className="mr-1.5" /> Assign system role
          </Button>
        ) : null}
      </PageHeaderBar>

      {roleError ? <InfoNote tone="red">{roleError}</InfoNote> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role) => {
          const members = allUsers.filter((u) => u.role === role)
          return (
            <Card key={role} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{ROLE_LABELS[role]}</h3>
                  <Badge tone={roleBadgeTone(role)}>{ROLE_PERMISSIONS[role].length} permissions</Badge>
                </div>
                <p className="mt-2 text-[13px] text-muted">{ROLE_DESCRIPTIONS[role]}</p>

                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Assigned members ({members.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {members.length === 0 ? (
                      <span className="text-xs text-muted">No users assigned</span>
                    ) : (
                      members.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink"
                        >
                          <Avatar name={m.name} size="xs" tone="blue" />
                          {m.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
                  {ROLE_PERMISSIONS[role].slice(0, 8).map((p) => (
                    <li key={p} className="flex items-center gap-2 text-muted">
                      <span className="text-success">✓</span> {PERMISSION_LABELS[p]}
                    </li>
                  ))}
                  {ROLE_PERMISSIONS[role].length > 8 ? (
                    <li className="text-xs text-muted">+ {ROLE_PERMISSIONS[role].length - 8} more capabilities</li>
                  ) : null}
                </ul>
              </div>

              {can('settings.roles') ? (
                <div className="mt-5 border-t border-line pt-3">
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setAssignRoleTarget(role)}>
                    <ShieldCheck size={14} className="mr-1.5" /> Assign employee to {ROLE_LABELS[role]}
                  </Button>
                </div>
              ) : null}
            </Card>
          )
        })}
      </div>

      <InfoNote tone="blue">
        <strong>Separation of Concerns:</strong> An employee with the <strong>Employee</strong> system role can be appointed as a <strong>Main Project Lead</strong> or <strong>Team Lead</strong> inside specific projects without receiving HR Admin or Super Admin privileges.
      </InfoNote>

      {assignRoleTarget ? (
        <AssignRoleQuickDialog
          initialRole={assignRoleTarget}
          onClose={() => setAssignRoleTarget(null)}
          pending={assignMut.isPending}
          onConfirm={(employeeId, role, reason) => assignMut.mutate({ employeeId, role, reason })}
        />
      ) : null}
    </div>
  )
}

function AssignRoleQuickDialog({
  initialRole,
  onClose,
  pending,
  onConfirm,
}: {
  initialRole: Role
  onClose: () => void
  pending: boolean
  onConfirm: (employeeId: string, role: Role, reason: string) => void
}) {
  const [employeeId, setEmployeeId] = useState(db.employees[0]?.id ?? 'EMP-001')
  const [role, setRole] = useState<Role>(initialRole)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!employeeId) {
      setError('Please select an employee.')
      return
    }
    if (!reason.trim()) {
      setError('A documented reason is required for the audit log.')
      return
    }
    setError('')
    onConfirm(employeeId, role, reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Assign system role to employee (Super Admin)"
      description="Select an employee from the directory and grant them the appropriate system-level role."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Assign role
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <SelectInput
          label="Employee"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          options={db.employees.map((e) => ({
            value: e.id,
            label: `${e.name} (${e.id}) · ${e.jobTitle} — Current: ${ROLE_LABELS[settingsService.getEmployeeRole(e.id)]}`,
          }))}
        />
        <SelectInput
          label="Target system role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={ROLES.map((r) => ({
            value: r,
            label: `${ROLE_LABELS[r]} (${ROLE_PERMISSIONS[r].length} permissions)`,
          }))}
        />
        <TextArea
          label="Audit reason"
          required
          placeholder="e.g. Delegated HR management authority by Super Admin"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}
