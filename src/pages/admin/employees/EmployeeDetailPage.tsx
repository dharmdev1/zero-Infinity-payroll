import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreHorizontal, Pencil, ShieldCheck, UserX } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, InfoNote, Skeleton } from '@/components/ui/base'
import { StatusBadge, employeeStatusLabel, employeeStatusTone } from '@/components/data-display/status'
import {
  AssignRoleDialog,
  DeleteEmployeeDialog,
  DeactivateEmployeeDialog,
  ReactivateEmployeeDialog,
  TerminateEmployeeDialog,
  ChangeStatusDialog,
} from '@/modules/employees/employee-dialogs'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { employeeService } from '@/services/employees'
import { settingsService } from '@/services/settings'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { ROLE_LABELS } from '@/types/rbac'
import type { Permission, Role } from '@/types/rbac'
import type { Employee, OrgUser } from '@/types/domain'
import { OverviewTab } from '@/modules/employees/tabs/OverviewTab'
import { EmployeeAttendanceTab } from '@/modules/employees/tabs/AttendanceTab'
import { EmployeeLeaveTab } from '@/modules/employees/tabs/LeaveTab'
import { EmployeeTasksTab } from '@/modules/employees/tabs/TasksTab'

type DetailTab = 'overview' | 'attendance' | 'leave' | 'tasks'

const ALL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave' },
  { id: 'tasks', label: 'Tasks' },
]

const roleBadgeTone = (r: Role): 'blue' | 'green' | 'purple' =>
  r === 'SUPER_ADMIN' ? 'blue' : r === 'HR_ADMIN' ? 'green' : 'purple'

export function EmployeeDetailPage() {
  const { employeeId = '' } = useParams()
  const { session, can } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleDialog, setRoleDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState(false)
  const [terminateDialog, setTerminateDialog] = useState(false)
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [reactivateDialog, setReactivateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [actionError, setActionError] = useState('')

  const queryClient = useQueryClient()
  const employeeQuery = useQuery({
    queryKey: ['employee', employeeId, session?.employeeId, session?.role],
    queryFn: () => employeeService.get(employeeId, session),
  })
  const employee = employeeQuery.data
  useHeader(employee?.name ?? 'Employee profile', [
    { label: 'Workspace' },
    { label: 'Employees', to: '/employees' },
    { label: employee?.name ?? 'Employee' },
  ])

  const refresh = () => {
    setActionError('')
    void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
    void queryClient.invalidateQueries({ queryKey: ['employees'] })
    void queryClient.invalidateQueries({ queryKey: ['settings', 'users'] })
  }

  const assignRoleMutation = useMutation({
    mutationFn: (input: { role: Role; status: OrgUser['status']; reason: string }) =>
      settingsService.assignEmployeeRole({
        employeeId,
        role: input.role,
        status: input.status,
        reason: input.reason,
        actor: session?.name ?? 'Super Admin',
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setRoleDialog(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to assign role.'),
  })

  const terminateMutation = useMutation({
    mutationFn: (input: { terminationDate: string; reason: string }) =>
      employeeService.terminate(employeeId, {
        terminationDate: input.terminationDate,
        reason: input.reason,
        actor: session?.name,
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setTerminateDialog(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to terminate employee.'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (reason: string) =>
      employeeService.deactivate(employeeId, reason, { name: session?.name, role: session?.role }),
    onSuccess: () => {
      refresh()
      setDeactivateDialog(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to deactivate employee.'),
  })

  const reactivateMutation = useMutation({
    mutationFn: (reason: string) =>
      employeeService.reactivate(employeeId, reason, { name: session?.name, role: session?.role }),
    onSuccess: () => {
      refresh()
      setReactivateDialog(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to reactivate employee.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (reason: string) =>
      employeeService.deletePermanently(employeeId, reason, { name: session?.name, role: session?.role }),
    onSuccess: () => navigate('/employees'),
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to archive employee.'),
  })

  const statusMutation = useMutation({
    mutationFn: (input: { status: 'ACTIVE' | 'PROBATION'; reason: string }) =>
      employeeService.changeStatus(employeeId, input.status, input.reason, {
        name: session?.name,
        role: session?.role,
      }),
    onSuccess: () => {
      refresh()
      setStatusDialog(false)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to change status.'),
  })

  if (employeeQuery.isLoading || !employee) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </Card>
      </div>
    )
  }
  if (employeeQuery.isError) {
    return (
      <EmptyState
        title="Employee not found"
        description="This record may have been archived or you may not have access."
        action={
          <Link to="/employees">
            <Button variant="secondary">Back to directory</Button>
          </Link>
        }
      />
    )
  }

  const assignedRole = settingsService.getEmployeeRole(employee.id)
  const canManageSystemRoles = can('settings.roles')
  const isViewingSelf = session?.employeeId === employee.id
  const canViewFullEmployeeRecords = can('employees.view') || isViewingSelf
  const isHrTargetingAdmin =
    session?.role === 'HR_ADMIN' && (assignedRole === 'HR_ADMIN' || assignedRole === 'SUPER_ADMIN')

  const visibleTabs = canViewFullEmployeeRecords ? ALL_TABS : ALL_TABS.filter((t) => t.id === 'overview')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-canvas"
        >
          <ArrowLeft size={15} /> Back to directory
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          {canManageSystemRoles ? (
            <Button variant="secondary" onClick={() => setRoleDialog(true)}>
              <ShieldCheck size={15} className="mr-1.5" /> Change system role
            </Button>
          ) : null}
          {can('employees.deactivate') && !isHrTargetingAdmin && employee.status !== 'TERMINATED' ? (
            <Button variant="danger" onClick={() => setTerminateDialog(true)}>
              <UserX size={15} className="mr-1.5" /> Terminate / Sack
            </Button>
          ) : null}
          {can('employees.view') ? (
            <MoreActions
              employee={employee}
              can={can}
              isHrTargetingAdmin={isHrTargetingAdmin}
              open={menuOpen}
              setOpen={setMenuOpen}
              onAssignRole={() => setRoleDialog(true)}
              onStatus={() => setStatusDialog(true)}
              onTerminate={() => setTerminateDialog(true)}
              onDeactivate={() => setDeactivateDialog(true)}
              onReactivate={() => setReactivateDialog(true)}
              onDelete={() => setDeleteDialog(true)}
            />
          ) : null}
          {can('employees.edit') ? (
            <Link to={`/employees/${employee.id}/edit`}>
              <Button>
                <Pencil size={15} className="mr-1.5" /> Edit Employee
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {actionError ? <InfoNote tone="red">{actionError}</InfoNote> : null}

      {employee.status === 'TERMINATED' ? (
        <InfoNote tone="red">
          Employment terminated effective <strong>{employee.terminatedAt ?? db.today}</strong>. Reason:{' '}
          {employee.terminationReason ?? 'Recorded in audit log'}. Workspace login is disabled; historical records are preserved.
        </InfoNote>
      ) : null}

      <Card className="overflow-hidden">
        <ProfileHeader
          employee={employee}
          role={assignedRole}
          onManageRole={canManageSystemRoles ? () => setRoleDialog(true) : undefined}
        />
        <div className="border-t border-line">
          <div className="scroll-x" role="tablist" aria-label="Employee sections">
            <div className="flex min-w-max px-6">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-4 py-3.5 text-[13px] font-medium ${
                    tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {tab === 'overview' ? <OverviewTab employee={employee} restricted={!canViewFullEmployeeRecords} /> : null}
      {tab === 'attendance' && canViewFullEmployeeRecords ? <EmployeeAttendanceTab employeeId={employee.id} /> : null}
      {tab === 'leave' && canViewFullEmployeeRecords ? <EmployeeLeaveTab employeeId={employee.id} /> : null}
      {tab === 'tasks' && canViewFullEmployeeRecords ? (
        <EmployeeTasksTab employeeId={employee.id} employeeName={employee.name} />
      ) : null}

      {roleDialog ? (
        <AssignRoleDialog
          employee={employee}
          onClose={() => setRoleDialog(false)}
          pending={assignRoleMutation.isPending}
          onConfirm={(role, status, reason) => assignRoleMutation.mutate({ role, status, reason })}
        />
      ) : null}
      {statusDialog ? (
        <ChangeStatusDialog
          employee={employee}
          onClose={() => setStatusDialog(false)}
          pending={statusMutation.isPending}
          onConfirm={(status, reason) => statusMutation.mutate({ status, reason })}
        />
      ) : null}
      {terminateDialog ? (
        <TerminateEmployeeDialog
          employee={employee}
          onClose={() => setTerminateDialog(false)}
          pending={terminateMutation.isPending}
          onConfirm={({ terminationDate, reason }) => terminateMutation.mutate({ terminationDate, reason })}
        />
      ) : null}
      {deactivateDialog ? (
        <DeactivateEmployeeDialog
          employee={employee}
          onClose={() => setDeactivateDialog(false)}
          pending={deactivateMutation.isPending}
          onConfirm={(reason) => deactivateMutation.mutate(reason)}
        />
      ) : null}
      {reactivateDialog ? (
        <ReactivateEmployeeDialog
          employee={employee}
          onClose={() => setReactivateDialog(false)}
          pending={reactivateMutation.isPending}
          onConfirm={(reason) => reactivateMutation.mutate(reason)}
        />
      ) : null}
      {deleteDialog ? (
        <DeleteEmployeeDialog
          employee={employee}
          onClose={() => setDeleteDialog(false)}
          pending={deleteMutation.isPending}
          onConfirm={(reason) => deleteMutation.mutate(reason)}
        />
      ) : null}
    </div>
  )
}

function ProfileHeader({
  employee,
  role,
  onManageRole,
}: {
  employee: Employee
  role: Role
  onManageRole?: () => void
}) {
  const projectPositions = taskService.getEmployeeProjectPositions(employee.id)
  return (
    <div className="flex flex-wrap items-center gap-5 p-6">
      <Avatar name={employee.name} tone={employee.avatarTone} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[22px] font-bold text-ink">{employee.name}</h2>
          <StatusBadge status={employeeStatusLabel(employee.status)} tone={employeeStatusTone(employee.status)} />
          {onManageRole ? (
            <button
              type="button"
              onClick={onManageRole}
              title="Super Admin: Change system role"
              className="inline-flex items-center hover:opacity-80"
            >
              <Badge tone={roleBadgeTone(role)}>System Role: {ROLE_LABELS[role]}</Badge>
            </button>
          ) : (
            <Badge tone={roleBadgeTone(role)}>System Role: {ROLE_LABELS[role]}</Badge>
          )}
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {employee.jobTitle} · {employee.department}
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          {employee.workEmail} · {employee.phone}
        </p>
        {projectPositions.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Project Positions:</span>
            {projectPositions.map((pos) => (
              <Badge
                key={`${pos.project.id}-${pos.position}`}
                tone={pos.position === 'PROJECT_LEAD' ? 'purple' : pos.position === 'TEAM_LEAD' ? 'blue' : 'gray'}
              >
                {pos.positionLabel} ({pos.project.code})
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="text-right text-[13px] text-muted">
        <p className="font-medium text-ink">Employee ID</p>
        <p className="mt-0.5 font-mono text-xs">{employee.id}</p>
        <p className="mt-3 text-xs">Joined {joinedLabel(employee.joiningDate)}</p>
      </div>
    </div>
  )
}

function joinedLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  const now = new Date(`${db.today}T00:00:00Z`)
  const months = (now.getUTCFullYear() - date.getUTCFullYear()) * 12 + (now.getUTCMonth() - date.getUTCMonth())
  const label = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  return `${label} · ${Math.floor(months / 12)} yrs ${months % 12} mos`
}

function MoreActions({
  employee,
  can,
  isHrTargetingAdmin,
  open,
  setOpen,
  onAssignRole,
  onStatus,
  onTerminate,
  onDeactivate,
  onReactivate,
  onDelete,
}: {
  employee: Employee
  can: (p: Permission) => boolean
  isHrTargetingAdmin: boolean
  open: boolean
  setOpen: (o: boolean) => void
  onAssignRole: () => void
  onStatus: () => void
  onTerminate: () => void
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <MoreHorizontal size={15} className="mr-1.5" /> More actions
      </Button>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-line bg-white p-1.5 shadow-pop" role="menu">
          {can('settings.roles') ? (
            <MenuItem
              label="Change system role"
              description="Super Admin: Set Super Admin, HR Admin or Employee"
              disabled={false}
              onClick={() => {
                setOpen(false)
                onAssignRole()
              }}
            />
          ) : null}
          <MenuItem
            label="Edit profile"
            description="Update employee information"
            disabled={!can('employees.edit')}
            onClick={() => {
              setOpen(false)
              navigate(`/employees/${employee.id}/edit`)
            }}
          />
          <MenuItem
            label="Change status"
            description="Active or probation"
            disabled={!can('employees.status')}
            onClick={() => {
              setOpen(false)
              onStatus()
            }}
          />
          {employee.status === 'INACTIVE' ? (
            <MenuItem
              label="Reactivate account"
              description="Restore active status & login"
              disabled={!can('employees.deactivate') || isHrTargetingAdmin}
              onClick={() => {
                setOpen(false)
                onReactivate()
              }}
            />
          ) : (
            <MenuItem
              label="Deactivate account"
              description="Temporarily suspend login, retain records"
              disabled={!can('employees.deactivate') || isHrTargetingAdmin}
              onClick={() => {
                setOpen(false)
                onDeactivate()
              }}
            />
          )}
          <MenuItem
            label="Terminate / Sack"
            description="End employment, disable login & preserve history"
            danger
            disabled={!can('employees.deactivate') || isHrTargetingAdmin || employee.status === 'TERMINATED'}
            onClick={() => {
              setOpen(false)
              onTerminate()
            }}
          />
          {can('employees.delete') ? (
            <MenuItem
              label="Archive / Remove account"
              description="Super Admin: Soft-delete while keeping history"
              danger
              disabled={false}
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  label,
  description,
  disabled,
  danger,
  onClick,
}: {
  label: string
  description: string
  disabled: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] ${
        danger ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted">{description}</p>
    </button>
  )
}
