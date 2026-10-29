import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui/base'
import { taskService } from '@/services/tasks'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { projectStatusMeta } from '../task-constants'

export function ProjectsPage() {
  useHeader('Projects', [{ label: 'Workspace' }, { label: 'Projects' }])

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => taskService.projects() })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Projects" description="Client and internal projects with their owners and task load.">
        <Link to="/tasks"><Button variant="secondary">All tasks</Button></Link>
      </PageHeaderBar>

      {projects.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-28 w-full" /></Card>)}</div>
      ) : (projects.data ?? []).length === 0 ? (
        <Card><EmptyState title="No projects yet" /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(projects.data ?? []).map((p) => {
            const meta = projectStatusMeta[p.status]
            return (
              <Card key={p.id} className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/projects/${p.id}`} className="text-[15px] font-semibold text-brand-600 hover:underline">{p.name}</Link>
                    <p className="font-mono text-[10px] text-muted">{p.code} · {p.client}</p>
                  </div>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>
                <p className="mt-2 text-[13px] text-muted">{p.summary}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[13px]">
                  <span className="flex items-center gap-2 text-ink"><Avatar name={p.leadName} size="xs" tone="purple" /> {p.leadName}</span>
                  <span className="text-muted">{p.taskCount} tasks</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
