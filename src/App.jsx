import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import TabBar    from './components/TabBar'
import SyncBadge from './components/SyncBadge'
import Projects      from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Reports  from './pages/Reports'
import Forms    from './pages/Forms'
import Dashboard     from './pages/Dashboard'
import Jobs          from './pages/Jobs'
import JobDetail     from './pages/JobDetail'
import FormRunner    from './pages/FormRunner'
import Technicians   from './pages/Technicians'

const PAGE_META = {
  '/projects':    { title: 'Projects',    parent: null         },
  '/reports':     { title: 'Reports',     parent: null         },
  '/forms':       { title: 'Forms',       parent: null         },
  '/dashboard':   { title: 'Dashboard',   parent: null         },
  '/jobs':        { title: 'Jobs',        parent: null         },
  '/technicians': { title: 'Technicians', parent: null         },
  '/reports/new': { title: 'New Report',  parent: '/reports'   },
  '/forms/new':   { title: 'New Form',    parent: '/forms'     },
}

function Header() {
  const location = useLocation()
  const navigate  = useNavigate()

  // Match dynamic routes
  const isProjectDetail = /^\/projects\/[^/]+$/.test(location.pathname)
  const isJobDetail     = /^\/jobs\/[^/]+$/.test(location.pathname) && !/\/form\//.test(location.pathname)
  const isFormRunner    = /^\/jobs\/[^/]+\/form\/[^/]+$/.test(location.pathname)

  let meta
  if (isProjectDetail) {
    meta = { title: 'Project Detail', parent: '/projects' }
  } else if (isFormRunner) {
    // Extract jobId to navigate back to job detail
    const jobId = location.pathname.split('/')[2]
    meta = { title: 'Form', parent: `/jobs/${jobId}` }
  } else if (isJobDetail) {
    meta = { title: 'Job Detail', parent: '/jobs' }
  } else {
    meta = PAGE_META[location.pathname] || { title: 'Field Ops', parent: null }
  }

  return (
    <div className="app-header">
      <div className="app-header-left">
        {meta.parent ? (
          <button className="header-back" onClick={() => navigate(meta.parent)}>‹</button>
        ) : (
          <div className="app-logo">
            <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
        )}
        <div>
          {!meta.parent && <div className="app-subtitle">Bolt LP</div>}
          <div className="app-title">{meta.title}</div>
        </div>
      </div>
      <SyncBadge />
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
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
      <TabBar />
    </div>
  )
}
