import { describe, expect, it } from 'vitest'
import {
  NPT_OFFSET_MINUTES,
  SHIFT_LABEL,
  SHIFT_START_MINUTES,
  deriveAttendanceHint,
  formatMinutesOfDay,
  formatNptDate,
  formatNptDateTime,
  formatWorkMinutes,
  isNptWorkday,
  minutesOfDay,
  minutesToClock,
  parseClockToMinutes,
  weekdayShortNpt,
} from './npt'

describe('NPT helpers (Asia/Kathmandu, UTC+05:45)', () => {
  it('uses the correct +5:45 offset', () => {
    expect(NPT_OFFSET_MINUTES).toBe(345)
    expect(SHIFT_LABEL).toContain('Mon–Fri')
  })

  it('formats a local date as "28 Oct 2026"', () => {
    expect(formatNptDate('2026-10-28T00:00:00+05:45')).toBe('28 Oct 2026')
  })

  it('formats a date-time in NPT with 12-hour clock', () => {
    // 17:10 NPT on 28 Oct
    expect(formatNptDateTime('2026-10-28T17:10:00+05:45')).toBe('28 Oct 2026 · 05:10 PM NPT')
  })

  it('treats Mon–Fri as workdays and Sat/Sun as weekend', () => {
    // 2026-10-26 is a Monday, 2026-10-25 is a Sunday
    expect(isNptWorkday('2026-10-26')).toBe(true)
    expect(isNptWorkday('2026-10-30')).toBe(true)
    expect(isNptWorkday('2026-10-31')).toBe(false)
    expect(isNptWorkday('2026-11-01')).toBe(false)
  })

  it('identifies weekdays for NPT instants near midnight', () => {
    expect(weekdayShortNpt('2026-10-28T09:00:00+05:45')).toBe('Wed')
  })

  it(' derives attendance: late after 09:30, weekend and leave win over missing check-in', () => {
    const present = deriveAttendanceHint({ date: '2026-10-28', isFuture: false, onApprovedLeave: false, checkInMinutes: 9 * 60, checkOutMinutes: 17 * 60 + 30 })
    expect(present.status).toBe('Present')
    expect(present.workMinutes).toBe(510)

    const late = deriveAttendanceHint({ date: '2026-10-28', isFuture: false, onApprovedLeave: false, checkInMinutes: SHIFT_START_MINUTES + 1, checkOutMinutes: null })
    expect(late.status).toBe('Late')
    expect(late.workMinutes).toBeNull()

    const weekend = deriveAttendanceHint({ date: '2026-10-25', isFuture: false, onApprovedLeave: false, checkInMinutes: 9 * 60, checkOutMinutes: null })
    expect(weekend.status).toBe('Weekend')

    const leave = deriveAttendanceHint({ date: '2026-10-27', isFuture: false, onApprovedLeave: true, checkInMinutes: null, checkOutMinutes: null })
    expect(leave.status).toBe('On leave')

    const absent = deriveAttendanceHint({ date: '2026-10-26', isFuture: false, onApprovedLeave: false, checkInMinutes: null, checkOutMinutes: null })
    expect(absent.status).toBe('Absent')
  })

  it('formats work minutes null-safe', () => {
    expect(formatWorkMinutes(null)).toBe('—')
    expect(formatWorkMinutes(510)).toBe('8h 30m')
    expect(formatWorkMinutes(480)).toBe('8h')
    expect(formatWorkMinutes(45)).toBe('45m')
  })

  it('parses plain and 12-hour clocks', () => {
    expect(parseClockToMinutes('09:30')).toBe(570)
    expect(parseClockToMinutes('9:05 PM')).toBe(21 * 60 + 5)
    expect(parseClockToMinutes('12:00 AM')).toBe(0)
    expect(parseClockToMinutes('9:60')).toBeNull()
    expect(parseClockToMinutes('not-a-clock')).toBeNull()
  })

  it('round-trips minutes to a display clock', () => {
    expect(minutesToClock(570)).toBe('09:30 AM')
    expect(minutesToClock(null)).toBeNull()
  })

  it('formats minutes-of-day across midnight', () => {
    expect(minutesOfDay(new Date('2026-10-28T03:45:00Z'))).toBe(225)
    expect(formatMinutesOfDay(570)).toBe('09:30 AM')
    expect(formatMinutesOfDay(1050)).toBe('05:30 PM')
    expect(formatMinutesOfDay(1445)).toBe('12:05 AM') // normalises overflow
  })
})
