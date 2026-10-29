import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui/base'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-[64px] font-bold leading-none text-brand-600">404</p>
      <h2 className="mt-4 text-lg font-bold text-ink">Page not found</h2>
      <p className="mt-2 text-[13px] text-muted">The page you are looking for does not exist or may have been moved.</p>
      <Link to="/dashboard">
        <Button className="mt-6">Back to dashboard</Button>
      </Link>
    </div>
  )
}

export function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-[64px] font-bold leading-none text-danger">403</p>
      <h2 className="mt-4 text-lg font-bold text-ink">Not authorized</h2>
      <p className="mt-2 text-[13px] text-muted">You do not have permission to view this module.</p>
      <Link to="/dashboard">
        <Button variant="secondary" className="mt-6">
          Back to dashboard
        </Button>
      </Link>
    </div>
  )
}

export function ErrorBoundaryPage({ error }: { error?: unknown }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="p-8">
        <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
        <p className="mt-2 text-[13px] text-muted">
          An unexpected error occurred while rendering this screen. Try reloading; if it persists, contact your administrator.
        </p>
        {error instanceof Error ? <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-canvas p-3 text-xs text-muted">{error.message}</pre> : null}
        <Link to="/dashboard" className="mt-4 inline-flex">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
