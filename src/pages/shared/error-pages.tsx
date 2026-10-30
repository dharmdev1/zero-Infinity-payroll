import { Link, useRouteError } from 'react-router-dom'
import { Button, Card } from '@/components/ui/base'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="max-w-md p-8 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-600">404 · Not found</p>
        <h1 className="mt-2 text-[22px] font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-[13px] text-muted">
          The page you requested does not exist or has moved within the HRMS workspace.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="max-w-md p-8 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-danger">403 · Access restricted</p>
        <h1 className="mt-2 text-[22px] font-bold text-ink">Not authorized for this area</h1>
        <p className="mt-2 text-[13px] text-muted">
          Your current role does not include permission for this route. Frontend guards are UX checks — the backend also enforces role boundaries.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="secondary">Return to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function ErrorBoundaryPage() {
  const err = useRouteError() as Error | undefined
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <Card className="max-w-md p-8 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-danger">Application error</p>
        <h1 className="mt-2 text-[22px] font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-[13px] text-muted">{err?.message ?? 'An unexpected error occurred while rendering this screen.'}</p>
        <div className="mt-5 flex justify-center">
          <Link to="/dashboard">
            <Button>Reload workspace</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
