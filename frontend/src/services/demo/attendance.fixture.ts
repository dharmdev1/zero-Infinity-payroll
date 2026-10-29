import type { AttendanceRecord, AttendanceStatus } from '../../types/domain'
import { EMPLOYEES } from './employees.fixture'
import { DEMO_TODAY, hashSeed, seededRandom } from './employees.fixture'

const OCT_WORKDAYS = ((): string[] => {
  const out: string[] = []
  for (let d = 1; d <= 31; d++) {
    const iso = `2026-10-${String(d).padStart(2, '0')}`
    const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
    if (day >= 1 && day <= 5) out.push(iso)
  }
  return out
})()

export const ELAPSED_OCT_WORKDAYS = OCT_WORKDAYS.filter((d) => d <= DEMO_TODAY)
export const ELAPSED_OCT_WORKDAY_COUNT = ELAPSED_OCT_WORKDAYS.length

/** Employees on approved annual leave on given October dates (drives On leave status). */
export const APPROVED_LEAVE_DATES: Record<string, string[]> = {
  'EMP-001': ['2026-10-23'],
  'EMP-005': ['2026-10-23', '2026-10-26', '2026-10-27', '2026-10-28'],
  'EMP-003': ['2026-10-09'],
  'EMP-021': ['2026-10-20'],
}

/** "Snapshot" corrections that pin the design's handoff values. */
const MANUAL_ADJUSTMENTS: Record<string, Record<string, Partial<AttendanceRecord>>> = {
  'EMP-001': {
    '2026-10-26': { checkIn: '09:48 AM', checkOut: '05:30 PM', workMinutes: 442, status: 'LATE', location: 'Kathmandu office', source: 'kiosk' },
    '2026-10-14': { checkIn: null, checkOut: null, workMinutes: null, status: 'ABSENT', location: null, source: 'kiosk' },
    '2026-10-27': { checkIn: '09:28 AM', checkOut: '05:28 PM', workMinutes: 480, status: 'PRESENT', location: 'Remote', source: 'remote' },
    '2026-10-28': { checkIn: '09:24 AM', checkOut: '05:34 PM', workMinutes: 490, status: 'PRESENT', location: 'Kathmandu office', source: 'kiosk' },
  },
  'EMP-004': { '2026-10-28': { checkIn: '09:42 AM', checkOut: '05:42 PM', workMinutes: 480, status: 'LATE', location: 'Kathmandu office', source: 'kiosk' } },
  'EMP-009': { '2026-10-28': { checkIn: null, checkOut: null, workMinutes: null, status: 'ABSENT', location: null, source: 'kiosk' } },
  'EMP-010': { '2026-10-28': { checkIn: null, checkOut: null, workMinutes: null, status: 'ABSENT', location: null, source: 'kiosk' } },
}

function minutesOf(clock: string): number {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(clock)
  if (!m) return 0
  let h = Number(m[1])
  const mm = Number(m[2])
  const ap = m[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + mm
}

interface DayShape {
  checkIn: string
  checkOut: string
  status: AttendanceStatus
  remote: boolean
}

function typicalDay(employeeId: string, date: string): DayShape {
  const rnd = seededRandom(hashSeed(employeeId, date))
  const roll = rnd()
  if (roll < 0.06) return { checkIn: '09:38 AM', checkOut: '05:38 PM', status: 'LATE', remote: false }
  if (roll < 0.12) return { checkIn: '09:22 AM', checkOut: '05:22 PM', status: 'PRESENT', remote: true }
  if (roll < 0.88) return { checkIn: '09:21 AM', checkOut: '05:26 PM', status: 'PRESENT', remote: false }
  if (roll < 0.93) return { checkIn: '09:47 AM', checkOut: '05:30 PM', status: 'LATE', remote: false }
  return { checkIn: '09:15 AM', checkOut: '05:31 PM', status: 'PRESENT', remote: false }
}

function make(employeeId: string, date: string, partial: Partial<AttendanceRecord>): AttendanceRecord {
  const emp = EMPLOYEES.find((e) => e.id === employeeId)!
  return {
    id: `ATT-${employeeId.replace('EMP-', 'E')}-${date.slice(5)}`,
    employeeId,
    employeeName: emp.name,
    department: emp.department,
    date,
    checkIn: null,
    checkOut: null,
    workMinutes: null,
    status: 'PRESENT',
    location: 'Kathmandu office',
    source: 'kiosk',
    version: 1,
    ...partial,
  }
}

export function buildAttendanceRecords(): AttendanceRecord[] {
  const all: AttendanceRecord[] = []
  for (const emp of EMPLOYEES) {
    const onLeave = APPROVED_LEAVE_DATES[emp.id] ?? []
    for (const date of OCT_WORKDAYS) {
      if (onLeave.includes(date)) {
        all.push(make(emp.id, date, { status: 'ON_LEAVE', location: 'Annual leave', checkIn: null, checkOut: null, workMinutes: null }))
        continue
      }
      if (date > DEMO_TODAY) {
        all.push(make(emp.id, date, { status: 'UPCOMING', checkIn: null, checkOut: null, workMinutes: null, location: null }))
        continue
      }
      const adj = MANUAL_ADJUSTMENTS[emp.id]?.[date]
      const day = typicalDay(emp.id, date)
      const effective: Partial<AttendanceRecord> = adj ?? {
        checkIn: day.checkIn,
        checkOut: day.checkOut,
        status: day.status,
        location: day.remote ? 'Remote' : 'Kathmandu office',
        workMinutes: minutesOf(day.checkOut) - minutesOf(day.checkIn),
      }
      all.push(make(emp.id, date, effective))
    }
  }
  return all
}
