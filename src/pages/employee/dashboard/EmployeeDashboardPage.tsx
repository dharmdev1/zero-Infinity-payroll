import { useHeader } from '@/components/layout/page-header'
import { useEmployeeDashboard } from './hooks/useEmployeeDashboard'
import { WelcomeHeader } from './components/WelcomeHeader'
import { SummaryCards } from './components/SummaryCards'
import { AttendanceCard } from './components/AttendanceCard'
import { MyWeekCard } from './components/MyWeekCard'
import { MyTasks } from './components/MyTasks'
import { LeaveBalanceCard } from './components/LeaveBalanceCard'
import { ProjectLeadershipWorkspace } from './components/ProjectLeadershipWorkspace'

export function EmployeeDashboardPage() {
  useHeader('My dashboard', [{ label: 'My workspace' }, { label: 'Dashboard' }])
  const {
    firstName,
    todayFormatted,
    presentDays,
    activeTasksCount,
    availableAnnual,
    latestPayslip,
    weekDays,
    pendingTasks,
    announcements,
    loading,
    handleCheckIn,
  } = useEmployeeDashboard()

  return (
    <div className="space-y-5">
      <WelcomeHeader firstName={firstName} todayFormatted={todayFormatted} />

      <SummaryCards
        presentDays={presentDays}
        activeTasksCount={activeTasksCount}
        availableAnnual={availableAnnual}
        latestPayslip={latestPayslip}
        loading={loading}
      />

      <ProjectLeadershipWorkspace />

      <div className="grid gap-4 lg:grid-cols-7">
        <AttendanceCard onCheckIn={handleCheckIn} />
        <MyWeekCard weekDays={weekDays} presentDays={presentDays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <MyTasks tasks={pendingTasks} loading={loading.tasks} />
        <LeaveBalanceCard availableAnnual={availableAnnual} announcements={announcements} />
      </div>
    </div>
  )
}
