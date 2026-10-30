import { Link } from 'react-router-dom'
import { Card, SectionTitle, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { db } from '@/services/demo/store'
import type { WorkTask } from '@/types/domain'

interface MyTasksProps {
  tasks: WorkTask[]
  loading: boolean
}

export function MyTasks({ tasks, loading }: MyTasksProps) {
  return (
    <Card className="overflow-hidden lg:col-span-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 p-4 pb-3 sm:p-5 sm:pb-3.5">
        <SectionTitle title="My tasks" description="Your assigned work and upcoming deadlines" />
        <Link
          to="/my/tasks"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          View all →
        </Link>
      </div>
      <div className="scroll-x">
        <table className="w-full border-collapse text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#FAFBFD]">
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                Task
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3 text-left text-xs font-medium text-slate-500">
                Due date
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3 text-left text-xs font-medium text-slate-500">
                Priority
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : tasks.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-[13px] font-medium">
                      <Link to={`/tasks/${t.id}`} className="line-clamp-1 text-ink-deep hover:text-brand-600 hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-[13px] tabular-nums text-slate-500">
                      {t.dueDate === db.today
                        ? 'Today'
                        : new Date(`${t.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            timeZone: 'UTC',
                          })}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3.5 py-3 text-[13px] font-medium ${
                        t.priority === 'High' ? 'text-rose-600' : t.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      {t.priority}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
