import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { StatCard } from '@/components/data-display/stat-card'
import { taskService } from '@/services/tasks'
import { db } from '@/services/demo/store'
import type { WorkTask } from '@/types/domain'

export function EmployeeTasksTab({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const tasks = useQuery({ queryKey: ['tasks', 'mine', employeeId], queryFn: () => taskService.listMine(employeeId) })
  const list = tasks.data ?? []
  const cards = [
    { label: 'Assigned tasks', value: list.length, note: 'Across active projects', tone: 'text-brand-600' },
    { label: 'In progress', value: list.filter((t) => t.status === 'IN_PROGRESS').length, note: 'Due soon', tone: 'text-brand-600' },
    { label: 'Awaiting review', value: list.filter((t) => t.status === 'REVIEW').length, note: 'Ready for manager review', tone: 'text-warning' },
    { label: 'Completed', value: list.filter((t) => t.status === 'COMPLETED').length, note: 'Completed this month', tone: 'text-success' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Assigned tasks</h3>
          <p className="mt-0.5 text-[13px] text-muted">Work assigned to {employeeName} across active projects.</p>
        </div>
        <Link to="/tasks"><Button variant="secondary">Open Tasks & projects</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={String(c.value)} loading={tasks.isLoading} icon={null as never} note={c.note} noteTone={c.note.includes('review') ? 'orange' : c.note.includes('Completed') ? 'green' : 'blue'} />
        ))}
      </div>

      <Card>
        <div className="p-6 pb-4">
          <h3 className="text-[15px] font-semibold text-ink">Task list</h3>
          <p className="mt-0.5 text-[13px] text-muted">October 2026 · Open work first, then due date</p>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[640px] text-sm" role="table">
            <thead>
              <tr className="border-y border-line bg-[#F8FAFD]">
                <th className="table-caption px-6 py-2.5 text-left">Task</th>
                <th className="table-caption px-4 py-2.5 text-left">Project</th>
                <th className="table-caption px-4 py-2.5 text-left">Due date</th>
                <th className="table-caption px-4 py-2.5 text-left">Priority</th>
                <th className="table-caption px-6 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t: WorkTask) => (
                <tr key={t.id}>
                  <td className="px-6 py-3.5 text-[13px] font-medium"><Link to={`/tasks/${t.id}`} className="hover:text-brand-600 hover:underline">{t.title}</Link></td>
                  <td className="px-4 py-3.5 text-[13px] text-muted">{t.projectName ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[13px] text-muted">{t.dueDate}</td>
                  <td className="px-4 py-3.5 text-[13px]">{t.priority}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} /></td>
                </tr>
              ))}
              {tasks.isLoading ? <tr><td colSpan={5} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-6 py-3 text-xs text-muted">Showing all {list.length} assigned tasks · Synced with Tasks &amp; projects · Anchor {db.today}</p>
      </Card>
    </div>
  )
}
