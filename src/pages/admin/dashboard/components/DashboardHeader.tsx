import { Card } from '@/components/ui/base'

interface DashboardHeaderProps {
  userName: string
  periodLabel?: string
}

export function DashboardHeader({ userName, periodLabel = 'October 2026' }: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-[24px] font-bold tracking-tight text-ink md:text-[26px]">Good morning, {userName}</h2>
        <p className="mt-1 text-[13px] text-muted">Here's what's happening across your company today.</p>
      </div>
      <Card className="px-4 py-2.5">
        <p className="text-[13px] font-medium text-ink">{periodLabel}</p>
      </Card>
    </div>
  )
}
