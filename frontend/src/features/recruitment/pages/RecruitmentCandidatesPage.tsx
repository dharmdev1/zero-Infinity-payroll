import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Button, EmptyState, InfoNote } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { TextInput } from '@/components/ui/form'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { recruitmentService } from '@/services/recruitment'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { useAuth } from '@/app/auth-context'
import type { Candidate } from '@/types/domain'
import { CANDIDATE_STAGES, STAGE_TONES, nextStageOf } from '../recruitment-constants'

export function RecruitmentCandidatesPage() {
  useHeader('Candidates', [{ label: 'Workspace' }, { label: 'Recruitment', to: '/recruitment/jobs' }, { label: 'Candidates' }])
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [stage, setStage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const candidates = useQuery({
    queryKey: ['candidates', search, stage],
    queryFn: () => recruitmentService.candidates(search, stage),
  })

  const move = useMutation({
    mutationFn: ({ id, next }: { id: string; next: Candidate['stage'] }) => recruitmentService.moveCandidateStage(id, next),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  })

  const columns: Array<Column<Candidate>> = [
    {
      key: 'name',
      header: 'Candidate',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} tone="purple" size="sm" />
          <div>
            <p className="font-medium text-ink">{c.name}</p>
            <p className="text-xs text-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'jobTitle', header: 'Applied for' },
    { key: 'experience', header: 'Experience' },
    { key: 'appliedAt', header: 'Applied', align: 'right' },
    {
      key: 'stage',
      header: 'Stage',
      align: 'center',
      render: (c) => <Badge tone={STAGE_TONES[c.stage]} dot>{c.stage.toLowerCase()}</Badge>,
    },
    {
      key: 'actions',
      header: 'Advance',
      align: 'center',
      render: (c) => {
        const next = nextStageOf(c.stage)
        if (!next || !can('recruitment.manage')) return <span className="text-muted">—</span>
        return (
          <Button size="sm" variant="secondary" loading={move.isPending} onClick={() => move.mutate({ id: c.id, next })}>
            {next === 'OFFER' ? 'To offer' : next.toLowerCase()}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Candidates" description="Pipeline across all open jobs. Stage moves are audited once the backend is live.">
        <FilterSelect className="w-36" label="Stage filter" value={stage} onChange={setStage} options={CANDIDATE_STAGES} />
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()) }}>
          <TextInput className="w-52" placeholder="Search candidates" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search candidates" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Link to="/recruitment/interviews"><Button variant="secondary">Interviews</Button></Link>
      </PageHeaderBar>

      {move.isSuccess ? <InfoNote tone="green">Candidate moved (demo adapter, not persisted).</InfoNote> : null}

      <DataTable
        columns={columns}
        rows={candidates.data ?? []}
        rowKey={(c) => c.id}
        loading={candidates.isLoading}
        emptyState={<EmptyState title="No candidates match these filters" />}
      />
    </div>
  )
}
