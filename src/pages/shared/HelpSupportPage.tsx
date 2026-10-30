import { Card, InfoNote, SectionTitle } from '@/components/ui/base'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { SHIFT_LABEL } from '@/utils/npt'

export function HelpSupportPage() {
  useHeader('Help & support', [{ label: 'Workspace' }, { label: 'Help & support' }])

  return (
    <div className="space-y-4">
      <PageHeaderBar
        title="Help & support"
        description="Workspace conventions, HR contacts, and Nepal operating rules for Zero Infinity Technologies."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="Operating standards" description="Applied consistently across attendance, leave, and payroll." />
          <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
            <li>• {SHIFT_LABEL}</li>
            <li>• Check-in after 09:30 NPT is marked Late (included in Present totals).</li>
            <li>• Weekends (Sat–Sun) never consume leave balances.</li>
            <li>• All monetary values are stored in integer paisa (NPR).</li>
          </ul>
        </Card>

        <Card className="p-6">
          <SectionTitle title="People Operations & IT Desk" description="Reach out for profile updates, attendance corrections, or access requests." />
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">HR Operations</dt>
              <dd className="font-medium text-ink">hr@zeroinfinity.tech</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Payroll & Finance</dt>
              <dd className="font-medium text-ink">finance@zeroinfinity.tech</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">IT Support</dt>
              <dd className="font-medium text-ink">it-help@zeroinfinity.tech</dd>
            </div>
          </dl>
        </Card>
      </div>

      <InfoNote tone="blue">
        Need a role or permission change? Ask a Super Admin to review your account under Settings → Users.
      </InfoNote>
    </div>
  )
}
