import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '@/components/ui/base'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNptDateTime, SHIFT_LABEL } from '@/utils/npt'

const FAQS: Array<{ q: string; a: string }> = [
  { q: 'Why does my balance not change while a request is pending?', a: 'Pending requests never reduce displayed balances. A balance drops only when a request is approved — rejected or cancelled requests have no effect.' },
  { q: 'How is "late" determined?', a: 'Check-in after 09:30 NPT counts as Late in the standard 09:30–17:30 Mon–Fri shift. Late arrivals are still Present and included in that count.' },
  { q: 'Who can correct my attendance?', a: 'HR admins with attendance write access. Corrections are versioned — the original values are retained and every correction writes an audit entry.' },
  { q: 'Why are my documents read-only?', a: 'Uploads enforce a file contract (types and size limits) validated on the backend, so the frontend keeps upload controls disabled until that service is live.' },
  { q: 'What currency and timezone does the system use?', a: 'Nepalese Rupee (NPR) with paisa-safe integer storage, and all business rules run on Nepal time (Asia/Kathmandu, UTC+05:45) with a Monday–Friday workweek.' },
]

export function HelpSupportPage() {
  useHeader('Help & support', [{ label: 'Workspace' }, { label: 'Help' }])

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Help & support" description="How the workspace works and where to get help." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="Frequently asked" description="Practical answers about balances, attendance and permissions." />
          <dl className="mt-4 divide-y divide-line">
            {FAQS.map((f) => (
              <div key={f.q} className="py-4 first:pt-2">
                <dt className="text-[13px] font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <SectionTitle title="Contact" description="People team is the fastest route for most requests." />
            <ul className="mt-4 space-y-3 text-[13px]">
              <li className="flex justify-between gap-3"><span className="text-muted">HR support</span><span className="font-medium text-ink">hr@zeroinfinity.tech</span></li>
              <li className="flex justify-between gap-3"><span className="text-muted">IT helpdesk</span><span className="font-medium text-ink">it@zeroinfinity.tech</span></li>
              <li className="flex justify-between gap-3"><span className="text-muted">Payroll queries</span><span className="font-medium text-ink">finance@zeroinfinity.tech</span></li>
            </ul>
          </Card>
          <Card className="p-6">
            <SectionTitle title="Policies" />
            <p className="mt-2 text-[13px] text-muted">The employee handbook and leave policy live in company documents.</p>
            <Link to="/my/documents" className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:underline">Open my documents →</Link>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Operating hours: {SHIFT_LABEL}. Updates post as announcements on the dashboard.</p>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted">Conversation timestamp example: {formatNptDateTime('2026-10-28T17:30:00+05:45')}.</p>
    </div>
  )
}
