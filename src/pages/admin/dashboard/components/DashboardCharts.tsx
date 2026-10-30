import { ArrowUpRight } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/base'
import { BarChart, type BarDatum } from '@/components/data-display/stat-card'

interface DashboardChartsProps {
  cashBars: BarDatum[]
  canViewPayroll: boolean
  newThisMonth: number
}

export function DashboardCharts({ cashBars, canViewPayroll, newThisMonth }: DashboardChartsProps) {
  if (!canViewPayroll) {
    return (
      <Card className="p-4 sm:p-5 lg:col-span-3">
        <SectionTitle title="Workforce momentum" description="Hiring & onboarding velocity" right={<span className="text-xs font-semibold text-muted">OCT 2026</span>} />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted">New joiners this month</p>
            <p className="text-lg font-bold text-ink sm:text-xl">+{newThisMonth} employees</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-success">
            <ArrowUpRight size={12} /> On track
          </div>
        </div>
        <div className="mt-3">
          <BarChart data={cashBars} ariaLabel="Monthly hiring and onboarding velocity, September to October" height={88} />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-5 lg:col-span-3">
      <SectionTitle title="Finance snapshot" description="Company account activity" right={<span className="text-xs font-semibold text-muted">OCT 2026</span>} />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted">Net cash movement</p>
          <p className="text-lg font-bold text-ink sm:text-xl">+ NPR 2,48,500</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-success">
          <ArrowUpRight size={12} /> 12.8%
        </div>
      </div>
      <div className="mt-3">
        <BarChart data={cashBars} ariaLabel="Monthly net cash movement, September to October" height={88} />
      </div>
    </Card>
  )
}
