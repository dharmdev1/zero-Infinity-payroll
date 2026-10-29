import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, MoreHorizontal, Plus, Search } from 'lucide-react'
import { Avatar, Button, Card, EmptyState } from '@/components/ui/base'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, employeeStatusLabel, employeeStatusTone } from '@/components/data-display/status'
import { DeleteEmployeeDialog, DeactivateEmployeeDialog, ChangeStatusDialog } from '../employee-dialogs'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { employeeService } from '@/services/employees'
import { db } from '@/services/demo/store'
import { notifyBackendScoped } from '@/utils/backend-ops'
import type { Permission } from '@/types/rbac'
import type { Employee } from '@/types/domain'
import { DEPARTMENTS, EMPLOYMENT_STATUS_OPTIONS } from '../constants'

const PAGE_SIZE = 10

interface DirectoryFilters {
  search: string
  department: string
  status: string
  page: number
}

export function EmployeeDirectoryPage() {
  const { session, can } = useAuth()
  const navigate = useNavigate()
  useHeader('Employee management', [{ label: 'Workspace' }, { label: 'Employees' }])

  const [filters, setFilters] = useState<DirectoryFilters>({ search: '', department: '', status: '', page: 1 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusDialog, setStatusDialog] = useState<Employee | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState<Employee | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Employee | null>(null)

  const employeesQuery = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.list({ search: filters.search, department: filters.department || undefined, status: filters.status || undefined, page: filters.page, pageSize: PAGE_SIZE }),
  })

  const refetch = () => void employeesQuery.refetch()
  const setStatusMutation = useMutation({
    mutationFn: (input: { employee: Employee; status: 'ACTIVE' | 'PROBATION'; reason: string }) => employeeService.changeStatus(input.employee.id, input.status, input.reason),
    onSuccess: () => { refetch(); setStatusDialog(null); setDeactivateDialog(null) },
  })
  const deactivateMutation = useMutation({
    mutationFn: (input: { employee: Employee; reason: string }) => employeeService.deactivate(input.employee.id, input.reason),
    onSuccess: () => { refetch(); setDeactivateDialog(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (input: { employee: Employee; reason: string }) => employeeService.deletePermanently(input.employee.id, input.reason),
    onSuccess: () => { navigate('/employees'); setDeleteDialog(null) },
  })

  const columns = useMemo<Array<Column<Employee>>>(() => buildColumns({ selected, setSelected, can, navigate, onStatus: setStatusDialog, onDeactivate: setDeactivateDialog, onDelete: setDeleteDialog }), [selected, can, navigate])

  const items = employeesQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-ink">Employee directory</h2>
          <p className="mt-1 text-[13px] text-muted">
            {employeesQuery.data ? `${employeesQuery.data.total} employees across Zero Infinity Technologies. Keep your people information up to date.` : 'Loading directory…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" onClick={() => notifyBackendScoped('Employee directory export')}>
            <Download size={15} className="mr-1.5" /> Export
          </Button>
          {can('employees.create') ? (
            <Link to="/employees/new">
              <Button><Plus size={15} className="mr-1.5" /> Add Employee</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <DirectoryToolbar filters={filters} setFilters={setFilters} resultCount={employeesQuery.data?.total} />
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(row) => row.id}
          loading={employeesQuery.isLoading}
          emptyState={<EmptyState title="No employees match these filters" description="Adjust the search or reset filters to see more of the directory." />}
        />
        {employeesQuery.data ? (
          <Pagination page={employeesQuery.data.page} pageSize={employeesQuery.data.pageSize} total={employeesQuery.data.total} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} countsLabel="employees" />
        ) : null}
      </Card>

      <p className="text-xs text-muted">
        {db.employees.filter((e) => e.status === 'ACTIVE').length} active · {db.employees.filter((e) => e.status === 'PROBATION').length} on probation · {db.employees.filter((e) => e.status === 'INACTIVE').length} inactive
        {can('employees.view') ? ' · Employee records only. Compensation is restricted to Payroll.' : ` · Directory-only view for ${session?.role === 'EMPLOYEE' ? 'employees' : 'this session'}.`}
      </p>

      {statusDialog ? (
        <ChangeStatusDialog employee={statusDialog} onClose={() => setStatusDialog(null)} pending={setStatusMutation.isPending} onConfirm={(status, reason) => setStatusMutation.mutate({ employee: statusDialog, status, reason })} />
      ) : null}
      {deactivateDialog ? (
        <DeactivateEmployeeDialog employee={deactivateDialog} onClose={() => setDeactivateDialog(null)} pending={deactivateMutation.isPending} onConfirm={(reason) => deactivateMutation.mutate({ employee: deactivateDialog, reason })} />
      ) : null}
      {deleteDialog ? (
        <DeleteEmployeeDialog employee={deleteDialog} onClose={() => setDeleteDialog(null)} pending={deleteMutation.isPending} onConfirm={(reason) => deleteMutation.mutate({ employee: deleteDialog, reason })} />
      ) : null}
    </div>
  )
}

/* ------------------------------- Internals -------------------------------- */

function DirectoryToolbar({ filters, setFilters, resultCount }: { filters: DirectoryFilters; setFilters: (updater: (f: DirectoryFilters) => DirectoryFilters) => void; resultCount?: number }) {
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
      <select aria-label="Filter by department" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value, page: 1 }))} className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] font-medium">
        <option value="">All departments</option>
        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] font-medium">
        {EMPLOYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="self-center text-[13px] text-muted" aria-live="polite">{resultCount != null ? `${resultCount} results` : ''}</span>
    </div>
  )
}

interface BuildColumnsArgs {
  selected: Set<string>
  setSelected: (next: Set<string>) => void
  can: (permission: Permission) => boolean
  navigate: (to: string) => void
  onStatus: (e: Employee) => void
  onDeactivate: (e: Employee) => void
  onDelete: (e: Employee) => void
}

function buildColumns({ selected, setSelected, can, navigate, onStatus, onDeactivate, onDelete }: BuildColumnsArgs): Array<Column<Employee>> {
  const readOnlyDirectory = !can('employees.view')
  const cols: Array<Column<Employee>> = []
  if (can('employees.edit') && !readOnlyDirectory) {
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
    { key: 'id', header: 'Employee ID', render: (row) => <span className="font-mono text-xs text-muted">{row.id}</span>, sortValue: (r) => r.id },
    {
      key: 'name',
      header: 'Employee',
      sortValue: (r) => r.name,
      render: (row) => (
        <Link to={can('employees.view') ? `/employees/${row.id}` : '/employees'} className="flex items-center gap-2.5">
          <Avatar name={row.name} tone={row.avatarTone} size="sm" />
          <span className="font-medium text-brand-600 hover:underline">{row.name}</span>
        </Link>
      ),
    },
    { key: 'department', header: 'Department', render: (row) => row.department },
    { key: 'jobTitle', header: 'Job title', render: (row) => row.jobTitle },
    { key: 'contact', header: 'Contact', render: (row) => <span className="text-[13px]">{row.workEmail}<span className="block text-xs text-muted">{row.phone}</span></span> },
    { key: 'joiningDate', header: 'Joining date', align: 'right', render: (row) => new Date(`${row.joiningDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) },
    { key: 'status', header: 'Status', align: 'center', render: (row) => <StatusBadge status={employeeStatusLabel(row.status)} tone={employeeStatusTone(row.status)} /> },
  )
  if (can('employees.view')) {
    cols.push({
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <RowActions
          onEdit={() => navigate(`/employees/${row.id}/edit`)}
          onStatus={() => onStatus(row)}
          onDeactivate={() => onDeactivate(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    })
  }
  return cols
}

function RowActions({ onEdit, onStatus, onDeactivate, onDelete }: { onEdit: () => void; onStatus: () => void; onDeactivate: () => void; onDelete: () => void }) {
  const { can } = useAuth()
  const items = useMemo(() => [
    { label: 'Edit', description: 'Update employee information', onSelect: onEdit },
    { label: 'Change status', description: 'Active or probation', onSelect: onStatus, disabled: !can('employees.status') },
    { label: 'Deactivate', description: 'Disable access, retain records', onSelect: onDeactivate, disabled: !can('employees.deactivate') },
    { label: 'Delete', description: 'Permanently remove this record', onSelect: onDelete, disabled: !can('employees.delete'), tone: 'danger' as const },
  ], [onEdit, onStatus, onDeactivate, onDelete, can])
  return <MiniMenu items={items} />
}

function MiniMenu({ items }: { items: Array<{ label: string; description?: string; onSelect: () => void; tone?: 'default' | 'danger'; disabled?: boolean }> }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block text-left">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Row actions">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-40 mb-1 w-56 rounded-xl border border-line bg-white p-1.5 shadow-pop" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] ${item.tone === 'danger' ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70'} ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => { setOpen(false); item.onSelect() }}
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
