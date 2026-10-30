import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { db } from '@/services/demo/store'
import type { WorkTask } from '@/types/domain'

interface TasksDeadlinesTableProps {
  tasks: WorkTask[]
  loading: boolean
}

export function TasksDeadlinesTable({ tasks, loading }: TasksDeadlinesTableProps) {
  return (
    <Card className="overflow-hidden lg:col-span-4">
      <div className="p-4 pb-3 sm:p-5 sm:pb-3.5">
        <SectionTitle
          title="Tasks & deadlines"
          description="Keep track of work across the team"
          right={
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              View all <ArrowRight size={12} />
            </Link>
          }
        />
      </div>
      <div className="scroll-x">
        <table className="w-full border-collapse text-sm" role="table">
          <thead>
            <tr className="border-y border-slate-200/80 bg-[#FAFBFD]">
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                Task
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3 text-left text-xs font-medium text-slate-500">
                Assignee
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3 text-left text-xs font-medium text-slate-500">
                Deadline
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3 text-[13px] font-medium">
                  <Link to={`/tasks/${t.id}`} className="line-clamp-1 text-ink-deep hover:text-brand-600 hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px] text-slate-600">{t.assigneeName}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px] tabular-nums text-slate-500">
                  {t.dueDate === db.today
                    ? 'Today'
                    : new Date(`${t.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                </td>
              </tr>
            ))}
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-5">
                  <Skeleton className="h-4 w-full" />
                </td>
              </tr>
            ) : null}
            {!loading && tasks.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="No pending tasks" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
