/**
 * Nepal Standard Time (UTC+05:45) date, time, and attendance helpers.
 */
export const SHIFT_LABEL = 'Standard shift: 09:30 – 17:30 NPT (UTC+05:45) · Mon–Fri'

export function formatNptDate(isoOrDate: string, includeWeekday = false): string {
  if (!isoOrDate) return '—'
  const normalized = isoOrDate.includes('T') ? isoOrDate : `${isoOrDate}T00:00:00Z`
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return isoOrDate
  return new Intl.DateTimeFormat('en-GB', {
    ...(includeWeekday ? { weekday: 'short' } : {}),
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(d)
}

export function formatNptDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu',
  }).format(d)
}

export function formatWorkMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '—'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins === 0 ? `${hrs}h 00m` : `${hrs}h ${String(mins).padStart(2, '0')}m`
}

export function parseClockToMinutes(clock: string): number | null {
  const trimmed = clock.trim()
  if (!trimmed) return null
  const ampmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed)
  if (ampmMatch) {
    let h = Number(ampmMatch[1])
    const m = Number(ampmMatch[2])
    const period = ampmMatch[3].toUpperCase()
    if (h < 1 || h > 12 || m < 0 || m > 59) return null
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12
    return h * 60 + m
  }
  const h24Match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (h24Match) {
    const h = Number(h24Match[1])
    const m = Number(h24Match[2])
    if (h < 0 || h > 23 || m < 0 || m > 59) return null
    return h * 60 + m
  }
  return null
}

export function deriveAttendanceHint(input: {
  date: string
  isFuture: boolean
  onApprovedLeave: boolean
  checkInMinutes: number | null
  checkOutMinutes: number | null
}): { status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'UPCOMING'; workMinutes: number | null } {
  const day = new Date(`${input.date}T00:00:00Z`).getUTCDay()
  if (day === 0 || day === 6) return { status: 'WEEKEND', workMinutes: null }
  if (input.isFuture) return { status: 'UPCOMING', workMinutes: null }
  if (input.onApprovedLeave) return { status: 'ON_LEAVE', workMinutes: null }
  if (input.checkInMinutes == null) return { status: 'ABSENT', workMinutes: null }
  const status = input.checkInMinutes > 9 * 60 + 30 ? 'LATE' : 'PRESENT'
  const workMinutes =
    input.checkOutMinutes != null && input.checkOutMinutes > input.checkInMinutes
      ? input.checkOutMinutes - input.checkInMinutes
      : null
  return { status, workMinutes }
}
