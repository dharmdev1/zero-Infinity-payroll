import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/auth-context'
import { attendanceService } from '@/services/attendance'
import { leaveService } from '@/services/leave'
import { payrollService } from '@/services/payroll'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import { formatNptDate } from '@/utils/npt'
import { publishBackendNotice } from '@/utils/backend-ops'
import type { EmployeeDashboardState, WeekDayTile } from '../types'

const DAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const

function dayTile(date: string, today: string) {
  const isAfter = date > today
  if (isAfter) return { label: '—', dot: 'bg-brand-500/40' }
  return { label: '8.0h', dot: 'bg-success' }
}

export function useEmployeeDashboard(): EmployeeDashboardState {
  const { session } = useAuth()
  const selfId = session?.employeeId ?? 'EMP-004'

  const attendanceMonth = useQuery({
    queryKey: ['attendance', 'summary', selfId],
    queryFn: () => attendanceService.summaryForMonth(selfId, db.today.slice(0, 7)),
  })
  const myTasks = useQuery({
    queryKey: ['tasks', 'mine', selfId],
    queryFn: () => taskService.listMine(selfId),
  })
  const balances = useQuery({
    queryKey: ['leave', 'balances', selfId],
    queryFn: () => leaveService.balances(selfId, 2026),
  })
  const payslip = useQuery({
    queryKey: ['payroll', 'latest', selfId],
    queryFn: () => payrollService.latestForEmployee(selfId),
  })

  const activeTasksCount = useMemo(
    () => (myTasks.data ?? []).filter((t) => t.status !== 'COMPLETED').length,
    [myTasks.data],
  )
  const pendingTasks = useMemo(
    () => (myTasks.data ?? []).filter((t) => t.status !== 'COMPLETED').slice(0, 4),
    [myTasks.data],
  )
  const annual = balances.data?.find((b) => b.leaveType === 'Annual')
  const availableAnnual = annual ? Math.max(0, annual.totalDays - annual.usedDays) : 0

  const weekDays: WeekDayTile[] = useMemo(() => {
    const start = new Date(`${db.today}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - 2)
    const mondayOffset = (start.getUTCDay() + 6) % 7
    start.setUTCDate(start.getUTCDate() - mondayOffset)
    return Array.from({ length: 5 }).map((_, i) => {
      const date = new Date(start)
      date.setUTCDate(date.getUTCDate() + i)
      const iso = date.toISOString().slice(0, 10)
      const tile = dayTile(iso, db.today)
      return {
        iso,
        dayCode: DAY_CODES[i],
        label: tile.label,
        dot: tile.dot,
        isToday: iso === db.today,
      }
    })
  }, [])

  const handleCheckIn = useCallback(() => {
    publishBackendNotice('Demo mode: check-in requires a kiosk device or the attendance API. Nothing was recorded.')
  }, [])

  return {
    firstName: session?.name.split(' ')[0] ?? 'Team Member',
    todayFormatted: formatNptDate(`${db.today}T09:00:00+05:45`, true),
    presentDays: attendanceMonth.data?.presentDays ?? 0,
    activeTasksCount,
    availableAnnual,
    latestPayslip: payslip.data,
    weekDays,
    pendingTasks,
    announcements: db.announcements.slice(0, 1),
    loading: {
      attendance: attendanceMonth.isLoading,
      tasks: myTasks.isLoading,
      balances: balances.isLoading,
      payslip: payslip.isLoading,
    },
    handleCheckIn,
  }
}
