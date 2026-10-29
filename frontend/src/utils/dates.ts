export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
}

export function formatRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T00:00:00Z`)
  const e = new Date(`${endIso}T00:00:00Z`)
  if (startIso === endIso) return formatDateShort(startIso)
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear()
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth()
  const sTxt = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    ...(sameMonth ? {} : { month: sameYear ? 'short' : 'short', year: sameYear ? undefined : 'numeric' }),
    timeZone: 'UTC',
  }).format(s)
  return `${sTxt} – ${formatDateShort(endIso)}`
}

export function monthDayShort(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
}

export function relativeFromNow(iso: string, nowIso: string): string {
  const diffMin = Math.round((Date.parse(iso) - Date.parse(nowIso)) / 60000)
  const abs = Math.abs(diffMin)
  if (abs < 1) return 'just now'
  if (abs < 60) return `${abs} min ago`
  const hours = Math.round(abs / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
