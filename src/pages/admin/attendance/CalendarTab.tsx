import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar, Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { StatusBadge, attendanceTone } from '@/components/data-display/status'
import { StatCard } from '@/components/data-display/stat-card'
import { attendanceService } from '@/services/attendance'
import { employeeService } from '@/services/employees'
import { db } from '@/services/demo/store'
import type { AttendanceRecord, Employee } from '@/types/domain'
import { formatWorkMinutes } from '@/utils/npt'
import { cn } from '@/utils/cn'

const CALENDAR_MONTH = '2026-10'
const MONTH_TITLE = 'October 2026'

function statusLabel(status: AttendanceRecord['status']): string {
  switch (status) {
    case 'PRESENT': return 'Present'
    case 'LATE': return 'Late'
    case 'ABSENT': return 'Absent'
    case 'ON_LEAVE': return 'On leave'
    case 'WEEKEND': return 'Weekend'
    case 'UPCOMING': return 'Upcoming'
    default: return 'No record'
  }
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

interface DayCell {
  iso: string
  inMonth: boolean
  weekday: number
}

function buildMonthGrid(): DayCell[] {
  const first = new Date('2026-10-01T00:00:00Z')
  const daysInMonth = 31
  const leading = (first.getUTCDay() + 6) % 7 // Monday-start offset
  const cells: DayCell[] = []
  const lastMonthStart = new Date(Date.UTC(2026, 8, 28 - leading + 1))
  for (let i = 0; i < leading; i++) {
    const d = new Date(lastMonthStart)
    d.setUTCDate(lastMonthStart.getUTCDate() + i)
    cells.push({ iso: d.toISOString().slice(0, 10), inMonth: false, weekday: (d.getUTCDay() + 6) % 7 })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${CALENDAR_MONTH}-${String(day).padStart(2, '0')}`
    const weekday = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7
    cells.push({ iso, inMonth: true, weekday })
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(`${cells[cells.length - 1].iso}T00:00:00Z`)
    last.setUTCDate(last.getUTCDate() + 1)
    cells.push({ iso: last.toISOString().slice(0, 10), inMonth: false, weekday: (last.getUTCDay() + 6) % 7 })
  }
  return cells
}

function dotClass(status: AttendanceRecord['status'] | null): string {
  switch (status) {
    case 'PRESENT': return 'bg-success'
    case 'LATE': return 'bg-warning-accent'
    case 'ABSENT': return 'bg-danger'
    case 'ON_LEAVE': return 'bg-brand-600'
    default: return 'bg-[#CBD5E1]'
  }
}

export function AttendanceCalendarTab() {
  const grid = useMemo(buildMonthGrid, [])
  const [employeeId, setEmployeeId] = useState('EMP-001')

  const employeesQuery = useQuery({
    queryKey: ['employees', 'options', 'calendar'],
    queryFn: () => employeeService.list({ page: 1, pageSize: 200 }),
  })
  const employees: Employee[] = employeesQuery.data?.items ?? []
  const selected = employees.find((e) => e.id === employeeId)

  const rowsQuery = useQuery({
    queryKey: ['attendance', 'calendar', employeeId, CALENDAR_MONTH],
    placeholderData: keepPreviousData,
    queryFn: () => attendanceService.list({ employeeId, fromDate: '2026-10-01', toDate: '2026-10-31', page: 1, pageSize: 40 }),
  })
  const byDate = new Map((rowsQuery.data?.items ?? []).map((r) => [r.date, r]))

  const [selectedDay, setSelectedDay] = useState(db.today)
  const selectedRecord = byDate.get(selectedDay) ?? null

  const summary = useMemo(() => {
    const rows = rowsQuery.data?.items ?? []
    const present = rows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
    return {
      present,
      late: rows.filter((r) => r.status === 'LATE').length,
      absent: rows.filter((r) => r.status === 'ABSENT').length,
      leave: rows.filter((r) => r.status === 'ON_LEAVE').length,
    }
  }, [rowsQuery.data])

  const dayLabel = (iso: string): string => {
    const d = new Date(`${iso}T00:00:00Z`)
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(d)
  }

  return (
    <div className="space-y-4">
      <section aria-label="Attendance month grid">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Present days" value={String(summary.present)} loading={rowsQuery.isLoading} icon={null as never} note={`${MONTH_TITLE} · Mon–Fri`} noteTone="green" />
          <StatCard label="Late arrivals" value={String(summary.late)} loading={rowsQuery.isLoading} icon={null as never} note="Check-in after 09:30 NPT" noteTone="orange" />
          <StatCard label="Absent days" value={String(summary.absent)} loading={rowsQuery.isLoading} icon={null as never} note="No check-in, no approved leave" noteTone="red" />
          <StatCard label="Leave days" value={String(summary.leave)} loading={rowsQuery.isLoading} icon={null as never} note="Approved leave in this month" noteTone="blue" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle title={`Attendance calendar · ${MONTH_TITLE}`} description="One dot per workday — click a day to inspect it." />
            <FilterSelect
              className="w-full sm:w-64"
              label="Employee"
              value={employeeId}
              onChange={setEmployeeId}
              options={employees.length === 0
                ? [{ value: employeeId, label: employeeId }]
                : employees.map((e) => ({ value: e.id, label: `${e.name} · ${e.id}` }))}
            />
          </div>

          {selected ? (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
              <Avatar name={selected.name} size="xs" tone={selected.avatarTone} /> {selected.name} · {selected.department} · {selected.jobTitle}
            </p>
          ) : null}

          <div className="scroll-x mt-4">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="th-caption px-1 pb-1 text-center text-muted">{w}</div>
                ))}
                {grid.map((cell) => {
                  const record = byDate.get(cell.iso) ?? null
                  const dayNumber = Number(cell.iso.slice(8))
                  const isSelected = cell.iso === selectedDay
                  const clickable = cell.inMonth && cell.weekday <= 4
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={clickable ? () => setSelectedDay(cell.iso) : undefined}
                      aria-current={isSelected ? 'date' : undefined}
                      aria-label={`${dayLabel(cell.iso)}${record ? ` — ${record.status.replace('_', ' ').toLowerCase()}` : ''}`}
                      className={cn(
                        'flex h-14 flex-col items-center justify-center gap-1 rounded-lg border text-[13px] transition-colors',
                        cell.inMonth ? 'text-ink' : 'text-muted/50',
                        cell.weekday > 4 && cell.inMonth ? 'bg-canvas text-muted' : 'bg-white',
                        clickable && 'hover:bg-brand-50/70',
                        isSelected ? 'border-brand-600 ring-1 ring-brand-600' : 'border-line',
                      )}
                    >
                      <span className={cn('font-medium', isSelected && 'text-brand-600')}>{dayNumber}</span>
                      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', dotClass(record?.status ?? null))} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-accent" /> Late</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Absent</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-600" /> On leave</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#CBD5E1]" /> No record / weekend</span>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          {rowsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : selectedRecord ? (
            <>
              <SectionTitle title={dayLabel(selectedDay)} description="Selected day detail" />
              <div className="mt-4 flex items-center gap-2">
                <StatusBadge status={statusLabel(selectedRecord.status)} tone={attendanceTone(selectedRecord.status)} />
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                {[
                  ['Employee', `${selectedRecord.employeeName} (${selectedRecord.employeeId})`],
                  ['Check-in', selectedRecord.checkIn ?? '—'],
                  ['Check-out', selectedRecord.checkOut ?? '—'],
                  ['Work hours', formatWorkMinutes(selectedRecord.workMinutes)],
                  ['Source', selectedRecord.source],
                  ['Version', String(selectedRecord.version)],
                ].map(([dt, dd]) => (
                  <div key={dt} className="flex justify-between gap-3">
                    <dt className="text-muted">{dt}</dt>
                    <dd className="text-right font-medium text-ink">{dd}</dd>
                  </div>
                ))}
              </dl>
              <Link to={`/employees/${selectedRecord.employeeId}`} className="mt-5 inline-flex text-[13px] font-medium text-brand-600 hover:underline">
                Open employee profile →
              </Link>
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Check-in after 09:30 NPT counts as Late. Approved leave is separate from absence.
              </p>
            </>
          ) : (
            <EmptyState
              title="No attendance data for this day"
              description={
                clickableText(selectedDay)
                  ? 'This workday has no attendance row for the selected employee. Use manual attendance to add a missing record.'
                  : 'Weekends are outside the Mon–Fri workweek for Nepal time.'
              }
              action={
                clickableText(selectedDay) ? (
                  <Link to={`/attendance/corrections?mode=add&employeeId=${employeeId}&date=${selectedDay}`}>
                    <Button variant="secondary" size="sm">Add entry</Button>
                  </Link>
                ) : undefined
              }
            />
          )}
        </Card>
      </div>
    </div>
  )
}

function clickableText(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay()
  return d >= 1 && d <= 5
}
