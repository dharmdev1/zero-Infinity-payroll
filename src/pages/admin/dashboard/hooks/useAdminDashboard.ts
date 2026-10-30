import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { BarDatum } from '@/components/data-display/stat-card'
import { useAuth } from '@/app/auth-context'
import { employeeService } from '@/services/employees'
import { attendanceService } from '@/services/attendance'
import { payrollService } from '@/services/payroll'
import { taskService } from '@/services/tasks'
import { leaveService } from '@/services/leave'
import { db } from '@/services/demo/store'
import type { ActivityItem, AdminDashboardState } from '../types'

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { name: 'Sita K.', action: 'submitted a leave request', time: '10 min ago' },
  { name: 'Aarav R.', action: 'completed Website QA task', time: '32 min ago' },
  { name: 'Mina T.', action: 'uploaded a candidate CV', time: '1 hr ago' },
  { name: 'Finance', action: 'new bank statement imported', time: '2 hrs ago' },
]

export function useAdminDashboard(): AdminDashboardState {
  const { session, can } = useAuth()
  const canViewPayroll = can('payroll.view')
  const canViewAudit = can('settings.audit')

  const employees = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeeService.list({ page: 1, pageSize: 200 }),
  })
  const attendanceToday = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.list({ date: db.today, page: 1, pageSize: 200 }),
  })
  const payroll = useQuery({
    queryKey: ['payroll', 'runs'],
    queryFn: () => payrollService.runs('', 1, 10),
    enabled: canViewPayroll,
  })
  const tasks = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.list({}),
  })
  const pendingLeave = useQuery({
    queryKey: ['leave', 'pending-count'],
    queryFn: () => leaveService.list({ status: 'PENDING', page: 1, pageSize: 50 }),
    enabled: !canViewPayroll,
  })

  const counts = useMemo(() => {
    const list = employees.data?.items ?? []
    const attItems = attendanceToday.data?.items ?? []
    return {
      total: employees.data?.total ?? 0,
      present: attItems.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      late: attItems.filter((r) => r.status === 'LATE').length,
      absent: attItems.filter((r) => r.status === 'ABSENT').length,
      pendingTasks: (tasks.data ?? []).filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TO_DO' || t.status === 'REVIEW').length,
      payrollGross: payroll.data?.items[0]?.totalNetPaisa ?? 0,
      newThisMonth: list.filter((e) => e.joiningDate >= '2026-10-01').length,
      pendingLeaveCount: pendingLeave.data?.total ?? 0,
    }
  }, [employees.data, attendanceToday.data, tasks.data, payroll.data, pendingLeave.data])

  const attendanceRate = counts.total ? Math.round((counts.present / counts.total) * 1000) / 10 : 0

  const cashBars: BarDatum[] = useMemo(
    () => [
      { label: 'SEP 1', value: 42 },
      { label: '', value: 65 },
      { label: '', value: 50 },
      { label: '', value: 78 },
      { label: '', value: 58 },
      { label: '', value: 71 },
      { label: '', value: 49 },
      { label: 'OCT', value: 84, active: true },
    ],
    [],
  )

  const pendingTaskRows = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== 'COMPLETED').slice(0, 4),
    [tasks.data],
  )

  const activities = useMemo(
    () => (canViewPayroll ? DEFAULT_ACTIVITIES : DEFAULT_ACTIVITIES.filter((a) => a.name !== 'Finance')),
    [canViewPayroll],
  )

  return {
    userName: session?.name ?? 'Admin',
    canViewPayroll,
    canViewAudit,
    counts,
    attendanceRate,
    cashBars,
    pendingTaskRows,
    activities,
    loading: {
      employees: employees.isLoading,
      attendance: attendanceToday.isLoading,
      tasks: tasks.isLoading,
      payroll: payroll.isLoading,
      leave: pendingLeave.isLoading,
    },
  }
}
