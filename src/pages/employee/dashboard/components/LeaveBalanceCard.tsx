import { Link } from 'react-router-dom'
import { Badge, Button, Card, SectionTitle } from '@/components/ui/base'
import type { Announcement } from '@/types/domain'

function formatWeekday(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(iso))
}

interface LeaveBalanceCardProps {
  availableAnnual: number
  announcements: Announcement[]
}

export function LeaveBalanceCard({ availableAnnual, announcements }: LeaveBalanceCardProps) {
  return (
    <div className="space-y-4 lg:col-span-3">
      <Card className="p-4 sm:p-5">
        <SectionTitle title="Leave & holidays" description="Plan time away from work" />
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs font-medium text-muted">Annual leave remaining</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xl font-bold text-ink">{availableAnnual} days</p>
            <Badge tone="orange" dot>
              1 REQUEST PENDING
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/my/leave">
              <Button size="sm">Request leave</Button>
            </Link>
            <Link to="/leave/balances" className="text-[13px] font-medium text-brand-600 hover:underline">
              View holidays
            </Link>
          </div>
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <SectionTitle title="Company announcements" description="Updates from your team" />
        <ul className="mt-3 space-y-2.5">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600"
                aria-hidden="true"
              >
                i
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">{a.title}</p>
                <p className="text-xs text-muted">{a.body}</p>
                <p className="mt-0.5 text-[11px] text-muted/80">
                  Posted {formatWeekday(a.postedAt)} · {a.author}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Link to="/my/documents" className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:underline">
          All announcements →
        </Link>
      </Card>
    </div>
  )
}
