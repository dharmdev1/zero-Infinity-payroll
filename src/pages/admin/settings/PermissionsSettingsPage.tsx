import { Card } from '@/components/ui/base'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_LABELS, ROLE_PERMISSIONS, ROLES, ALL_PERMISSIONS, PERMISSION_LABELS } from '@/types/rbac'
import type { Permission } from '@/types/rbac'
import { SettingsSubNav } from '@/modules/settings/SettingsSubNav'

export function PermissionsSettingsPage() {
  useHeader('Permissions', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/company' }, { label: 'Permissions' }])

  return (
    <div className="space-y-4">
      <SettingsSubNav />
      <PageHeaderBar title="Permissions" description="Full permission × role matrix derived from the centralized RBAC vocabulary." />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-[#F8FAFD]">
                <th scope="col" className="th-caption px-4 py-2.5">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="th-caption px-4 py-2.5 text-center">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p) => (
                <tr key={p} className="border-t border-line first:border-t-0 hover:bg-[#FAFBFD]">
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
