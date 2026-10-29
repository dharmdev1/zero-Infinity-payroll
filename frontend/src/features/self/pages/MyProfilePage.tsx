import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { HairlineList } from '@/components/data-display/fields'
import { employeeService } from '@/services/employees'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNptDate } from '@/utils/npt'
import { useMyEmployeeId } from '../self-shared'

export function MyProfilePage() {
  useHeader('My profile', [{ label: 'Workspace' }, { label: 'My profile' }])
  const employeeId = useMyEmployeeId()
  const me = useQuery({ queryKey: ['employees', 'me', employeeId], queryFn: () => employeeService.get(employeeId), enabled: !!employeeId })

  const e = me.data
  if (me.isLoading || !e) {
    return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-56 w-full" /></div>
  }

  const groups: Array<{ title: string; rows: Array<[string, string]> }> = [
    { title: 'Personal', rows: [['Full name', e.name], ['Date of birth', e.dateOfBirth], ['Gender', e.gender], ['Nationality', e.nationality], ['Address', e.address]] },
    { title: 'Employment', rows: [['Employee ID', e.id], ['Department', e.department], ['Job title', e.jobTitle], ['Employment type', e.employmentType], ['Joining date', e.joiningDate], ['Reporting manager', e.reportingManager], ['Work location', e.workLocation]] },
    { title: 'Contacts', rows: [['Work email', e.workEmail], ['Personal email', e.personalEmail], ['Phone', e.phone]] },
    { title: 'Emergency contact', rows: [['Name', e.emergencyContactName], ['Relationship', e.emergencyContactRelationship], ['Phone', e.emergencyContactPhone]] },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My profile" description="Read-only view of your HR record. Updates go through HR on the backend.">
        <Badge tone={e.status === 'ACTIVE' ? 'green' : e.status === 'PROBATION' ? 'orange' : 'gray'} dot>{e.status.toLowerCase()}</Badge>
      </PageHeaderBar>

      <Card className="flex flex-wrap items-center gap-4 p-6">
        <Avatar name={e.name} tone={e.avatarTone} size="lg" />
        <div>
          <p className="text-lg font-semibold text-ink">{e.name}</p>
          <p className="text-[13px] text-muted">{e.department} · {e.jobTitle}</p>
        </div>
        <div className="ml-auto text-xs text-muted">Joined {formatNptDate(`${e.joiningDate}T00:00:00Z`, true)}</div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.title} className="p-6">
            <SectionTitle title={g.title} />
            <div className="mt-4">
              <HairlineList rows={g.rows.map(([label, value]) => ({ label, value }))} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
