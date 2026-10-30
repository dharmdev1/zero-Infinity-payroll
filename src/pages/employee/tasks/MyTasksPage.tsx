import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { taskService } from '@/services/tasks'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { DEMO_TODAY } from '@/services/demo/store'
import { useMyEmployeeId } from '@/modules/employees/self-shared'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TO_DO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function MyTasksPage() {
  useHeader('My tasks', [{ label: 'Workspace' }, { label: 'My tasks' }])
  const [status, setStatus] = useState('')

  const { session } = useAuth()
  const employeeId = useMyEmployeeId()
  const mine = useQuery({
    queryKey: ['tasks', 'mine', employeeId],
    queryFn: () => taskService.listMine(employeeId),
    enabled: !!employeeId,
  })

  const tasks = (mine.data ?? []).filter((t) => (status ? t.status === status : true))
  const dueSoon = tasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate <= DEMO_TODAY).length
  const open = tasks.filter((t) => t.status !== 'COMPLETED').length

  return (
    <div className="space-y-4">
      <PageHeaderBar title="My tasks" description="Work assigned to you across all projects.">
        <FilterSelect className="w-40" label="Status filter" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        {session?.role !== 'EMPLOYEE' ? <Link to="/tasks"><Button variant="secondary">All tasks</Button></Link> : null}
      </PageHeaderBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Assigned" value={String(tasks.length)} loading={mine.isLoading} icon={null as never} note="Matches current filter" noteTone="blue" />
        <StatCard label="Open" value={String(open)} loading={mine.isLoading} icon={null as never} note="Not completed yet" noteTone="orange" />
        <StatCard label="Due today or overdue" value={String(dueSoon)} loading={mine.isLoading} icon={null as never} note={`Anchor date ${DEMO_TODAY}`} noteTone="red" />
      </div>

      <Card>
        <ul className="divide-y divide-line">
          {mine.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="px-6 py-3"><Skeleton className="h-4 w-full" /></li>)
            : tasks.length === 0
              ? <li><EmptyState title="No tasks here" description="Adjust the filter or enjoy the clear board." /></li>
              : tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <Link to={`/tasks/${t.id}`} className="text-[13px] font-medium text-brand-600 hover:underline">{t.title}</Link>
                      <p className="text-xs text-muted">{t.projectName ?? 'Standalone'} · due {t.dueDate} · {t.priority}</p>
                    </div>
                    <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                  </li>
                ))}
        </ul>
      </Card>
    </div>
  )
}
