import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { List, ArrowLeft } from '@phosphor-icons/react'
import Sidebar       from './components/Sidebar'
import SyncBadge     from './components/SyncBadge'
import Dashboard     from './pages/Dashboard'
import Installs       from './pages/Installs'
import Installations  from './pages/Installations'
import ProjectDetail  from './pages/ProjectDetail'
import Inspections   from './pages/Inspections'
import DailyFieldLog from './pages/DailyFieldLog'
import Reports       from './pages/Reports'
import Forms         from './pages/Forms'
import FormPage      from './pages/FormPage'
import { COMPLETION_TYPES } from './pages/Forms'
import Technicians   from './pages/Technicians'
import JobDetail     from './pages/JobDetail'
import FormRunner    from './pages/FormRunner'
import RiskAssessment from './pages/RiskAssessment'
import JSA            from './pages/JSA'

// ─── Route metadata ────────────────────────────────────────────────────────────
const PAGE_META = {
  '/dashboard':              { title: 'Field Overview',   parent: null },
  '/installations':          { title: 'Installations',    parent: null },
  '/inspections':            { title: 'Inspections',      parent: null },
  '/daily-field-log':        { title: 'Daily Field Log',  parent: null },
  '/jsa':                    { title: 'JSA',              parent: null },
  '/risk-assessment':        { title: 'Risk Assessment',  parent: null },
  '/reports':                { title: 'Field Reports',    parent: null },
  '/forms':                  { title: 'Report Forms',     parent: null },
  '/technicians':            { title: 'Technicians',      parent: null },
}

function getPageMeta(pathname) {
  if (pathname === '/installations/pipeline')
    return { title: 'Project Pipeline', parent: '/installations' }
  if (pathname === '/installations/field-logs')
    return { title: 'Field Logs', parent: '/installations' }
  if (pathname === '/installations/field-reports')
    return { title: 'Field Reports', parent: '/installations' }
  if (/^\/installations\/[^/]+$/.test(pathname))
    return { title: 'Project Detail', parent: '/installations' }
  if (/^\/installations\/installs\/[^/]+\/form\/[^/]+$/.test(pathname)) {
    const fid    = pathname.split('/')[5]
    const labels = { 'site-survey': 'Site Survey', installation: 'Installation', inspection: 'Inspection' }
    return { title: labels[fid] || 'Form', sub: 'NFPA 780', parent: '/installations' }
  }
  if (/^\/forms\/[^/]+$/.test(pathname)) {
    const formType = pathname.split('/')[2]
    const cfg = COMPLETION_TYPES[formType]
    return { title: cfg?.label || 'Report Form', parent: '/forms' }
  }
  return PAGE_META[pathname] || { title: 'Field Ops', parent: null }
}

// ─── Mobile top bar ────────────────────────────────────────────────────────────
function MobileHeader({ onMenuOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const meta = getPageMeta(location.pathname)

  return (
    <div className="mobile-header">
      {meta.parent ? (
        <button className="mobile-header-btn" onClick={() => navigate(meta.parent)}>
          <ArrowLeft size={18} />
        </button>
      ) : (
        <button className="mobile-header-btn" onClick={onMenuOpen}>
          <List size={18} />
        </button>
      )}
      <div className="mobile-header-title">
        {meta.sub && <div style={{ fontSize: '0.5625rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.sub}</div>}
        {meta.title}
      </div>
      <SyncBadge compact />
    </div>
  )
}

// ─── Desktop top bar ───────────────────────────────────────────────────────────
function DesktopTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const meta   = getPageMeta(location.pathname)

  return (
    <div className="desktop-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {meta.parent && (
          <button
            onClick={() => navigate(meta.parent)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3125rem',
              fontSize: '0.75rem', color: 'var(--text-3)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <ArrowLeft size={13} />
            Back
          </button>
        )}
        {meta.sub && (
          <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {meta.sub}
          </div>
        )}
      </div>
      <SyncBadge />
    </div>
  )
}

// ─── Page transition ───────────────────────────────────────────────────────────
const TOP_TABS = [
  '/dashboard', '/installations', '/inspections',
  '/daily-field-log', '/jsa', '/risk-assessment', '/forms', '/technicians',
]

function getTabIndex(path) {
  const idx = TOP_TABS.findIndex(t => path === t || path.startsWith(t + '/'))
  return idx === -1 ? 0 : idx
}

function PageTransition({ children }) {
  const location     = useLocation()
  const prevRef      = useRef(location.pathname)
  const containerRef = useRef(null)

  useEffect(() => {
    const prev = prevRef.current
    const curr = location.pathname
    prevRef.current = curr
    if (!containerRef.current) return

    const prevTop = TOP_TABS.some(t => prev === t)
    const currTop = TOP_TABS.some(t => curr === t)
    let anim = 'fadeIn'
    if (prevTop && !currTop)       anim = 'slideInRight'
    else if (!prevTop && currTop)  anim = 'slideInLeft'
    else if (prevTop && currTop)   anim = getTabIndex(curr) > getTabIndex(prev) ? 'slideInRight' : 'slideInLeft'

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

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-area">
        <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
        <DesktopTopBar />
        <PageTransition>
          <Routes>
            <Route path="/"                                                    element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"                                           element={<Dashboard />} />

            {/* Installations */}
            <Route path="/installations"                                       element={<Installations />} />
            <Route path="/installations/pipeline"                              element={<Installs />} />
            <Route path="/installations/field-logs"                            element={<DailyFieldLog />} />
            <Route path="/installations/:id"                                   element={<ProjectDetail />} />

            {/* Legacy redirects */}
            <Route path="/installations/installs"                              element={<Navigate to="/installations/pipeline" replace />} />
            <Route path="/installations/installs/:jobId"                       element={<Navigate to="/installations" replace />} />
            <Route path="/installations/installs/:jobId/form/:formId"          element={<FormRunner />} />

            {/* Legacy redirects */}
            <Route path="/projects"                                            element={<Navigate to="/installations" replace />} />
            <Route path="/projects/:id"                                        element={<Navigate to="/installations" replace />} />
            <Route path="/jobs"                                                element={<Navigate to="/installations/installs" replace />} />
            <Route path="/jobs/:jobId"                                         element={<Navigate to="/installations/installs" replace />} />

            <Route path="/inspections"                                         element={<Inspections />} />
            <Route path="/daily-field-log"                                     element={<DailyFieldLog />} />
            <Route path="/jsa"                                                 element={<JSA />} />
            <Route path="/risk-assessment"                                     element={<RiskAssessment />} />
            <Route path="/installations/field-reports"                        element={<Reports />} />
            <Route path="/reports"                                             element={<Navigate to="/installations/field-reports" replace />} />
            <Route path="/forms"                                               element={<Forms />} />
            <Route path="/forms/:formType"                                     element={<FormPage />} />
            <Route path="/technicians"                                         element={<Technicians />} />
            <Route path="*"                                                    element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransition>
      </div>
    </div>
  )
}
