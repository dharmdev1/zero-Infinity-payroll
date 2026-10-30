import { Badge, Card, Progress, SectionTitle, Skeleton } from '@/components/ui/base'
import type { AdminDashboardCounts } from '../types'

interface AttendanceOverviewProps {
  counts: AdminDashboardCounts
  attendanceRate: number
  loading: boolean
}

export function AttendanceOverview({ counts, attendanceRate, loading }: AttendanceOverviewProps) {
  const stats = [
    { label: 'Present', value: Math.max(0, counts.present - counts.late), tone: 'green' as const },
    { label: 'Late', value: counts.late, tone: 'orange' as const },
    { label: 'Absent', value: counts.absent, tone: 'red' as const },
  ]

  return (
    <Card className="p-4 sm:p-5 lg:col-span-4">
      <SectionTitle title="Attendance overview" description="Today's team attendance" right={<Badge tone="green" dot>Live</Badge>} />
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-12 w-36" />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <p className="text-[28px] font-bold leading-none text-ink sm:text-[32px]">{attendanceRate}%</p>
              <p className="text-xs text-muted">of employees checked in</p>
            </div>
            <Progress className="mt-3" value={attendanceRate} />
          </>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3.5">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${s.tone === 'green' ? 'bg-success' : s.tone === 'orange' ? 'bg-warning-accent' : 'bg-danger'}`}
                aria-hidden="true"
              />
              {s.label}
            </p>
            <p className="mt-0.5 text-lg font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
