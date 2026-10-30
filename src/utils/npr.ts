/**
 * Currency formatting for Nepalese Rupee (NPR).
 * All monetary amounts are stored as integer paisa (1 NPR = 100 paisa).
 */
export function formatNpr(paisa: number): string {
  const rupees = Math.round(paisa / 100)
  return `NPR ${rupees.toLocaleString('en-IN')}`
}

export function formatNprExact(paisa: number): string {
  const rupees = paisa / 100
  return `NPR ${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
