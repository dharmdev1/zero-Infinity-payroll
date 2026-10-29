import { Card } from '@/components/ui/base'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_LABELS, ROLE_PERMISSIONS, ROLES, ALL_PERMISSIONS, PERMISSION_LABELS } from '@/types/rbac'
import type { Permission } from '@/types/rbac'

export function PermissionsSettingsPage() {
  useHeader('Permissions', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/users' }, { label: 'Permissions' }])

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Permissions" description="Full permission × role matrix derived from the centralized RBAC vocabulary." />

      <Card>
        <div className="scroll-x">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#F8FAFD]">
                <th className="table-caption px-4 py-3">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="table-caption px-4 py-3 text-center">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p) => (
                <tr key={p} className="border-t border-line first:border-t-0">
                  <td className="px-4 py-2.5 align-middle text-[13px]">
                    {PERMISSION_LABELS[p]}
                    <span className="block font-mono text-[10px] text-muted">{p}</span>
                  </td>
                  {ROLES.map((r) => {
                    const granted = ROLE_PERMISSIONS[r].includes(p as Permission)
                    return (
                      <td key={r} className="px-4 py-2.5 text-center align-middle text-[13px]">
                        <span aria-label={granted ? 'granted' : 'not granted'} className={granted ? 'font-bold text-success' : 'text-muted/40'}>{granted ? '✓' : '—'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
