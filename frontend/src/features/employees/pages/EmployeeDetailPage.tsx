import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreHorizontal, Pencil } from 'lucide-react'
import { Avatar, Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { StatusBadge, employeeStatusLabel, employeeStatusTone } from '@/components/data-display/status'
import { DeleteEmployeeDialog, DeactivateEmployeeDialog, ChangeStatusDialog } from '../employee-dialogs'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { employeeService } from '@/services/employees'
import { db } from '@/services/demo/store'
import type { Permission } from '@/types/rbac'
import type { Employee } from '@/types/domain'
import { OverviewTab } from './tabs/OverviewTab'
import { EmployeeAttendanceTab } from './tabs/AttendanceTab'
import { EmployeeLeaveTab } from './tabs/LeaveTab'
import { EmployeeTasksTab } from './tabs/TasksTab'

type DetailTab = 'overview' | 'attendance' | 'leave' | 'tasks'

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave' },
  { id: 'tasks', label: 'Tasks' },
]

export function EmployeeDetailPage() {
  const { employeeId = '' } = useParams()
  const { can } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [statusDialog, setStatusDialog] = useState(false)
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const queryClient = useQueryClient()
  const employeeQuery = useQuery({ queryKey: ['employee', employeeId], queryFn: () => employeeService.get(employeeId) })
  const employee = employeeQuery.data
  useHeader(employee?.name ?? 'Employee profile', [{ label: 'Workspace' }, { label: 'Employees', to: '/employees' }, { label: employee?.name ?? 'Employee' }])

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
  const deactivateMutation = useMutation({ mutationFn: (reason: string) => employeeService.deactivate(employeeId, reason), onSuccess: refresh })
  const deleteMutation = useMutation({ mutationFn: (reason: string) => employeeService.deletePermanently(employeeId, reason), onSuccess: () => navigate('/employees') })
  const statusMutation = useMutation({ mutationFn: (input: { status: 'ACTIVE' | 'PROBATION'; reason: string }) => employeeService.changeStatus(employeeId, input.status, input.reason), onSuccess: refresh })

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
    return <EmptyState title="Employee not found" description="This record may have been deleted or you may not have access." action={<Link to="/employees"><Button variant="secondary">Back to directory</Button></Link>} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/employees" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-canvas">
          <ArrowLeft size={15} /> Back to directory
        </Link>
        <div className="flex items-center gap-2.5">
          {can('employees.view') ? <MoreActions employeeId={employee.id} can={can} open={menuOpen} setOpen={setMenuOpen} onStatus={() => setStatusDialog(true)} onDeactivate={() => setDeactivateDialog(true)} onDelete={() => setDeleteDialog(true)} /> : null}
          {can('employees.edit') ? (
            <Link to={`/employees/${employee.id}/edit`}>
              <Button><Pencil size={15} className="mr-1.5" /> Edit Employee</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden">
        <ProfileHeader employee={employee} />
        <div className="border-t border-line">
          <div className="scroll-x" role="tablist" aria-label="Employee sections">
            <div className="flex min-w-max px-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-4 py-3.5 text-[13px] font-medium ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {tab === 'overview' ? <OverviewTab employee={employee} restricted={!can('employees.view')} /> : null}
      {tab === 'attendance' ? <EmployeeAttendanceTab employeeId={employee.id} /> : null}
      {tab === 'leave' ? <EmployeeLeaveTab employeeId={employee.id} /> : null}
      {tab === 'tasks' ? <EmployeeTasksTab employeeId={employee.id} employeeName={employee.name} /> : null}

      {statusDialog ? <ChangeStatusDialog employee={employee} onClose={() => setStatusDialog(false)} pending={statusMutation.isPending} onConfirm={(status, reason) => statusMutation.mutate({ status, reason })} /> : null}
      {deactivateDialog ? <DeactivateEmployeeDialog employee={employee} onClose={() => setDeactivateDialog(false)} pending={deactivateMutation.isPending} onConfirm={(reason) => deactivateMutation.mutate(reason)} /> : null}
      {deleteDialog ? <DeleteEmployeeDialog employee={employee} onClose={() => setDeleteDialog(false)} pending={deleteMutation.isPending} onConfirm={(reason) => deleteMutation.mutate(reason)} /> : null}
    </div>
  )
}

function ProfileHeader({ employee }: { employee: Employee }) {
  return (
    <div className="flex flex-wrap items-center gap-5 p-6">
      <Avatar name={employee.name} tone={employee.avatarTone} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[22px] font-bold text-ink">{employee.name}</h2>
          <StatusBadge status={employeeStatusLabel(employee.status)} tone={employeeStatusTone(employee.status)} />
        </div>
        <p className="mt-1 text-[13px] text-muted">{employee.jobTitle} · {employee.department}</p>
        <p className="mt-2 text-[13px] text-muted">{employee.workEmail} · {employee.phone}</p>
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
  const label = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  return `${label} · ${Math.floor(months / 12)} yrs ${months % 12} mos`
}

function MoreActions({ employeeId, can, open, setOpen, onStatus, onDeactivate, onDelete }: {
  employeeId: string
  can: (p: Permission) => boolean
  open: boolean
  setOpen: (o: boolean) => void
  onStatus: () => void
  onDeactivate: () => void
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
          <MenuItem label="Edit" description="Update employee information" disabled={false} onClick={() => { setOpen(false); navigate(`/employees/${employeeId}/edit`) }} />
          <MenuItem label="Change status" description="Active or probation" disabled={!can('employees.status')} onClick={() => { setOpen(false); onStatus() }} />
          <MenuItem label="Deactivate" description="Disable access, retain records" disabled={!can('employees.deactivate')} onClick={() => { setOpen(false); onDeactivate() }} />
          <MenuItem label="Delete" description="Permanently remove this record" danger disabled={!can('employees.delete')} onClick={() => { setOpen(false); onDelete() }} />
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({ label, description, disabled, danger, onClick }: { label: string; description: string; disabled: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] ${danger ? 'text-danger hover:bg-danger-tint' : 'text-ink hover:bg-brand-50/70'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted">{description}</p>
    </button>
  )
}
