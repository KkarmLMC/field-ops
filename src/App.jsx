import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Menu, ArrowLeft, Wifi } from 'lucide-react'
import Sidebar    from './components/Sidebar'
import SyncBadge  from './components/SyncBadge'
import Projects      from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Reports   from './pages/Reports'
import Forms     from './pages/Forms'
import Dashboard     from './pages/Dashboard'
import Jobs          from './pages/Jobs'
import JobDetail     from './pages/JobDetail'
import FormRunner    from './pages/FormRunner'
import Technicians   from './pages/Technicians'

// ─── Route metadata ────────────────────────────────────────────────────────────
const PAGE_META = {
  '/dashboard':   { title: 'Dashboard',    parent: null },
  '/projects':    { title: 'Projects',     parent: null },
  '/reports':     { title: 'Reports',      parent: null },
  '/forms':       { title: 'Forms',        parent: null },
  '/jobs':        { title: 'Jobs',         parent: null },
  '/technicians': { title: 'Technicians',  parent: null },
}

function getPageMeta(pathname) {
  if (/^\/projects\/[^/]+$/.test(pathname))                     return { title: 'Project Detail', parent: '/projects' }
  if (/^\/jobs\/[^/]+$/.test(pathname) && !/\/form\//.test(pathname)) return { title: 'Job Detail', parent: '/jobs' }
  if (/^\/jobs\/[^/]+\/form\/[^/]+$/.test(pathname)) {
    const jobId = pathname.split('/')[2]
    const fid   = pathname.split('/')[4]
    const labels = { 'site-survey': 'Site Survey', installation: 'Installation', inspection: 'Inspection' }
    return { title: labels[fid] || 'Form', sub: 'NFPA 780', parent: `/jobs/${jobId}` }
  }
  return PAGE_META[pathname] || { title: 'Field Ops', parent: null }
}

// ─── Mobile top bar (hidden ≥768 px) ──────────────────────────────────────────
function MobileHeader({ onMenuOpen }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const meta = getPageMeta(location.pathname)

  return (
    <div className="mobile-header">
      {meta.parent ? (
        <button className="mobile-header-btn" onClick={() => navigate(meta.parent)}>
          <ArrowLeft size={18} />
        </button>
      ) : (
        <button className="mobile-header-btn" onClick={onMenuOpen}>
          <Menu size={18} />
        </button>
      )}
      <div className="mobile-header-title">
        {meta.sub && <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.sub}</div>}
        {meta.title}
      </div>
      <SyncBadge compact />
    </div>
  )
}

// ─── Desktop top bar (hidden <768 px) ─────────────────────────────────────────
function DesktopTopBar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const meta = getPageMeta(location.pathname)

  return (
    <div className="desktop-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {meta.parent && (
          <button
            onClick={() => navigate(meta.parent)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-l)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <ArrowLeft size={13} />
            Back
          </button>
        )}
        <div>
          {meta.sub && (
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>
              {meta.sub}
            </div>
          )}
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{meta.title}</h1>
        </div>
      </div>
      <SyncBadge />
    </div>
  )
}

// ─── Page transition wrapper ───────────────────────────────────────────────────
const TOP_TABS = ['/dashboard', '/projects', '/jobs', '/reports', '/forms', '/technicians']

function getTabIndex(path) {
  const idx = TOP_TABS.findIndex(t => path === t || path.startsWith(t + '/'))
  return idx === -1 ? 0 : idx
}

function PageTransition({ children }) {
  const location  = useLocation()
  const prevRef   = useRef(location.pathname)
  const containerRef = useRef(null)

  useEffect(() => {
    const prev = prevRef.current
    const curr = location.pathname
    prevRef.current = curr
    if (!containerRef.current) return

    const prevTop = TOP_TABS.some(t => prev === t)
    const currTop = TOP_TABS.some(t => curr === t)
    let anim = 'fadeIn'
    if (prevTop && !currTop) anim = 'slideInRight'
    else if (!prevTop && currTop) anim = 'slideInLeft'
    else if (prevTop && currTop) {
      anim = getTabIndex(curr) > getTabIndex(prev) ? 'slideInRight' : 'slideInLeft'
    }
    const el = containerRef.current
    el.style.animation = 'none'
    void el.offsetWidth
    el.style.animation = `${anim} 0.2s ease`
  }, [location.pathname])

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="main-area">
        {/* Visible on mobile only */}
        <MobileHeader onMenuOpen={() => setMobileOpen(true)} />

        {/* Visible on desktop only */}
        <DesktopTopBar />

        <PageTransition>
          <Routes>
            <Route path="/"                         element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"                element={<Dashboard />} />
            <Route path="/projects"                 element={<Projects />} />
            <Route path="/projects/:id"             element={<ProjectDetail />} />
            <Route path="/jobs"                     element={<Jobs />} />
            <Route path="/jobs/:jobId"              element={<JobDetail />} />
            <Route path="/jobs/:jobId/form/:formId" element={<FormRunner />} />
            <Route path="/reports"                  element={<Reports />} />
            <Route path="/forms"                    element={<Forms />} />
            <Route path="/technicians"              element={<Technicians />} />
            <Route path="*"                         element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransition>
      </div>
    </div>
  )
}
