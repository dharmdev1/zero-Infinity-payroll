import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '@/components/ui/base'

interface AttendanceCardProps {
  onCheckIn: () => void
}

export function AttendanceCard({ onCheckIn }: AttendanceCardProps) {
  return (
    <Card className="p-4 sm:p-5 lg:col-span-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Today's attendance</h3>
          <p className="mt-0.5 text-[13px] text-muted">Keep your attendance up to date</p>
        </div>
        <Badge tone="orange" dot>
          NOT CHECKED IN
        </Badge>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Current status</p>
          <p className="mt-0.5 text-base font-bold text-ink">Not checked in</p>
          <p className="text-xs text-muted">Remember to check in when you start work.</p>
        </div>
        <div>
          <p className="text-xs text-muted">Expected work hours</p>
          <p className="mt-0.5 text-base font-bold text-ink">9:30 AM – 5:30 PM</p>
          <p className="text-xs text-muted">Monday–Friday · NPT (UTC+05:45)</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button size="sm" onClick={onCheckIn}>
          <span className="inline-flex items-center gap-1.5">Check in</span>
        </Button>
        <Link to="/my/attendance">
          <Button variant="secondary" size="sm">Request correction</Button>
        </Link>
      </div>
    </Card>
  )
}
