/**
 * Nepal time (Asia/Kathmandu, UTC+05:45) and Mon–Fri workweek helpers.
 *
 * Attendance times are displayed in NPT. The browser's local timezone never
 * determines business rules; when the backend stores timestamps these helpers
 * format them with a fixed offset. A correct/native UTC+05:45 constant is used
 * for minutes-offset maths (+5h45m = 345 minutes).
 */
export const NPT_OFFSET_MINUTES = 5 * 60 + 45
export const NPT_LABEL = 'NPT (UTC+05:45)'

/** Formats an ISO instant as a Nepali local date string, e.g. "28 Oct 2026". */
export function formatNptDate(iso: string, withWeekday = false): string {
  const d = baseDate(iso)
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
  if (!withWeekday) return day
  return `${weekdayLong(d)}, ${day}`
}

function baseDate(iso: string): Date {
  const ms = Date.parse(iso.endsWith('Z') || /[+\-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}+05:45`)
  if (Number.isNaN(ms)) throw new Error(`Invalid ISO string: ${iso}`)
  return new Date(ms + NPT_OFFSET_MINUTES * 60_000)
}

export function weekdayLong(d: Date): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter((s) => /^[A-Za-z]+$/.test(s))[Math.min(6, Math.max(0, d.getUTCDay()))]
}

export function weekdayShortNpt(iso: string): string {
  const d = baseDate(iso)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]
}

/** "28 Oct 2026 · 09:24 AM NPT" */
export function formatNptDateTime(iso: string): string {
  const d = baseDate(iso)
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
  return `${day} · ${formatMinutesOfDay(minutesOfDay(d))} NPT`
}

export function minutesOfDay(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

export function formatMinutesOfDay(min: number): string {
  const norm = ((min % 1440) + 1440) % 1440
  const h24 = Math.floor(norm / 60)
  const m = norm % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "7h 42m" (null-safe). */
export function formatWorkMinutes(minutes: number | null): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}m`
}

/** Standard shift 09:30–17:30. Late = after 09:30. */
export const SHIFT_START_MINUTES = 9 * 60 + 30
export const SHIFT_END_MINUTES = 17 * 60 + 30
export const SHIFT_LABEL = '09:30 – 17:30 · Mon–Fri · NPT'

/** Nepal is UTC+05:45: a workweek is Monday–Friday. */
export function isNptWorkday(isoDate: string): boolean {
  const d = baseDate(`${isoDate}T00:00:00`)
  const day = d.getUTCDay()
  return day >= 1 && day <= 5
}

export function parseClockToMinutes(clock: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(clock.trim())
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const suffix = m[3]?.toUpperCase()
  if (suffix) {
    if (h < 1 || h > 12) return null
    if (suffix === 'PM' && h !== 12) h += 12
    if (suffix === 'AM' && h === 12) h = 0
  } else if (h > 23 || min > 59) {
    return null
  }
  return h * 60 + min
}

export function minutesToClock(min: number | null | undefined): string | null {
  if (min == null) return null
  return formatMinutesOfDay(min)
}

export type DerivedAttendanceStatus = 'Present' | 'Late' | 'Absent' | 'On leave' | 'Weekend' | 'Upcoming'

/**
 * Deterministic status hint per the attendance handoff:
 * Late = check-in after 09:30; approved leave is separate; missing data on an
 * upcoming day means not recorded (never silently labelled Absent).
 * The backend remains authoritative; this is a display helper.
 */
export function deriveAttendanceHint(input: {
  date: string
  isFuture: boolean
  onApprovedLeave: boolean
  checkInMinutes: number | null
  checkOutMinutes: number | null
}): { status: DerivedAttendanceStatus; workMinutes: number | null } {
  if (input.isFuture) return { status: input.onApprovedLeave ? 'On leave' : 'Upcoming', workMinutes: null }
  if (input.onApprovedLeave) return { status: 'On leave', workMinutes: null }
  if (!isNptWorkday(input.date)) return { status: 'Weekend', workMinutes: null }
  if (input.checkInMinutes == null) return { status: 'Absent', workMinutes: null }
  const late = input.checkInMinutes > SHIFT_START_MINUTES
  const work = input.checkOutMinutes == null ? null : Math.max(0, input.checkOutMinutes - input.checkInMinutes)
  return { status: late ? 'Late' : 'Present', workMinutes: work }
}
