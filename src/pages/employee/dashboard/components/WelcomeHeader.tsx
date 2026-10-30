import { Card } from '@/components/ui/base'

interface WelcomeHeaderProps {
  firstName: string
  todayFormatted: string
}

export function WelcomeHeader({ firstName, todayFormatted }: WelcomeHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-[24px] font-bold tracking-tight text-ink md:text-[26px]">
          Good morning, {firstName} <span aria-hidden="true">👋</span>
        </h2>
        <p className="mt-1 text-[13px] text-muted">Here's your workday at a glance. Have a productive day!</p>
      </div>
      <Card className="px-4 py-2.5">
        <p className="text-[13px] font-medium text-ink">{todayFormatted}</p>
      </Card>
    </div>
  )
}
