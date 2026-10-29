/**
 * Nepalese Rupee helpers. Money is carried as paisa integers (1 rupee = 100
 * paisa) so UI code never does floating-point arithmetic. Payroll totals are
 * authoritative on the backend only — the frontend is presentational.
 */
export function formatNpr(paisa: number, opts: { compact?: boolean; includeDecimals?: boolean } = {}): string {
  const neg = paisa < 0
  const abs = Math.abs(paisa)
  const rupees = opts.includeDecimals ? abs : Math.round(abs / 100)
  const fmt = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: opts.includeDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  })
  const body = fmt.format(rupees)
  return `${neg ? '−' : ''}NPR ${body}`
}

/** Decimal-safe string for forms/reports, e.g. 72000000 -> "720000.00". */
export function paisaToRupeeString(paisa: number): string {
  const sign = paisa < 0 ? '-' : ''
  const abs = Math.abs(paisa)
  const rupees = Math.floor(abs / 100)
  const remainder = abs % 100
  return `${sign}${rupees}.${String(remainder).padStart(2, '0')}`
}

/** Parses user-entered rupees ("7,20,000" or "7200.50") into paisa. */
export function rupeeStringToPaisa(input: string): number {
  const cleaned = input.replace(/[,\s]/g, '')
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(cleaned)
  if (!m) throw new Error(`Invalid amount: ${input}`)
  const sign = m[1] ? -1 : 1
  const rupees = Number(m[2])
  const decimals = (m[3] ?? '0').padEnd(2, '0').slice(0, 2)
  return sign * (rupees * 100 + Number(decimals))
}
