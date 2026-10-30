import { useRef, useState, useSyncExternalStore } from 'react'
import type { ChangeEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Check, ImagePlus, RotateCcw } from 'lucide-react'
import { Badge, Button, Card, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { settingsService } from '@/services/settings'
import type { CompanyProfileSettings } from '@/services/settings'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { SettingsSubNav } from '@/modules/settings/SettingsSubNav'
import { useAuth } from '@/app/auth-context'
import { cn } from '@/utils/cn'

const LOGO_TONE_OPTIONS: Array<{ value: CompanyProfileSettings['logoTone']; label: string; swatchClass: string }> = [
  { value: 'blue', label: 'Brand Blue', swatchClass: 'bg-brand-600 text-white' },
  { value: 'indigo', label: 'Indigo', swatchClass: 'bg-indigo-600 text-white' },
  { value: 'emerald', label: 'Emerald', swatchClass: 'bg-emerald-600 text-white' },
  { value: 'purple', label: 'Purple', swatchClass: 'bg-purple-600 text-white' },
  { value: 'rose', label: 'Rose', swatchClass: 'bg-rose-600 text-white' },
  { value: 'slate', label: 'Slate', swatchClass: 'bg-slate-800 text-white' },
]

export function CompanySettingsPage() {
  useHeader('Company settings', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/company' }, { label: 'Company' }])
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const headcount = useQuery({ queryKey: ['settings', 'headcount'], queryFn: () => settingsService.headcount() })

  const company = useSyncExternalStore(
    settingsService.subscribeCompanyProfile,
    settingsService.getCompanyProfile,
  )
  const [savedNotice, setSavedNotice] = useState(false)

  const handleFieldChange = (patch: Partial<CompanyProfileSettings>) => {
    setSavedNotice(false)
    settingsService.updateCompanyProfile(patch, { viewer: session })
  }

  const handleLegalNameChange = (nextLegalName: string) => {
    const trimmed = nextLegalName.trim()
    const autoShort =
      trimmed.replace(/\s*(Pvt\.?\s*Ltd\.?|Technologies.*|Inc\.?|LLC)\s*$/i, '').trim() || trimmed || 'Workspace'
    const autoInitial = autoShort[0]?.toUpperCase() || 'Z'
    handleFieldChange({
      name: nextLegalName,
      shortName: autoShort,
      logoText: company.logoText.length <= 1 ? autoInitial : company.logoText,
    })
  }

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleFieldChange({ logoImageUrl: reader.result })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = () => {
    settingsService.updateCompanyProfile(company, {
      actor: session?.name ?? 'Admin',
      recordAudit: true,
      viewer: session,
    })
    void queryClient.invalidateQueries({ queryKey: ['settings', 'audit'] })
    setSavedNotice(true)
  }

  const activeToneSwatch =
    LOGO_TONE_OPTIONS.find((t) => t.value === company.logoTone)?.swatchClass ?? 'bg-brand-600 text-white'

  return (
    <div className="space-y-4">
      <SettingsSubNav />
      <PageHeaderBar title="Company settings" description="Organization profile and header brand identity used across the workspace.">
        {savedNotice ? (
          <Badge tone="green" dot>
            <Check size={12} className="mr-1 inline" /> Saved & synced to header
          </Badge>
        ) : null}
        <Button onClick={handleSave}>Save changes</Button>
      </PageHeaderBar>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <SectionTitle
                title="Company profile & brand logo"
                description="Customize the header logo badge, display title, and legal organization name."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-soft/60 px-3.5 py-2.5">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl font-mono text-sm font-bold shadow-sm',
                  activeToneSwatch,
                )}
              >
                {company.logoImageUrl ? (
                  <img src={company.logoImageUrl} alt={company.shortName} className="h-full w-full object-cover" />
                ) : (
                  company.logoText
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{company.shortName || 'Company Name'}</p>
                <p className="text-[11px] text-muted">Live header logo preview</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                aria-label="Upload company logo image"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={13} className="mr-1" /> Upload logo
              </Button>
              {company.logoImageUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFieldChange({ logoImageUrl: null })}
                  title="Reset to monogram logo"
                >
                  <RotateCcw size={13} className="mr-1" /> Use text
                </Button>
              ) : null}
            </div>
          </div>

          <dl className="mt-4 space-y-4 text-[13px]">
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Legal name</dt>
              <dd>
                <TextInput
                  className="max-w-md"
                  value={company.name}
                  onChange={(e) => handleLegalNameChange(e.target.value)}
                  aria-label="Legal name"
                />
              </dd>
            </div>

            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Header display name</dt>
              <dd>
                <TextInput
                  className="max-w-md"
                  value={company.shortName}
                  onChange={(e) => handleFieldChange({ shortName: e.target.value })}
                  aria-label="Header display name"
                />
              </dd>
            </div>

            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Logo badge text & color</dt>
              <dd className="flex flex-wrap items-center gap-3">
                <TextInput
                  className="w-24 font-mono uppercase"
                  maxLength={3}
                  value={company.logoText}
                  onChange={(e) => handleFieldChange({ logoText: e.target.value, logoImageUrl: null })}
                  aria-label="Logo badge text"
                  placeholder="Z"
                />
                <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Logo badge color">
                  {LOGO_TONE_OPTIONS.map((opt) => {
                    const active = company.logoTone === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFieldChange({ logoTone: opt.value })}
                        title={opt.label}
                        aria-label={opt.label}
                        aria-pressed={active}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold transition-all',
                          opt.swatchClass,
                          active ? 'ring-2 ring-brand-500 ring-offset-2' : 'opacity-75 hover:opacity-100',
                        )}
                      >
                        {company.logoText.slice(0, 1) || 'Z'}
                      </button>
                    )
                  })}
                </div>
              </dd>
            </div>

            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Timezone</dt>
              <dd className="text-ink">{company.timezone}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Workweek</dt>
              <dd className="text-ink">{company.workweek}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Currency</dt>
              <dd className="text-ink">{company.currency}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <dt className="text-muted">Standard shift</dt>
              <dd className="text-ink">{company.shift}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Headcount" description="Directory counts by employment status." />
          <div className="mt-4 space-y-3 text-[13px]">
            {[
              ['Total', headcount.data?.total, 'text-ink'],
              ['Active', headcount.data?.active, 'text-success'],
              ['Probation', headcount.data?.probation, 'text-warning'],
              ['Inactive', headcount.data?.inactive, 'text-muted'],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-muted">{label}</span>
                {headcount.isLoading ? <Skeleton className="h-4 w-10" /> : <span className={`text-sm font-bold ${cls}`}>{value ?? '—'}</span>}
              </div>
            ))}
          </div>
          <Link to="/employees" className="mt-4 inline-flex text-[13px] font-medium text-brand-600 hover:underline">Open directory →</Link>
        </Card>
      </div>

      <InfoNote tone="orange">
        Timezone and workweek are business rules for Nepal time; the server owns them. Changing the workweek would shift attendance
        denominators and payroll eligibility — that is a backend change with data migration.
      </InfoNote>
    </div>
  )
}
