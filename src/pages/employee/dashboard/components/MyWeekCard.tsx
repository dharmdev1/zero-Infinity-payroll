import { Badge, Card } from '@/components/ui/base'
import type { WeekDayTile } from '../types'

interface MyWeekCardProps {
  weekDays: WeekDayTile[]
  presentDays: number
}

export function MyWeekCard({ weekDays, presentDays }: MyWeekCardProps) {
  return (
    <Card className="p-4 sm:p-5 lg:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">My week</h3>
          <p className="mt-0.5 text-[13px] text-muted">Attendance summary · This week</p>
        </div>
        <Badge tone="green" dot>
          ON TRACK
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {weekDays.map((day) => (
          <div
            key={day.iso}
            className={`rounded-lg border border-line bg-canvas px-1 py-2.5 text-center ${day.isToday ? 'bg-brand-50/60' : ''}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{day.dayCode}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{day.label}</p>
            <span className={`mx-auto mt-1.5 block h-1.5 w-1.5 rounded-full ${day.dot}`} aria-hidden="true" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">{presentDays} days completed this month</p>
    </Card>
  )
}
