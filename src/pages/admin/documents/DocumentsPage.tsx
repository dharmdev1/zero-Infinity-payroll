import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable, Pagination } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { documentService } from '@/services/documents'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import { demoModeNote, notifyUpload } from '@/utils/backend-ops'
import type { CompanyDocument } from '@/types/domain'
import { formatNptDate } from '@/utils/npt'
import { formatDocSize, docCategoryTone } from '@/modules/documents/doc-format'

export function DocumentsPage() {
  useHeader('Company documents', [{ label: 'Workspace' }, { label: 'Documents' }])
  const { can } = useAuth()
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const categoriesQuery = useQuery({ queryKey: ['documents', 'categories'], queryFn: () => documentService.categories(), staleTime: Infinity })
  const docs = useQuery({
    queryKey: ['documents', { category, page }],
    placeholderData: keepPreviousData,
    queryFn: () => documentService.list({ ...(category ? { category } : {}), page, pageSize: 12 }),
  })

  const columns: Array<Column<CompanyDocument>> = [
    {
      key: 'name',
      header: 'Document',
      render: (d) => (
        <div className="max-w-[280px]">
          <Link to={`/documents/${d.id}`} className="font-medium text-brand-600 hover:underline">{d.name}</Link>
          <p className="max-w-[260px] truncate text-xs text-muted">{d.summary}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', align: 'center', render: (d) => <Badge tone={docCategoryTone(d.category)}>{d.category}</Badge> },
    { key: 'owner', header: 'Owner' },
    { key: 'sizeKb', header: 'Size', align: 'right', render: (d) => formatDocSize(d.sizeKb) },
    { key: 'updatedAt', header: 'Updated', align: 'right', render: (d) => formatNptDate(`${d.updatedAt}T00:00:00Z`) },
    { key: 'visibility', header: 'Visibility', align: 'center', render: (d) => <span className="text-xs text-muted">{d.visibility}</span> },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Company documents" description="Policies, templates and shared files. Visibility is enforced by the backend; downloads require a signed URL.">
        <FilterSelect
          className="w-40"
          label="Category filter"
          value={category}
          onChange={(v) => { setCategory(v); setPage(1) }}
          options={[{ value: '', label: 'All categories' }, ...(categoriesQuery.data ?? []).map((c) => ({ value: c, label: c }))]}
        />
        {can('documents.manage') ? (
          <Button variant="secondary" onClick={() => notifyUpload('Document', 'PDF/JPG/PNG ≤10 MB per the file contract')}>
            Upload document
          </Button>
        ) : null}
      </PageHeaderBar>

      {demoModeNote}

      <DataTable
        columns={columns}
        rows={docs.data?.items ?? []}
        rowKey={(d) => d.id}
        loading={docs.isLoading}
        emptyState={<EmptyState title="No documents match these filters" />}
        footer={<Pagination page={page} pageSize={12} total={docs.data?.total ?? 0} onPage={setPage} countsLabel="documents" />}
      />
    </div>
  )
}
