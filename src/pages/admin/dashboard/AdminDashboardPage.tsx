import { Link } from 'react-router-dom'
import { FolderKanban, ShieldCheck, Users } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui/base'
import { useHeader } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { useAdminDashboard } from './hooks/useAdminDashboard'
import { DashboardHeader } from './components/DashboardHeader'
import { SummaryCards } from './components/SummaryCards'
import { AttendanceOverview } from './components/AttendanceOverview'
import { DashboardCharts } from './components/DashboardCharts'
import { TasksDeadlinesTable } from './components/TasksDeadlinesTable'
import { RecentActivities } from './components/RecentActivities'

export function AdminDashboardPage() {
  useHeader('Admin dashboard', [{ label: 'Workspace' }, { label: 'Overview' }])
  const { session, can } = useAuth()
  const {
    userName,
    canViewPayroll,
    canViewAudit,
    counts,
    attendanceRate,
    cashBars,
    pendingTaskRows,
    activities,
    loading,
  } = useAdminDashboard()

  const isSuperAdmin = session?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-5">
      <DashboardHeader userName={userName} />

      <SummaryCards
        counts={counts}
        attendanceRate={attendanceRate}
        canViewPayroll={canViewPayroll}
        loading={loading}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={isSuperAdmin ? 'purple' : 'blue'}>
              {isSuperAdmin ? 'Super Admin Governance' : 'HR Admin Operations'}
            </Badge>
            <span className="text-xs text-muted">
              {isSuperAdmin
                ? 'Full authority over system roles, HR Admin provisioning, terminations, project hierarchies, and audit logs.'
                : 'Manage employee onboarding, project & team hierarchies, leave approvals, and attendance.'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/projects">
              <Button size="sm" variant="secondary">
                <FolderKanban size={14} className="mr-1.5" /> Projects & Teams
              </Button>
            </Link>
            <Link to="/employees">
              <Button size="sm" variant="secondary">
                <Users size={14} className="mr-1.5" /> Employee Directory
              </Button>
            </Link>
            {can('settings.roles') ? (
              <Link to="/settings/roles">
                <Button size="sm">
                  <ShieldCheck size={14} className="mr-1.5" /> System Roles & Governance
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-7">
        <AttendanceOverview
          counts={counts}
          attendanceRate={attendanceRate}
          loading={loading.attendance}
        />
        <DashboardCharts
          cashBars={cashBars}
          canViewPayroll={canViewPayroll}
          newThisMonth={counts.newThisMonth}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <TasksDeadlinesTable tasks={pendingTaskRows} loading={loading.tasks} />
        <RecentActivities activities={activities} canViewAudit={canViewAudit} />
      </div>
    </div>
  )
}
