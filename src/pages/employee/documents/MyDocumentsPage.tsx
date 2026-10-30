import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, InfoNote, SectionTitle, Skeleton } from '@/components/ui/base'
import { employeeService } from '@/services/employees'
import { documentService } from '@/services/documents'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { formatNptDate } from '@/utils/npt'
import { publishBackendNotice } from '@/utils/backend-ops'
import { useMyEmployeeId } from '@/modules/employees/self-shared'

export function MyDocumentsPage() {
  useHeader('My documents', [{ label: 'Workspace' }, { label: 'My documents' }])
  const employeeId = useMyEmployeeId()

  const docs = useQuery({ queryKey: ['employees', 'me-docs', employeeId], queryFn: () => employeeService.documents(employeeId), enabled: !!employeeId })
  const shared = useQuery({ queryKey: ['documents', 'my-shared'], queryFn: () => documentService.list({ category: 'Policy', page: 1, pageSize: 8 }) })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My documents" description="Your HR file and shared company policies. Upload slots stay disabled until the backend file contract is live.">
        <Badge tone="gray">PDF / JPG / PNG ≤ sizes per contract</Badge>
      </PageHeaderBar>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-6 pb-2"><SectionTitle title="My HR documents" description="CV, agreements and identity file copies." /></div>
          <ul className="divide-y divide-line">
            {docs.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="px-6 py-3"><Skeleton className="h-4 w-full" /></li>)
              : (docs.data ?? []).map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{d.name}</p>
                      <p className="text-xs text-muted">{d.category} · {d.sizeKb} KB · uploaded {d.uploadedAt}</p>
                    </div>
                    <Badge tone={d.verification === 'Verified' ? 'green' : 'orange'} dot>{d.verification.toLowerCase()}</Badge>
                  </li>
                ))}
          </ul>
        </Card>

        <Card>
          <div className="p-6 pb-2"><SectionTitle title="Company policies" description="Visible company-wide. Downloads use backend signed URLs." /></div>
          <ul className="divide-y divide-line">
            {(shared.data?.items ?? []).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                <div className="min-w-0">
                  <Link to={`/documents/${d.id}`} className="text-[13px] font-medium text-brand-600 hover:underline">{d.name}</Link>
                  <p className="text-xs text-muted">Updated {formatNptDate(`${d.updatedAt}T00:00:00Z`)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => publishBackendNotice('Downloads are backend signed URLs in the real deployment.')}>View</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <InfoNote tone="orange">
        Upload buttons are intentionally disabled: the file contract (multipart, size limits, virus scan) is enforced on the backend.
      </InfoNote>
    </div>
  )
}
