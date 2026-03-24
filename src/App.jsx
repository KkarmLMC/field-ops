import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import TabBar    from './components/TabBar'
import SyncBadge from './components/SyncBadge'
import Projects      from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Reports   from './pages/Reports'
import Forms     from './pages/Forms'
import Dashboard     from './pages/Dashboard'
import Jobs          from './pages/Jobs'
import JobDetail     from './pages/JobDetail'
import FormRunner    from './pages/FormRunner'
import Technicians   from './pages/Technicians'

// Top-level tabs — used to determine slide direction
const TOP_TABS = ['/dashboard', '/projects', '/jobs', '/reports', '/technicians']

function getTabIndex(path) {
  const idx = TOP_TABS.findIndex(t => path === t || path.startsWith(t + '/'))
  return idx === -1 ? 0 : idx
}

const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/projects':    'Projects',
  '/reports':     'Reports',
  '/forms':       'Forms',
  '/jobs':        'Jobs',
  '/technicians': 'Technicians',
}

function Header() {
  const location = useLocation()
  const navigate  = useNavigate()

  const isProjectDetail = /^\/projects\/[^/]+$/.test(location.pathname)
  const isJobDetail     = /^\/jobs\/[^/]+$/.test(location.pathname) && !/\/form\//.test(location.pathname)
  const isFormRunner    = /^\/jobs\/[^/]+\/form\/[^/]+$/.test(location.pathname)

  let title, parent, subtitle

  if (isFormRunner) {
    const parts = location.pathname.split('/')
    const jobId  = parts[2]
    const formId = parts[4]
    const labels = { 'site-survey': 'Site Survey', installation: 'Installation', inspection: 'Inspection' }
    title  = labels[formId] || 'Form'
    subtitle = 'NFPA 780'
    parent = `/jobs/${jobId}`
  } else if (isJobDetail) {
    title  = 'Job Detail'
    parent = '/jobs'
  } else if (isProjectDetail) {
    title  = 'Project'
    parent = '/projects'
  } else {
    title  = PAGE_TITLES[location.pathname] || 'Field Ops'
    parent = null
  }

  return (
    <div className="app-header">
      <div className="app-header-left">
        {parent ? (
          <button
            className="header-back"
            onClick={() => navigate(parent)}
            aria-label="Go back"
          >
            ‹
          </button>
        ) : (
          <div className="app-logo">
            <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
        )}
        <div>
          {!parent && <div className="app-subtitle">Bolt LP · Field Ops</div>}
          {subtitle && <div className="app-subtitle">{subtitle}</div>}
          <div className="app-title">{title}</div>
        </div>
      </div>
      <SyncBadge />
    </div>
  )
}

// Animated route wrapper — slides child pages in from right, fades top-level pages
function PageTransition({ children }) {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const containerRef = useRef(null)

  useEffect(() => {
    const prev = prevPathRef.current
    const curr = location.pathname
    prevPathRef.current = curr

    if (!containerRef.current) return

    const prevIsTop = TOP_TABS.some(t => prev === t || prev.startsWith(t + '/'))
    const currIsTop = TOP_TABS.some(t => curr === t)

    // Determine animation
    let anim = 'fadeIn'
    if (prevIsTop && !currIsTop) {
      // Going deeper — slide in from right
      anim = 'slideInRight'
    } else if (!prevIsTop && currIsTop) {
      // Going back to top — slide in from left
      anim = 'slideInLeft'
    } else if (prevIsTop && currIsTop) {
      // Switching tabs
      const prevIdx = getTabIndex(prev)
      const currIdx = getTabIndex(curr)
      anim = currIdx > prevIdx ? 'slideInRight' : 'slideInLeft'
    }

    const el = containerRef.current
    el.style.animation = 'none'
    // Force reflow
    void el.offsetWidth
    el.style.animation = `${anim} 0.22s ease`
  }, [location.pathname])

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
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
      <TabBar />
    </div>
  )
}
