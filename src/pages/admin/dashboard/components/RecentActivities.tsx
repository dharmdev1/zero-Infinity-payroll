import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, SectionTitle } from '@/components/ui/base'
import type { ActivityItem } from '../types'

interface RecentActivitiesProps {
  activities: ActivityItem[]
  canViewAudit: boolean
}

export function RecentActivities({ activities, canViewAudit }: RecentActivitiesProps) {
  const navigate = useNavigate()

  return (
    <Card className="p-4 sm:p-5 lg:col-span-3">
      <SectionTitle title="Recent activity" description="Latest updates from your team" />
      <ul className="mt-3.5 space-y-3">
        {activities.map((a) => (
          <li key={a.name} className="flex items-start gap-2.5">
            <Avatar name={a.name} tone={a.name === 'Finance' ? 'orange' : 'blue'} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-ink">{a.name}</p>
                <span className="shrink-0 text-[11px] text-muted/80">{a.time}</span>
              </div>
              <p className="truncate text-xs text-muted">{a.action}</p>
            </div>
          </li>
        ))}
      </ul>
      {canViewAudit ? (
        <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate('/settings/audit-logs')}>
          Open audit history
        </Button>
      ) : (
        <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate('/leave/approvals')}>
          Review leave approvals
        </Button>
      )}
    </Card>
  )
}
