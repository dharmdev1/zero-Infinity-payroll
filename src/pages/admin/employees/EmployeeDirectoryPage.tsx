import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, MoreHorizontal, Plus, Search } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, InfoNote } from '@/components/ui/base'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
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
import { notifyBackendScoped } from '@/utils/backend-ops'
import { ROLE_LABELS } from '@/types/rbac'
import type { Permission, Role } from '@/types/rbac'
import type { Employee, OrgUser, SessionUser } from '@/types/domain'
import { DEPARTMENTS, EMPLOYMENT_STATUS_OPTIONS } from '@/modules/employees/constants'

const PAGE_SIZE = 10

const roleBadgeTone = (r: Role): 'blue' | 'green' | 'purple' =>
  r === 'SUPER_ADMIN' ? 'blue' : r === 'HR_ADMIN' ? 'green' : 'purple'

interface DirectoryFilters {
  search: string
  department: string
  status: string
  page: number
}

export function EmployeeDirectoryPage() {
  const { session, can } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useHeader('Employee management', [{ label: 'Workspace' }, { label: 'Employees' }])

  const [filters, setFilters] = useState<DirectoryFilters>({ search: '', department: '', status: '', page: 1 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [roleDialog, setRoleDialog] = useState<Employee | null>(null)
  const [statusDialog, setStatusDialog] = useState<Employee | null>(null)
  const [terminateDialog, setTerminateDialog] = useState<Employee | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState<Employee | null>(null)
  const [reactivateDialog, setReactivateDialog] = useState<Employee | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Employee | null>(null)
  const [actionError, setActionError] = useState('')

  const employeesQuery = useQuery({
    queryKey: ['employees', filters, session?.employeeId, session?.role],
    queryFn: () =>
      employeeService.list(
        {
          search: filters.search,
          department: filters.department || undefined,
          status: filters.status || undefined,
          page: filters.page,
          pageSize: PAGE_SIZE,
        },
        session,
      ),
  })

  const refetch = () => {
    setActionError('')
    void employeesQuery.refetch()
    void queryClient.invalidateQueries({ queryKey: ['settings', 'users'] })
  }

  const assignRoleMutation = useMutation({
    mutationFn: (input: { employee: Employee; role: Role; status: OrgUser['status']; reason: string }) =>
      settingsService.assignEmployeeRole({
        employeeId: input.employee.id,
        role: input.role,
        status: input.status,
        reason: input.reason,
        actor: session?.name ?? 'Super Admin',
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setRoleDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to assign role.'),
  })

  const setStatusMutation = useMutation({
    mutationFn: (input: { employee: Employee; status: 'ACTIVE' | 'PROBATION'; reason: string }) =>
      employeeService.changeStatus(input.employee.id, input.status, input.reason, {
        name: session?.name,
        role: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setStatusDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to change status.'),
  })

  const terminateMutation = useMutation({
    mutationFn: (input: { employee: Employee; terminationDate: string; reason: string }) =>
      employeeService.terminate(input.employee.id, {
        terminationDate: input.terminationDate,
        reason: input.reason,
        actor: session?.name,
        actorRole: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setTerminateDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to terminate employee.'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (input: { employee: Employee; reason: string }) =>
      employeeService.deactivate(input.employee.id, input.reason, {
        name: session?.name,
        role: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setDeactivateDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to deactivate employee.'),
  })

  const reactivateMutation = useMutation({
    mutationFn: (input: { employee: Employee; reason: string }) =>
      employeeService.reactivate(input.employee.id, input.reason, {
        name: session?.name,
        role: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setReactivateDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to reactivate employee.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (input: { employee: Employee; reason: string }) =>
      employeeService.deletePermanently(input.employee.id, input.reason, {
        name: session?.name,
        role: session?.role,
      }),
    onSuccess: () => {
      refetch()
      setDeleteDialog(null)
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Unable to archive employee.'),
  })

  const columns = useMemo<Array<Column<Employee>>>(
    () =>
      buildColumns({
        selected,
        setSelected,
        can,
        session,
        navigate,
        onAssignRole: setRoleDialog,
        onStatus: setStatusDialog,
        onTerminate: setTerminateDialog,
        onDeactivate: setDeactivateDialog,
        onReactivate: setReactivateDialog,
        onDelete: setDeleteDialog,
      }),
    [selected, can, session, navigate],
  )

  const items = employeesQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-ink">Employee directory</h2>
          <p className="mt-1 text-[13px] text-muted">
            {session?.role === 'EMPLOYEE'
              ? 'Public colleague directory. Sensitive personal contact and employment records are restricted to HR & Super Admin.'
              : employeesQuery.data
                ? `${employeesQuery.data.total} employees across Zero Infinity Technologies. System roles are distinct from Project/Team positions.`
                : 'Loading directory…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {can('employees.view') ? (
            <Button variant="secondary" onClick={() => notifyBackendScoped('Employee directory export')}>
              <Download size={15} className="mr-1.5" /> Export
            </Button>
          ) : null}
          {can('employees.create') ? (
            <Link to="/employees/new">
              <Button>
                <Plus size={15} className="mr-1.5" /> Add Employee
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {actionError ? <InfoNote tone="red">{actionError}</InfoNote> : null}

      <Card>
        <DirectoryToolbar filters={filters} setFilters={setFilters} resultCount={employeesQuery.data?.total} />
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(row) => row.id}
          loading={employeesQuery.isLoading}
          emptyState={
            <EmptyState
              title="No employees match these filters"
              description="Adjust the search or reset filters to see more of the directory."
            />
          }
        />
        {employeesQuery.data ? (
          <Pagination
            page={employeesQuery.data.page}
            pageSize={employeesQuery.data.pageSize}
            total={employeesQuery.data.total}
            onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
            countsLabel="employees"
          />
        ) : null}
      </Card>

      <p className="text-xs text-muted">
        {db.employees.filter((e) => e.status === 'ACTIVE').length} active ·{' '}
        {db.employees.filter((e) => e.status === 'PROBATION').length} on probation ·{' '}
        {db.employees.filter((e) => e.status === 'INACTIVE').length} deactivated ·{' '}
        {db.employees.filter((e) => e.status === 'TERMINATED').length} terminated
        {can('employees.view')
          ? ' · Only Super Admin can modify system roles. Project Lead and Team Lead positions are scoped per project.'
          : ' · Privacy-protected colleague view.'}
      </p>

      {roleDialog ? (
        <AssignRoleDialog
          employee={roleDialog}
          onClose={() => setRoleDialog(null)}
          pending={assignRoleMutation.isPending}
          onConfirm={(role, status, reason) => assignRoleMutation.mutate({ employee: roleDialog, role, status, reason })}
        />
      ) : null}
      {statusDialog ? (
        <ChangeStatusDialog
          employee={statusDialog}
          onClose={() => setStatusDialog(null)}
          pending={setStatusMutation.isPending}
          onConfirm={(status, reason) => setStatusMutation.mutate({ employee: statusDialog, status, reason })}
        />
      ) : null}
      {terminateDialog ? (
        <TerminateEmployeeDialog
          employee={terminateDialog}
          onClose={() => setTerminateDialog(null)}
          pending={terminateMutation.isPending}
          onConfirm={({ terminationDate, reason }) =>
            terminateMutation.mutate({ employee: terminateDialog, terminationDate, reason })
          }
        />
      ) : null}
      {deactivateDialog ? (
        <DeactivateEmployeeDialog
          employee={deactivateDialog}
          onClose={() => setDeactivateDialog(null)}
          pending={deactivateMutation.isPending}
          onConfirm={(reason) => deactivateMutation.mutate({ employee: deactivateDialog, reason })}
        />
      ) : null}
      {reactivateDialog ? (
        <ReactivateEmployeeDialog
          employee={reactivateDialog}
          onClose={() => setReactivateDialog(null)}
          pending={reactivateMutation.isPending}
          onConfirm={(reason) => reactivateMutation.mutate({ employee: reactivateDialog, reason })}
        />
      ) : null}
      {deleteDialog ? (
        <DeleteEmployeeDialog
          employee={deleteDialog}
          onClose={() => setDeleteDialog(null)}
          pending={deleteMutation.isPending}
          onConfirm={(reason) => deleteMutation.mutate({ employee: deleteDialog, reason })}
        />
      ) : null}
    </div>
  )
}

function DirectoryToolbar({
  filters,
  setFilters,
  resultCount,
}: {
  filters: DirectoryFilters
  setFilters: (updater: (f: DirectoryFilters) => DirectoryFilters) => void
  resultCount?: number
}) {
  return (
    <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_auto_auto_auto]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search by name, employee ID or email"
          placeholder="Search by name, employee ID or email"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>
      <select
        aria-label="Filter by department"
        value={filters.department}
        onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value, page: 1 }))}
        className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] font-medium"
      >
        <option value="">All departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] font-medium"
      >
        {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="self-center text-[13px] text-muted" aria-live="polite">
        {resultCount != null ? `${resultCount} results` : ''}
      </span>
    </div>
  )
}

interface BuildColumnsArgs {
  selected: Set<string>
  setSelected: (next: Set<string>) => void
  can: (permission: Permission) => boolean
  session: SessionUser | null
  navigate: (to: string) => void
  onAssignRole: (e: Employee) => void
  onStatus: (e: Employee) => void
  onTerminate: (e: Employee) => void
  onDeactivate: (e: Employee) => void
  onReactivate: (e: Employee) => void
  onDelete: (e: Employee) => void
}

function buildColumns({
  selected,
  setSelected,
  can,
  session,
  navigate,
  onAssignRole,
  onStatus,
  onTerminate,
  onDeactivate,
  onReactivate,
  onDelete,
}: BuildColumnsArgs): Array<Column<Employee>> {
  const isEmployeeViewer = session?.role === 'EMPLOYEE'
  const canManageSystemRoles = can('settings.roles')
  const cols: Array<Column<Employee>> = []
  if (can('employees.edit') && !isEmployeeViewer) {
    cols.push({
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.name}`}
          checked={selected.has(row.id)}
          onChange={(e) => {
            const next = new Set(selected)
            if (e.target.checked) next.add(row.id)
            else next.delete(row.id)
            setSelected(next)
          }}
          className="h-4 w-4 rounded border-line accent-[#1F57E0]"
        />
      ),
    })
  }
  cols.push(
    {
      key: 'id',
      header: 'Employee ID',
      render: (row) => <span className="font-mono text-xs text-muted">{row.id}</span>,
      sortValue: (r) => r.id,
    },
    {
      key: 'name',
      header: 'Employee',
      sortValue: (r) => r.name,
      render: (row) => (
        <Link to={`/employees/${row.id}`} className="flex items-center gap-2.5">
          <Avatar name={row.name} tone={row.avatarTone} size="sm" />
          <div>
            <span className="font-medium text-brand-600 hover:underline">{row.name}</span>
            <span className="block text-xs text-muted">{row.workLocation}</span>
          </div>
        </Link>
      ),
    },
    { key: 'department', header: 'Department', render: (row) => row.department },
    { key: 'jobTitle', header: 'Job title', render: (row) => row.jobTitle },
    {
      key: 'role',
      header: 'System Role & Project Position',
      render: (row) => {
        const r = settingsService.getEmployeeRole(row.id)
        const positions = taskService.getEmployeeProjectPositions(row.id)
        const leadPositions = positions.filter((p) => p.position === 'PROJECT_LEAD' || p.position === 'TEAM_LEAD')
        return (
          <div className="space-y-1">
            <div>
              {canManageSystemRoles ? (
                <button
                  type="button"
                  onClick={() => onAssignRole(row)}
                  title="Super Admin: Click to change system role"
                  className="inline-flex items-center rounded-md transition-opacity hover:opacity-80"
                >
                  <Badge tone={roleBadgeTone(r)}>{ROLE_LABELS[r]}</Badge>
                </button>
              ) : (
                <Badge tone={roleBadgeTone(r)}>{ROLE_LABELS[r]}</Badge>
              )}
            </div>
            {leadPositions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {leadPositions.map((lp) => (
                  <span
                    key={`${lp.project.id}-${lp.position}`}
                    className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-700"
                  >
                    {lp.position === 'PROJECT_LEAD' ? 'Project Lead' : 'Team Lead'} ({lp.project.code})
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'contact',
      header: 'Work Contact',
      render: (row) => (
        <span className="text-[13px]">
          {row.workEmail}
          {!isEmployeeViewer || row.id === session?.employeeId ? (
            <span className="block text-xs text-muted">{row.phone}</span>
          ) : (
            <span className="block text-[11px] text-subtle">Personal phone protected</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={employeeStatusLabel(row.status)} tone={employeeStatusTone(row.status)} />,
    },
  )
  if (can('employees.view')) {
    cols.push({
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <RowActions
          row={row}
          onEdit={() => navigate(`/employees/${row.id}/edit`)}
          onAssignRole={() => onAssignRole(row)}
          onStatus={() => onStatus(row)}
          onTerminate={() => onTerminate(row)}
          onDeactivate={() => onDeactivate(row)}
          onReactivate={() => onReactivate(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    })
  }
  return cols
}

function RowActions({
  row,
  onEdit,
  onAssignRole,
  onStatus,
  onTerminate,
  onDeactivate,
  onReactivate,
  onDelete,
}: {
  row: Employee
  onEdit: () => void
  onAssignRole: () => void
  onStatus: () => void
  onTerminate: () => void
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
}) {
  const { session, can } = useAuth()
  const targetRole = settingsService.getEmployeeRole(row.id)
  const isHrTargetingAdmin =
    session?.role === 'HR_ADMIN' && (targetRole === 'HR_ADMIN' || targetRole === 'SUPER_ADMIN')

  const items = useMemo(
    () => [
      ...(can('settings.roles')
        ? [
            {
              label: 'Change system role',
              description: 'Super Admin: Set Super Admin, HR Admin, or Employee',
              onSelect: onAssignRole,
              disabled: false,
            },
          ]
        : []),
      { label: 'Edit profile', description: 'Update employee information', onSelect: onEdit, disabled: !can('employees.edit') },
      { label: 'Change status', description: 'Active or probation', onSelect: onStatus, disabled: !can('employees.status') },
      ...(row.status === 'INACTIVE'
        ? [
            {
              label: 'Reactivate account',
              description: 'Restore active status & login',
              onSelect: onReactivate,
              disabled: !can('employees.deactivate') || isHrTargetingAdmin,
            },
          ]
        : [
            {
              label: 'Deactivate account',
              description: 'Temporarily suspend login, retain records',
              onSelect: onDeactivate,
              disabled: !can('employees.deactivate') || isHrTargetingAdmin,
            },
          ]),
      {
        label: 'Terminate / Sack',
        description: 'End employment, disable login & preserve history',
        onSelect: onTerminate,
        disabled: !can('employees.deactivate') || isHrTargetingAdmin || row.status === 'TERMINATED',
        tone: 'danger' as const,
      },
      ...(can('employees.delete')
        ? [
            {
              label: 'Archive / Remove account',
              description: 'Super Admin: Soft-delete while keeping audit history',
              onSelect: onDelete,
              disabled: false,
              tone: 'danger' as const,
            },
          ]
        : []),
    ],
    [row.status, isHrTargetingAdmin, onEdit, onAssignRole, onStatus, onTerminate, onDeactivate, onReactivate, onDelete, can],
  )
  return <MiniMenu items={items} />
}

function MiniMenu({
  items,
}: {
  items: Array<{
    label: string
    description?: string
    onSelect: () => void
    tone?: 'default' | 'danger'
    disabled?: boolean
  }>
}) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-40 mb-1 w-64 rounded-xl border border-line bg-white p-1.5 shadow-pop" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] ${
                item.tone === 'danger' ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70'
              } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              <span className="font-medium">{item.label}</span>
              {item.description ? <span className="block text-xs text-muted">{item.description}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  )
}
