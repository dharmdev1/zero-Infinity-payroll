import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { taskService } from '@/services/tasks'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { WorkTask } from '@/types/domain'
import { db } from '@/services/demo/store'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../task-constants'

export function TasksPage() {
  const { can } = useAuth()
  const navigate = useNavigate()
  useHeader('Tasks', [{ label: 'Workspace' }, { label: 'Tasks' }])

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [project, setProject] = useState('')

  const tasks = useQuery({
    queryKey: ['tasks', { status, priority, project }],
    queryFn: () => taskService.list({ ...(status ? { status } : {}), ...(priority ? { priority } : {}), ...(project ? { project } : {}) }),
  })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => taskService.projects(), staleTime: 120_000 })

  const columns: Array<Column<WorkTask>> = [
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <div>
          <Link to={`/tasks/${t.id}`} className="font-medium text-brand-600 hover:underline">{t.title}</Link>
          {t.projectName ? <div className="text-xs text-muted">{t.projectName}</div> : null}
        </div>
      ),
    },
    { key: 'assigneeName', header: 'Assignee' },
    { key: 'dueDate', header: 'Due', render: (t) => <span className={t.dueDate < db.today && t.status !== 'COMPLETED' ? 'text-danger' : ''}>{t.dueDate}</span> },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: (t) => <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'orange' : 'gray'}>{t.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => <StatusBadge status={taskLabel(t.status)} tone={taskTone(t.status)} />,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (t) => (
        <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${t.id}`)} aria-label={`Open ${t.title}`}>
          Open
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Tasks" description="Work tracked across projects for the whole workspace.">
        <FilterSelect className="w-36" label="Status filter" value={status} onChange={setStatus} options={[...TASK_STATUS_OPTIONS]} />
        <FilterSelect className="w-32" label="Priority filter" value={priority} onChange={setPriority} options={[...TASK_PRIORITY_OPTIONS]} />
        <FilterSelect
          className="w-44"
          label="Project filter"
          value={project}
          onChange={setProject}
          options={[{ value: '', label: 'All projects' }, ...(projects.data ?? []).map((p) => ({ value: p.name, label: p.name }))]}
        />
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={tasks.data ?? []}
        rowKey={(t) => t.id}
        loading={tasks.isLoading}
        emptyState={<EmptyState title="No tasks match these filters" />}
      />
      <p className="text-xs text-muted">
        {can('tasks.manage') ? 'Managers can change status, priority and due date from the task detail page.' : 'Status changes come from the task owner; this view is read-only for your role.'}
      </p>
    </div>
  )
}
