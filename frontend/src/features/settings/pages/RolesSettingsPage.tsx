import { Badge, Card, InfoNote } from '@/components/ui/base'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, ROLES, PERMISSION_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'

const roleBadgeTone = (role: Role): 'blue' | 'green' | 'purple' => (role === 'SUPER_ADMIN' ? 'blue' : role === 'HR_ADMIN' ? 'green' : 'purple')

export function RolesSettingsPage() {
  useHeader('Roles', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/users' }, { label: 'Roles' }])

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Roles" description="Exactly three roles. The permission matrix below is the source of truth for the frontend guard checks." />

      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role) => (
          <Card key={role} className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">{ROLE_LABELS[role]}</h3>
              <Badge tone={roleBadgeTone(role)}>{ROLE_PERMISSIONS[role].length} permissions</Badge>
            </div>
            <p className="mt-2 text-[13px] text-muted">{ROLE_DESCRIPTIONS[role]}</p>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
              {ROLE_PERMISSIONS[role].slice(0, 10).map((p) => (
                <li key={p} className="flex items-center gap-2 text-muted"><span className="text-success">✓</span> {PERMISSION_LABELS[p]}</li>
              ))}
              {ROLE_PERMISSIONS[role].length > 10 ? (
                <li className="text-muted">+ {ROLE_PERMISSIONS[role].length - 10} more</li>
              ) : null}
            </ul>
          </Card>
        ))}
      </div>

      <InfoNote tone="blue">
        Frontend permission checks are UX only. The FastAPI backend must re-check role claims on every request — never trust client state.
      </InfoNote>
    </div>
  )
}
