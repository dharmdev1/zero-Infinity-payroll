import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, EmptyState } from '@/components/ui/base'
import { TextInput } from '@/components/ui/form'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { settingsService } from '@/services/settings'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { ROLE_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import type { OrgUser } from '@/types/domain'
import { formatNptDateTime } from '@/utils/npt'

const roleTone = (r: Role): 'blue' | 'green' | 'purple' => (r === 'SUPER_ADMIN' ? 'blue' : r === 'HR_ADMIN' ? 'green' : 'purple')
const statusTone = (s: OrgUser['status']): 'green' | 'orange' | 'gray' => (s === 'ACTIVE' ? 'green' : s === 'INVITED' ? 'orange' : 'gray')

export function UsersSettingsPage() {
  useHeader('Users', [{ label: 'Workspace' }, { label: 'Settings', to: '/settings/users' }])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const users = useQuery({
    queryKey: ['settings', 'users', { search, page }],
    placeholderData: keepPreviousData,
    queryFn: () => settingsService.users(search, page, 10),
  })

  const columns: Array<Column<OrgUser>> = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} tone="blue" size="sm" />
          <div>
            <p className="font-medium text-ink">{u.name}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'employeeId', header: 'Employee', render: (u) => u.employeeId ?? '—' },
    { key: 'role', header: 'Role', align: 'center', render: (u) => <Badge tone={roleTone(u.role)}>{ROLE_LABELS[u.role]}</Badge> },
    { key: 'status', header: 'Status', align: 'center', render: (u) => <Badge tone={statusTone(u.status)} dot>{u.status.toLowerCase()}</Badge> },
    { key: 'lastActiveAt', header: 'Last active', align: 'right', render: (u) => formatNptDateTime(u.lastActiveAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.alert('User role/status changes call the settings API and are audited. Disabled in the frontend build.')}
        >
          Manage
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Users" description="Workspace accounts mapped to roles. A user maps to at most one employee record.">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}>
          <TextInput className="w-52" placeholder="Search users" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search users" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Button onClick={() => window.alert('Invitations are backend flows (POST /settings/users/invite). Disabled in the frontend build.')}>Invite user</Button>
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={users.data?.items ?? []}
        rowKey={(u) => u.id}
        loading={users.isLoading}
        emptyState={<EmptyState title="No users match" />}
        footer={<Pagination page={page} pageSize={10} total={users.data?.total ?? 0} onPage={setPage} countsLabel="users" />}
      />
    </div>
  )
}
