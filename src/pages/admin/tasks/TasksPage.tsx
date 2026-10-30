import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { FolderPlus, Plus } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { DataTable } from '@/components/data-display/table'
import type { Column } from '@/components/data-display/table'
import { StatusBadge, taskLabel, taskTone } from '@/components/data-display/status'
import { getProjectScope, taskService } from '@/services/tasks'
import type { CreateProjectInput, CreateTaskInput } from '@/services/tasks'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import type { WorkTask } from '@/types/domain'
import { db } from '@/services/demo/store'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/modules/tasks/task-constants'
import { CreateProjectDialog, CreateTaskDialog } from '@/modules/projects'

export function TasksPage() {
  const { session, can } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useHeader('Tasks', [{ label: 'Workspace' }, { label: 'Tasks' }])

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [project, setProject] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  const tasks = useQuery({
    queryKey: ['tasks', session?.employeeId, session?.role, { status, priority, project }],
    queryFn: () =>
      taskService.list(
        {
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          ...(project ? { project } : {}),
        },
        session,
      ),
  })
  const projects = useQuery({
    queryKey: ['projects', session?.employeeId, session?.role],
    queryFn: () => taskService.projects(session),
    staleTime: 60_000,
  })

  const canDelegateTasks =
    can('tasks.manage') ||
    (projects.data ?? []).some((p) => getProjectScope(p, session).canCreateTasks)

  const createTaskMut = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateTaskOpen(false)
    },
  })

  const createProjectMut = useMutation({
    mutationFn: (input: CreateProjectInput) => taskService.createProject(input, session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateProjectOpen(false)
    },
  })

  const columns: Array<Column<WorkTask>> = [
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <div>
          <Link to={`/tasks/${t.id}`} className="font-medium text-brand-600 hover:underline">
            {t.title}
          </Link>
          <div className="text-xs text-muted">
            {t.projectName ?? 'Standalone'}
            {t.teamName ? ` · ${t.teamName}` : ''}
          </div>
        </div>
      ),
    },
    { key: 'assigneeName', header: 'Assignee' },
    {
      key: 'dueDate',
      header: 'Due',
      render: (t) => (
        <span className={t.dueDate < db.today && t.status !== 'COMPLETED' ? 'text-danger' : ''}>
          {t.dueDate}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: (t) => (
        <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'orange' : 'gray'}>
          {t.priority}
        </Badge>
      ),
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
      <PageHeaderBar
        title="Tasks & Delegated Work"
        description={
          session?.role === 'EMPLOYEE'
            ? 'Showing tasks assigned to you and tasks within any project or team you lead.'
            : 'Work tracked across all projects and sub-teams for the workspace.'
        }
      >
        <FilterSelect className="w-36" label="Status filter" value={status} onChange={setStatus} options={[...TASK_STATUS_OPTIONS]} />
        <FilterSelect className="w-32" label="Priority filter" value={priority} onChange={setPriority} options={[...TASK_PRIORITY_OPTIONS]} />
        <FilterSelect
          className="w-44"
          label="Project filter"
          value={project}
          onChange={setProject}
          options={[{ value: '', label: 'All visible projects' }, ...(projects.data ?? []).map((p) => ({ value: p.name, label: p.name }))]}
        />
        <Link to="/projects">
          <Button variant="secondary">Projects</Button>
        </Link>
        {can('projects.manage') ? (
          <Button variant="secondary" onClick={() => setCreateProjectOpen(true)}>
            <FolderPlus size={15} className="mr-1.5" /> Add project
          </Button>
        ) : null}
        {canDelegateTasks ? (
          <Button onClick={() => setCreateTaskOpen(true)}>
            <Plus size={15} className="mr-1.5" /> {session?.role === 'EMPLOYEE' ? 'Delegate task' : 'New task'}
          </Button>
        ) : null}
      </PageHeaderBar>

      <DataTable
        columns={columns}
        rows={tasks.data ?? []}
        rowKey={(t) => t.id}
        loading={tasks.isLoading}
        emptyState={<EmptyState title="No tasks in your authorized scope match these filters" />}
      />
      <p className="text-xs text-muted">
        {session?.role === 'EMPLOYEE'
          ? canDelegateTasks
            ? 'As a Project Lead or Team Lead, you can delegate tasks to members within your assigned project/team scope.'
            : 'You can view and update progress on tasks assigned directly to you.'
          : 'Super Admins and HR Admins can oversee all projects, teams, and task assignments.'}
      </p>

      {createTaskOpen ? (
        <CreateTaskDialog
          viewer={session}
          onClose={() => setCreateTaskOpen(false)}
          pending={createTaskMut.isPending}
          onConfirm={(input) => createTaskMut.mutate(input)}
        />
      ) : null}

      {createProjectOpen ? (
        <CreateProjectDialog
          onClose={() => setCreateProjectOpen(false)}
          pending={createProjectMut.isPending}
          onConfirm={(input) => createProjectMut.mutate(input)}
        />
      ) : null}
    </div>
  )
}
