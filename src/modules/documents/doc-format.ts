import type { Tone } from '@/components/ui/base'
import type { CompanyDocument } from '@/types/domain'

export function formatDocSize(sizeKb: number): string {
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`
  }
  return `${sizeKb} KB`
}

export function docCategoryTone(category: CompanyDocument['category']): Tone {
  switch (category) {
    case 'Policy':
      return 'blue'
    case 'Handbook':
      return 'purple'
    case 'Template':
      return 'green'
    case 'Compliance':
      return 'orange'
  }
}
