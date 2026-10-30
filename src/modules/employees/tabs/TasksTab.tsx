import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { taskService } from '@/services/tasks'
import type { CreateTaskInput } from '@/services/tasks'
import { CreateTaskDialog } from '@/modules/projects'
import { useAuth } from '@/app/auth-context'

export function EmployeeTasksTab({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [assignOpen, setAssignOpen] = useState(false)

  const tasks = useQuery({
    queryKey: ['tasks', 'emp', employeeId],
    queryFn: () => taskService.listMine(employeeId),
  })

  const createTaskMut = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'emp', employeeId] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setAssignOpen(false)
    },
  })

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-2">
        <h3 className="text-[15px] font-semibold text-ink">Tasks assigned to {employeeName}</h3>
        {can('tasks.manage') ? (
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus size={14} className="mr-1" /> Assign task
          </Button>
        ) : null}
      </div>
      <ul className="divide-y divide-line">
        {tasks.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-6 py-3">
                <Skeleton className="h-4 w-full" />
              </li>
            ))
          : (tasks.data ?? []).length === 0
            ? (
                <li>
                  <EmptyState
                    title="No tasks assigned"
                    action={
                      can('tasks.manage') ? (
                        <Button size="sm" onClick={() => setAssignOpen(true)}>
                          <Plus size={14} className="mr-1" /> Assign task
                        </Button>
                      ) : undefined
                    }
                  />
                </li>
              )
            : tasks.data?.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                  <div>
                    <Link to={`/tasks/${t.id}`} className="text-[13px] font-medium text-brand-600 hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {t.projectName ?? 'Standalone'} · due {t.dueDate} · {t.priority}
                    </p>
                  </div>
                  <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />
                </li>
              ))}
      </ul>

      {assignOpen ? (
        <CreateTaskDialog
          defaultAssigneeId={employeeId}
          onClose={() => setAssignOpen(false)}
          pending={createTaskMut.isPending}
          onConfirm={(input) => createTaskMut.mutate(input)}
        />
      ) : null}
    </Card>
  )
}
