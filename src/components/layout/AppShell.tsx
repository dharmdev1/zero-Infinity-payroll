import React, { useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, HelpCircle, LogOut, Menu, Search, X } from 'lucide-react'
import { HeaderContext } from './header-context'
import { ADMIN_NAV, PATH_TITLE_MAP, SELF_NAV } from './nav-config'
import { useAuth } from '@/app/auth-context'
import { ROLE_LABELS } from '@/types/rbac'
import type { Role } from '@/types/rbac'
import { Avatar, Button, InfoNote } from '@/components/ui/base'
import { DropdownMenu } from '@/components/ui/overlay'
import { cn } from '@/utils/cn'
import { API_MODE } from '@/services/api/client'
import { settingsService } from '@/services/settings'
import type { CompanyProfileSettings } from '@/services/settings'
import { BackendOpBanner } from '@/utils/backend-ops'

const LOGO_TONE_CLASSES: Record<CompanyProfileSettings['logoTone'], string> = {
  blue: 'bg-brand-600 text-white',
  indigo: 'bg-indigo-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  purple: 'bg-purple-600 text-white',
  rose: 'bg-rose-600 text-white',
  slate: 'bg-slate-800 text-white',
}

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
  const [collapsed, setCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ label: string; to: string }>>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimer = useRef<number | null>(null)
  const companyProfile = useSyncExternalStore(
    settingsService.subscribeCompanyProfile,
    settingsService.getCompanyProfile,
  )

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
      void settingsService.searchEverything(term, session).then((results) => {
        setSearchResults(results)
        setSearchOpen(results.length > 0)
      })
    }, 280)
  }

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            className="rounded-xl border border-slate-200/80 p-2 text-ink hover:bg-slate-50 md:hidden"
            aria-label="Open navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <Menu size={18} />
          </button>

          <div
            className={cn(
              'flex items-center justify-between transition-all duration-200 md:shrink-0 md:border-r md:border-slate-200/80',
              collapsed ? ' gap-1.5 md:w-[80px] md:pr-2.5' : 'gap-2 md:w-[224px] md:pr-4',
            )}
          >
            <NavLink
              to="/dashboard"
              className="flex min-w-0 items-center gap-2.5"
              aria-label={`${companyProfile.name} home`}
            >
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-mono font-bold shadow-sm transition-all duration-200',
                  LOGO_TONE_CLASSES[companyProfile.logoTone],
                  collapsed ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm',
                )}
              >
                {companyProfile.logoImageUrl ? (
                  <img
                    src={companyProfile.logoImageUrl}
                    alt={companyProfile.shortName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  companyProfile.logoText
                )}
              </span>
              <div className={cn('min-w-0 transition-opacity duration-150', collapsed && 'md:hidden')}>
                <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-ink-deep">
                  {companyProfile.shortName}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  {ROLE_LABELS[session.role]} Panel
                </p>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 md:flex"
            >
              {collapsed ? <ChevronRight size={15} className="shrink-0" /> : <ChevronLeft size={15} className="shrink-0" />}
            </button>
          </div>

          <div className="hidden min-w-0 flex-1 pl-2 md:block">
            <p className="truncate text-xs text-slate-400" data-testid="breadcrumb">
              {headerCtx.state.crumbs.length > 0 ? <CrumbTrail crumbs={headerCtx.state.crumbs} /> : 'Workspace'}
            </p>
            <h1 className="truncate text-base font-bold leading-6 text-ink-deep" data-testid="page-title">
              {headerCtx.state.title || PATH_TITLE_MAP[location.pathname] || 'Company HRMS'}
            </h1>
          </div>

          <div className="relative ml-auto w-44 sm:w-64 lg:w-80">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employees, tasks, records..."
              aria-label="Search anything"
              className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-9 pr-3 text-[13px] text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
            {searchOpen && searchResults.length > 0 ? (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-pop">
                {searchResults.map((r) => (
                  <button
                    key={r.to}
                    type="button"
                    className="block w-full truncate rounded-xl px-3 py-2 text-left text-[13px] text-ink hover:bg-slate-50"
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
              <span className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-slate-50" data-testid="user-chip">
                <Avatar name={session.name} tone="blue" size="sm" />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-[130px] truncate text-[13px] font-semibold text-ink">{session.name}</span>
                  <span className="block text-[11px] text-slate-500">{ROLE_LABELS[session.role]}</span>
                </span>
                <ChevronDown size={13} className="hidden text-slate-400 sm:block" />
              </span>
            }
            items={[
              { label: 'My profile', onSelect: () => navigate('/my/profile') },
              { label: 'Sign out', onSelect: handleLogout },
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

      <div className="flex items-start">
        <aside
          className={cn(
            'sticky top-16 hidden h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] self-start shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white transition-all duration-200 md:flex',
            collapsed ? 'w-[104px]' : 'w-[248px]',
          )}
          aria-label="Primary navigation"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
            <SidebarNav sections={sections} collapsed={collapsed} onNavigate={() => undefined} />
          </div>
          <SidebarFooter collapsed={collapsed} onLogout={handleLogout} />
        </aside>

        {drawer ? (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="absolute inset-0 bg-ink-deep/40 backdrop-blur-[1px]" onClick={() => setDrawer(false)} aria-hidden="true" />
            <div className="absolute inset-y-0 left-0 flex w-[272px] max-w-[86vw] flex-col overflow-hidden bg-white shadow-pop">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl font-mono text-sm font-bold',
                      LOGO_TONE_CLASSES[companyProfile.logoTone],
                    )}
                  >
                    {companyProfile.logoImageUrl ? (
                      <img
                        src={companyProfile.logoImageUrl}
                        alt={companyProfile.shortName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      companyProfile.logoText
                    )}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold leading-tight text-ink-deep">{companyProfile.shortName}</p>
                    <p className="text-xs text-slate-400">{ROLE_LABELS[session.role]} Panel</p>
                  </div>
                </div>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth py-2">
                <SidebarNav sections={sections} collapsed={false} onNavigate={() => setDrawer(false)} />
              </div>
              <SidebarFooter
                collapsed={false}
                onLogout={() => {
                  setDrawer(false)
                  handleLogout()
                }}
              />
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 pb-10 pt-5 md:px-8 md:pt-6">
          {API_MODE === 'demo' ? <div className="mb-4 md:hidden"><InfoNote>Demo mode — you are viewing a design snapshot; demo actions are not persisted.</InfoNote></div> : null}
          <div className="mx-auto w-full max-w-[1620px]">
            <BackendOpBanner />
            <Outlet />
          </div>
          <footer className="mx-auto mt-10 flex w-full max-w-[1620px] flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-xs text-slate-400">
            <span>Company HRMS • Secure workspace</span>
            <span>{session.role === 'EMPLOYEE' ? 'Your workspace' : 'Employee records only — compensation is restricted to Payroll'}</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

function useLocationSafe() {
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

function SidebarNav({
  sections,
  collapsed,
  onNavigate,
}: {
  sections: SidebarSection[]
  collapsed: boolean
  onNavigate: () => void
}) {
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (heading: string) => {
    setClosedSections((prev) => ({ ...prev, [heading]: !prev[heading] }))
  }

  return (
    <nav className="px-3 py-4" aria-label="Workspace">
      {sections.map((section, si) => {
        const isClosed = !collapsed && !!closedSections[section.heading]
        return (
          <div key={section.heading} className={cn('mb-4', si > 0 && 'border-t border-slate-100 pt-4')}>
            {!collapsed ? (
              <button
                type="button"
                onClick={() => toggleSection(section.heading)}
                aria-expanded={!isClosed}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
              >
                <span>{section.heading}</span>
                <ChevronDown
                  size={14}
                  className={cn('shrink-0 transition-transform duration-200', isClosed ? '-rotate-90' : 'rotate-0')}
                />
              </button>
            ) : null}
            <ul
              className={cn(
                'mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out',
                isClosed ? 'max-h-0 opacity-0' : 'max-h-[640px] opacity-100',
              )}
            >
              {section.items.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/dashboard'}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150',
                        collapsed && 'justify-center px-2.5',
                        isActive
                          ? 'bg-brand-600 font-semibold text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                      )
                    }
                  >
                    <item.icon size={17} className="shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) {
  return (
    <div className="border-t border-slate-100 p-3 space-y-1">
      <button
        type="button"
        onClick={onLogout}
        title={collapsed ? 'Logout' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50/80',
          collapsed && 'justify-center px-2.5',
        )}
      >
        <LogOut size={17} className="shrink-0" />
        {!collapsed ? <span>Logout</span> : null}
      </button>
      <NavLink
        to="/help"
        title={collapsed ? 'Help & support' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-900',
          collapsed && 'justify-center px-2.5',
        )}
      >
        <HelpCircle size={17} className="shrink-0" />
        {!collapsed ? <span>Help & support</span> : null}
      </NavLink>
    </div>
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
