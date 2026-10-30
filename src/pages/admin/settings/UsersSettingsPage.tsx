import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserPlus, UserX } from 'lucide-react'
import { Avatar, Badge, Button, EmptyState, InfoNote } from '@/components/ui/base'
import { SelectInput, TextArea, TextInput } from '@/components/ui/form'
import { Dialog } from '@/components/ui/overlay'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { settingsService } from '@/services/settings'
import { employeeService } from '@/services/employees'
import { db } from '@/services/demo/store'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, ROLES } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import type { OrgUser } from '@/types/domain'
import { formatNptDateTime } from '@/utils/npt'
import { SettingsSubNav } from '@/modules/settings/SettingsSubNav'
import { useAuth } from '@/app/auth-context'
import { SystemRoleSelector, TerminateEmployeeDialog } from '@/modules/employees/employee-dialogs'

const roleTone = (r: Role): 'blue' | 'green' | 'purple' =>
  r === 'SUPER_ADMIN' ? 'blue' : r === 'HR_ADMIN' ? 'green' : 'purple'
const statusTone = (s: OrgUser['status']): 'green' | 'orange' | 'gray' =>
  s === 'ACTIVE' ? 'green' : s === 'INVITED' ? 'orange' : 'gray'

export function UsersSettingsPage() {
  useHeader('Users & roles', [
    { label: 'Workspace' },
    { label: 'Settings', to: '/settings/company' },
    { label: 'Users' },
  ])
  const { session, can } = useAuth()
  const queryClient = useQueryClient()
  const isSuperAdmin = session?.role === 'SUPER_ADMIN'

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [manageUser, setManageUser] = useState<OrgUser | null>(null)
  const [terminateUser, setTerminateUser] = useState<OrgUser | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  const users = useQuery({
    queryKey: ['settings', 'users', { search, page }],
    placeholderData: keepPreviousData,
    queryFn: () => settingsService.users(search, page, 10),
  })

  const refresh = () => {
    setActionError('')
    void queryClient.invalidateQueries({ queryKey: ['settings', 'users'] })
    void queryClient.invalidateQueries({ queryKey: ['settings', 'audit'] })
    void queryClient.invalidateQueries({ queryKey: ['employees'] })
  }

  const updateUserMut = useMutation({
    mutationFn: (input: {
      userId: string
      role: Role
      status: OrgUser['status']
      employeeId: string | null
      reason: string
    }) =>
      settingsService.updateUser(input.userId, {
        role: input.role,
        status: input.status,
        employeeId: input.employeeId,
        reason: input.reason,
        actor: session?.name ?? 'Admin',
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setManageUser(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to update user.'),
  })

  const inviteUserMut = useMutation({
    mutationFn: (input: { name: string; email: string; employeeId: string | null; role: Role }) =>
      settingsService.inviteUser({
        ...input,
        actor: session?.name ?? 'Admin',
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setInviteOpen(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to create user.'),
  })

  const terminateMut = useMutation({
    mutationFn: (input: { employeeId: string; terminationDate: string; reason: string }) =>
      employeeService.terminate(input.employeeId, {
        terminationDate: input.terminationDate,
        reason: input.reason,
        actor: session?.name,
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setTerminateUser(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to terminate account.'),
  })

  const columns: Array<Column<OrgUser>> = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} tone="blue" size="sm" />
          <div>
            <p className="font-medium text-ink">{u.name}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      render: (u) => <span className="font-mono text-xs text-muted">{u.employeeId ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'System Role',
      align: 'center',
      render: (u) => <Badge tone={roleTone(u.role)}>{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: 'status',
      header: 'Login Status',
      align: 'center',
      render: (u) => (
        <Badge tone={statusTone(u.status)} dot>
          {u.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Last active',
      align: 'right',
      render: (u) => formatNptDateTime(u.lastActiveAt),
    },
    {
      key: 'actions',
      header: 'Governance Actions',
      align: 'right',
      render: (u) => {
        const isProtectedFromHr = !isSuperAdmin && (u.role === 'SUPER_ADMIN' || u.role === 'HR_ADMIN')
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isProtectedFromHr}
              title={isProtectedFromHr ? 'Only a Super Admin can modify HR Admin or Super Admin accounts' : undefined}
              onClick={() => setManageUser(u)}
            >
              <ShieldCheck size={14} className="mr-1" /> {isSuperAdmin ? 'Manage role' : 'Manage status'}
            </Button>
            {u.employeeId && !isProtectedFromHr && u.status !== 'DISABLED' ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setTerminateUser(u)}
                title="Terminate / Sack employment and disable login"
              >
                <UserX size={14} className="mr-1" /> Sack
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const linkedTerminateEmployee = terminateUser?.employeeId
    ? db.employees.find((e) => e.id === terminateUser.employeeId) ?? null
    : null

  return (
    <div className="space-y-4">
      <SettingsSubNav />
      <PageHeaderBar
        title="Users & system role governance"
        description={
          isSuperAdmin
            ? 'Super Admin authority: Create HR Admin or Employee accounts, change system roles, and terminate or suspend access.'
            : 'HR Admin view: Provision Employee accounts and manage ordinary employee login status. System roles are managed exclusively by Super Admin.'
        }
      >
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput.trim())
            setPage(1)
          }}
        >
          <TextInput
            className="w-52"
            placeholder="Search users or role"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search users"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={15} className="mr-1.5" /> {isSuperAdmin ? 'Create HR Admin / Employee' : 'Invite Employee'}
        </Button>
      </PageHeaderBar>

      {actionError ? <InfoNote tone="red">{actionError}</InfoNote> : null}

      {isSuperAdmin ? (
        <div className="grid gap-3 md:grid-cols-3">
          {ROLES.map((r) => {
            const count = db.users.filter((u) => u.role === r && u.status !== 'DISABLED').length
            return (
              <div
                key={r}
                className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{ROLE_LABELS[r]}</span>
                    <Badge tone={roleTone(r)}>{ROLE_PERMISSIONS[r].length} permissions</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{ROLE_DESCRIPTIONS[r]}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
                  <span className="font-medium text-muted">{count} active account(s)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput(r)
                      setSearch(r)
                      setPage(1)
                    }}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    Filter role →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={users.data?.items ?? []}
        rowKey={(u) => u.id}
        loading={users.isLoading}
        emptyState={<EmptyState title="No users match" />}
        footer={<Pagination page={page} pageSize={10} total={users.data?.total ?? 0} onPage={setPage} countsLabel="users" />}
      />

      {manageUser ? (
        <ManageUserAccessDialog
          user={manageUser}
          canChangeSystemRole={can('settings.roles')}
          onClose={() => setManageUser(null)}
          pending={updateUserMut.isPending}
          onConfirm={(role, status, employeeId, reason) =>
            updateUserMut.mutate({ userId: manageUser.id, role, status, employeeId, reason })
          }
        />
      ) : null}

      {terminateUser && linkedTerminateEmployee ? (
        <TerminateEmployeeDialog
          employee={linkedTerminateEmployee}
          onClose={() => setTerminateUser(null)}
          pending={terminateMut.isPending}
          onConfirm={({ terminationDate, reason }) =>
            terminateMut.mutate({
              employeeId: linkedTerminateEmployee.id,
              terminationDate,
              reason,
            })
          }
        />
      ) : null}

      {inviteOpen ? (
        <InviteUserDialog
          canAssignAdminRoles={can('settings.roles')}
          onClose={() => setInviteOpen(false)}
          pending={inviteUserMut.isPending}
          onConfirm={(input) => inviteUserMut.mutate(input)}
        />
      ) : null}
    </div>
  )
}

function ManageUserAccessDialog({
  user,
  canChangeSystemRole,
  onClose,
  pending,
  onConfirm,
}: {
  user: OrgUser
  canChangeSystemRole: boolean
  onClose: () => void
  pending: boolean
  onConfirm: (role: Role, status: OrgUser['status'], employeeId: string | null, reason: string) => void
}) {
  const [role, setRole] = useState<Role>(user.role)
  const [status, setStatus] = useState<OrgUser['status']>(user.status)
  const [employeeId, setEmployeeId] = useState<string>(user.employeeId ?? '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!reason.trim()) {
      setError('Please enter a brief audit reason for this role or status update.')
      return
    }
    setError('')
    onConfirm(canChangeSystemRole ? role : user.role, status, employeeId || null, reason.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={canChangeSystemRole ? 'Manage system role & access' : 'Manage employee account status'}
      description={`Update account settings for ${user.name} (${user.email}).`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}

        {canChangeSystemRole ? (
          <SystemRoleSelector value={role} currentRole={user.role} onChange={setRole} />
        ) : (
          <InfoNote tone="blue">
            System role is locked to <strong>{ROLE_LABELS[user.role]}</strong>. Only a Super Admin can promote or demote system-level roles.
          </InfoNote>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectInput
            label="Account status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrgUser['status'])}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INVITED', label: 'Invited' },
              { value: 'DISABLED', label: 'Disabled' },
            ]}
          />
          <SelectInput
            label="Linked employee record"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'Unlinked account' },
              ...db.employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` })),
            ]}
          />
        </div>

        <TextArea
          label="Audit reason"
          required
          placeholder="e.g. Authorized role / access update"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

function InviteUserDialog({
  canAssignAdminRoles,
  onClose,
  pending,
  onConfirm,
}: {
  canAssignAdminRoles: boolean
  onClose: () => void
  pending: boolean
  onConfirm: (input: { name: string; email: string; employeeId: string | null; role: Role }) => void
}) {
  const [employeeId, setEmployeeId] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('EMPLOYEE')
  const [error, setError] = useState('')

  const allowedRoles = canAssignAdminRoles ? ROLES : (['EMPLOYEE'] as const)

  const handleEmployeeSelect = (empId: string) => {
    setEmployeeId(empId)
    const emp = db.employees.find((e) => e.id === empId)
    if (emp) {
      setName(emp.name)
      setEmail(emp.workEmail)
    }
  }

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and work email are required.')
      return
    }
    setError('')
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      employeeId: employeeId || null,
      role: canAssignAdminRoles ? role : 'EMPLOYEE',
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={canAssignAdminRoles ? 'Create HR Admin or Employee account' : 'Create Employee workspace account'}
      description="Grant workspace access to an employee or administrator and record the action in the audit log."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={submit}>
            Provision account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InfoNote tone="red">{error}</InfoNote> : null}
        <SelectInput
          label="Link to directory employee (optional)"
          value={employeeId}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          options={[
            { value: '', label: 'Select an employee to auto-fill...' },
            ...db.employees.map((e) => ({
              value: e.id,
              label: `${e.name} · ${e.jobTitle} (${e.id})`,
            })),
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Full name"
            required
            placeholder="e.g. Anjali Shrestha"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            label="Work email"
            required
            type="email"
            placeholder="e.g. anjali@zeroinfinity.tech"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <SelectInput
          label="System role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={allowedRoles.map((r) => ({
            value: r,
            label: `${ROLE_LABELS[r]} — ${ROLE_DESCRIPTIONS[r]}`,
          }))}
        />
      </div>
    </Dialog>
  )
}
