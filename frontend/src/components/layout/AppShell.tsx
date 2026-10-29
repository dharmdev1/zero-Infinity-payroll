import React, { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ExternalLink, Menu, Search, X } from 'lucide-react'
import { HeaderContext } from './header-context'
import { ADMIN_NAV, PATH_TITLE_MAP, SELF_NAV } from './nav-config'
import { useAuth } from '@/app/auth-context'
import { ROLE_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import { Avatar, Button, Card, InfoNote } from '@/components/ui/base'
import { DropdownMenu } from '@/components/ui/overlay'
import { cn } from '@/utils/cn'
import { API_MODE } from '@/services/api/client'
import { settingsService } from '@/services/settings'

interface Crumb {
  label: string
  to?: string
}

export function AppShell() {
  const location = useLocation()
  const resetKey = location.pathname
  return (
    <div className="min-h-screen bg-canvas">
      <HeaderContextStateful resetKey={resetKey}>
        <ShellInner />
      </HeaderContextStateful>
    </div>
  )
}

function HeaderContextStateful({ children, resetKey }: { children: ReactNode; resetKey: string }) {
  const [state, setState] = React.useState<{ title: string; crumbs: Crumb[] }>({ title: '', crumbs: [] })
  React.useEffect(() => {
    setState({ title: '', crumbs: [] })
  }, [resetKey])
  const value = React.useMemo(() => ({ state, set: setState }), [state])
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}

function ShellInner() {
  const { session, can, signOut, switchRoleDemo } = useAuth()
  const navigate = useNavigate()
  const headerCtx = React.useContext(HeaderContext)
  const [drawer, setDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ label: string; to: string }>>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimer = useRef<number | null>(null)

  if (!session) return null
  const location = useLocationSafe()
  const isSelf = session.role === 'EMPLOYEE'
  const sections = (isSelf ? SELF_NAV : ADMIN_NAV)
    .map((section) => ({ ...section, items: section.items.filter((item) => can(item.permission)) }))
    .filter((section) => section.items.length > 0)

  const onSearchChange = (term: string) => {
    setSearchTerm(term)
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    if (!term.trim()) {
      setSearchOpen(false)
      setSearchResults([])
      return
    }
    searchTimer.current = window.setTimeout(() => {
      void settingsService.searchEverything(term).then((results) => {
        setSearchResults(results)
        setSearchOpen(results.length > 0)
      })
    }, 280)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="flex h-16 items-center gap-2 px-4 md:h-20 md:px-6">
          <button
            type="button"
            className="rounded-lg border border-line p-2 text-ink md:hidden"
            aria-label="Open navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <Menu size={18} />
          </button>
          <NavLink to="/dashboard" className="flex items-center gap-2.5" aria-label="Zero Infinity Technologies home">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-600 font-mono text-[15px] font-semibold text-white">H</span>
            <span className="hidden font-mono text-[15px] font-semibold tracking-tight text-ink-deep md:inline">Zero Infinity</span>
          </NavLink>
          <div className="hidden h-8 min-w-0 flex-1 border-l border-line pl-5 md:block">
            <p className="truncate text-xs text-muted" data-testid="breadcrumb">
              {headerCtx.state.crumbs.length > 0 ? <CrumbTrail crumbs={headerCtx.state.crumbs} /> : 'Workspace'}
            </p>
            <h1 className="truncate text-[17px] font-bold leading-6 text-ink" data-testid="page-title">
              {headerCtx.state.title || PATH_TITLE_MAP[location.pathname] || 'Company HRMS'}
            </h1>
          </div>
          <div className="relative ml-auto w-40 sm:w-56 lg:w-72">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anything..."
              aria-label="Search anything"
              className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            {searchOpen && searchResults.length > 0 ? (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-line bg-white p-1.5 shadow-pop">
                {searchResults.map((r) => (
                  <button
                    key={r.to}
                    type="button"
                    className="block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-brand-50/70"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchTerm('')
                      navigate(r.to)
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <NotificationsBell />
          <DropdownMenu
            align="right"
            trigger={
              <span className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-canvas" data-testid="user-chip">
                <Avatar name={session.name} tone="blue" size="sm" />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-[130px] truncate text-[13px] font-semibold text-ink">{session.name}</span>
                  <span className="block text-[11px] text-muted">{ROLE_LABELS[session.role]}</span>
                </span>
                <ChevronDown size={13} className="hidden text-muted sm:block" />
              </span>
            }
            items={[
              { label: 'Sign out', onSelect: () => {
                  signOut()
                  navigate('/login')
                } },
              ...(API_MODE === 'demo'
                ? [
                    { label: `Demo — switch to ${ROLE_LABELS.SUPER_ADMIN}`, onSelect: () => switchRoleDemo('SUPER_ADMIN' satisfies Role as Role) },
                    { label: `Demo — switch to ${ROLE_LABELS.HR_ADMIN}`, onSelect: () => switchRoleDemo('HR_ADMIN' satisfies Role as Role) },
                    { label: `Demo — switch to ${ROLE_LABELS.EMPLOYEE}`, onSelect: () => switchRoleDemo('EMPLOYEE' satisfies Role as Role) },
                  ]
                : []),
            ]}
          />
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[238px] shrink-0 overflow-y-auto border-r border-line bg-white md:top-20 md:block md:h-[calc(100vh-5rem)]" aria-label="Primary navigation">
          <SidebarNav sections={sections} onNavigate={() => undefined} />
          <HelpCard className="mx-4 mb-4 mt-4" />
        </aside>

        {drawer ? (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="absolute inset-0 bg-ink-deep/40" onClick={() => setDrawer(false)} aria-hidden="true" />
            <div className="absolute inset-y-0 left-0 flex w-[272px] max-w-[86vw] flex-col bg-white shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="font-mono text-[15px] font-semibold text-ink-deep">Menu</span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="rounded-lg p-2 text-muted hover:bg-canvas">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <SidebarNav sections={sections} onNavigate={() => setDrawer(false)} />
              </div>
              <HelpCard className="m-4" />
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 pb-10 pt-5 md:px-8 md:pt-6">
          {API_MODE === 'demo' ? <div className="mb-4 md:hidden"><InfoNote>Demo mode — you are viewing a design snapshot; demo actions are not persisted.</InfoNote></div> : null}
          <div className="mx-auto w-full max-w-[1620px]">
            <Outlet />
          </div>
          <footer className="mx-auto mt-8 flex w-full max-w-[1620px] flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
            <span>Company HRMS • Secure workspace</span>
            <span>{session.role === 'EMPLOYEE' ? 'Your workspace' : 'Employee records only — compensation is restricted to Payroll'}</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

function useLocationSafe() {
  // Does not re-render ShellInner on nav (screen-reader fine because content changes anyway).
  return useLocation()
}

function CrumbTrail({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <span aria-hidden="true">/</span> : null}
          {c.to ? (
            <NavLink to={c.to} className="hover:text-brand-600 hover:underline">
              {c.label}
            </NavLink>
          ) : (
            <span>{c.label}</span>
          )}
        </span>
      ))}
    </span>
  )
}

interface SidebarItem {
  label: string
  to: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
}

interface SidebarSection {
  heading: string
  items: SidebarItem[]
}

function SidebarNav({ sections, onNavigate }: { sections: SidebarSection[]; onNavigate: () => void }) {
  return (
    <nav className="px-3 pb-4 pt-5" aria-label="Workspace">
      {sections.map((section, si) => (
        <div key={section.heading} className={cn('mb-6', si > 0 && 'border-t border-line pt-5')}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{section.heading}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <NavLink
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                      isActive ? 'bg-brand-50 text-brand-600' : 'text-[#3D4A5C] hover:bg-canvas hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-600" aria-hidden="true" /> : null}
                      <item.icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function HelpCard({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-brand-50/60', className)}>
      <div className="p-4">
        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-600" aria-hidden="true">?</div>
        <p className="text-[13px] font-semibold text-ink">Need help?</p>
        <p className="mt-0.5 text-xs text-muted">View setup guide and contact your administrator.</p>
        <NavLink to="/help" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          Help & support <ExternalLink size={12} />
        </NavLink>
      </div>
    </Card>
  )
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { session } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="relative" data-testid="notifications">
      <button
        type="button"
        className="relative rounded-lg border border-line bg-white p-2 text-ink hover:bg-canvas"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={16} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-line bg-white p-1.5 shadow-pop">
          <p className="px-3 py-2 text-[13px] font-semibold text-ink">Announcements</p>
          <p className="px-3 pb-2 text-[13px] text-muted">
            {session?.role === 'EMPLOYEE'
              ? 'October team check-in — update task progress before Friday’s review.'
              : 'October payroll run has moved to review. Two leave requests await approval.'}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mx-3 mb-2"
            onClick={() => {
              setOpen(false)
              navigate(session?.role === 'EMPLOYEE' ? '/my/leave' : '/leave/approvals')
            }}
          >
            Open updates
          </Button>
        </div>
      ) : null}
    </div>
  )
}
