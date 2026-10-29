import { describe, expect, it } from 'vitest'
import { formatNpr, paisaToRupeeString, rupeeStringToPaisa } from './npr'

describe('NPR money helpers (paisa integers, en-IN grouping)', () => {
  it('formats paisa as whole rupees with Indian grouping', () => {
    expect(formatNpr(7_20_00_000)).toBe('NPR 7,20,000')
    expect(formatNpr(45_00)).toBe('NPR 45')
    expect(formatNpr(99)).toBe('NPR 1') // rounds to the nearest rupee
  })

  it('formats negative amounts with a minus sign', () => {
    expect(formatNpr(-12_500)).toBe('−NPR 125')
  })

  it('includeDecimals formats the raw number — it does not divide by 100', () => {
    // includeDecimals is for raw values already denominated sensibly; true
    // paisa-to-decimal display goes through paisaToRupeeString.
    expect(formatNpr(12_345, { includeDecimals: true })).toBe('NPR 12,345')
    expect(paisaToRupeeString(12_345)).toBe('123.45')
  })

  it('converts paisa to a decimal-safe rupee string', () => {
    expect(paisaToRupeeString(720_00_000)).toBe('720000.00')
    expect(paisaToRupeeString(12_345)).toBe('123.45')
    expect(paisaToRupeeString(-50)).toBe('-0.50')
  })

  it('parses Indian-grouped input to paisa and round-trips', () => {
    expect(rupeeStringToPaisa('7,20,000')).toBe(720_00_000)
    expect(rupeeStringToPaisa('7200.50')).toBe(720_050)
    const paisa = 84_50_00
    expect(rupeeStringToPaisa(paisaToRupeeString(paisa))).toBe(paisa)
  })

  it('rejects malformed amounts', () => {
    expect(() => rupeeStringToPaisa('abc')).toThrowError(/Invalid amount/)
  })
})
