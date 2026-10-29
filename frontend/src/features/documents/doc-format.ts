import type { CompanyDocument } from '@/types/domain'

export function formatDocSize(sizeKb: number): string {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`
}

export function docCategoryTone(category: CompanyDocument['category']): 'blue' | 'green' | 'orange' | 'purple' | 'gray' {
  const map: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'gray'> = { Policy: 'blue', Template: 'purple', Report: 'green', Shared: 'orange', Employee: 'gray' }
  return map[category] ?? 'gray'
}
