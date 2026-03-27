import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import Sidebar       from './components/Sidebar'
import SyncBadge     from './components/SyncBadge'
import BottomNav     from './components/BottomNav'
import PageSubNav    from './components/PageSubNav'
import { lazy, Suspense } from 'react'

// ─── Lazy-loaded page chunks — each route downloads only when first visited ───
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Installs      = lazy(() => import('./pages/Installs'))
const Installations = lazy(() => import('./pages/Installations'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Inspections   = lazy(() => import('./pages/Inspections'))
const DailyFieldLog = lazy(() => import('./pages/DailyFieldLog'))
const Reports       = lazy(() => import('./pages/Reports'))
const Forms         = lazy(() => import('./pages/Forms'))
const FormPage      = lazy(() => import('./pages/FormPage'))
const Technicians   = lazy(() => import('./pages/Technicians'))
const FormBuilder   = lazy(() => import('./pages/FormBuilder'))
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'))
const Inventory      = lazy(() => import('./pages/Inventory'))
const InventoryStock   = lazy(() => import('./pages/InventoryStock'))
const PartsCatalog     = lazy(() => import('./pages/PartsCatalog'))
const WarehouseDetail  = lazy(() => import('./pages/WarehouseDetail'))
const PartDetail     = lazy(() => import('./pages/PartDetail'))
const AddEditPart    = lazy(() => import('./pages/AddEditPart'))
const InventoryTransfer = lazy(() => import('./pages/InventoryTransfer'))

// ─── Route metadata ────────────────────────────────────────────────────────────
const PAGE_META = {
  '/dashboard':              { title: 'Field Overview',   parent: null },
  '/installations':          { title: 'Installations',    parent: null },
  '/inspections':            { title: 'Inspections',      parent: null },
  '/daily-field-log':        { title: 'Daily Field Log',  parent: null },
  '/reports':                { title: 'Field Reports',    parent: null },
  '/forms':                  { title: 'Report Forms',     parent: null },
  '/technicians':            { title: 'Technicians',      parent: null },
  '/risk-assessment':        { title: 'Risk Assessment',  parent: null },
  '/inventory':              { title: 'Inventory',         parent: null },
  '/inventory/stock':        { title: 'Inventory',         parent: '/inventory' },
  '/inventory/catalog':      { title: 'Parts Catalog',      parent: '/inventory' },
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
    return { title: 'Report Form', parent: '/forms' }
  }
  if (pathname === '/inventory/add-part')
    return { title: 'New Part', parent: '/inventory' }
  if (pathname === '/inventory/transfer')
    return { title: 'Transfer Stock', parent: '/inventory' }
  if (/^\/inventory\/warehouse\/[^/]+$/.test(pathname))
    return { title: 'Warehouse', parent: '/inventory' }
  if (/^\/inventory\/part\/[^/]+\/edit$/.test(pathname))
    return { title: 'Edit Part', parent: '/inventory' }
  if (/^\/inventory\/part\/[^/]+$/.test(pathname))
    return { title: 'Part Detail', parent: '/inventory' }
  return PAGE_META[pathname] || { title: 'Field Ops', parent: null }
}

// ─── Mobile top bar ────────────────────────────────────────────────────────────
function MobileHeader() {
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
        /* Spacer so title stays centered when there's no back button */
        <div style={{ width: '2.125rem', flexShrink: 0 }} />
      )}
      <div className="mobile-header-title" style={{ textAlign: 'center' }}>
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
  '/daily-field-log', '/forms', '/technicians',
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <div className="main-area">
        <MobileHeader />
        <DesktopTopBar />
        <PageTransition>
          <Suspense fallback={<div className="page-content" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div className="spinner"/></div>}>
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

            {/* Legacy redirects */}
            <Route path="/projects"                                            element={<Navigate to="/installations" replace />} />
            <Route path="/projects/:id"                                        element={<Navigate to="/installations" replace />} />
            <Route path="/jobs"                                                element={<Navigate to="/installations/installs" replace />} />
            <Route path="/jobs/:jobId"                                         element={<Navigate to="/installations/installs" replace />} />

            <Route path="/inspections"                                         element={<Inspections />} />
            <Route path="/daily-field-log"                                     element={<DailyFieldLog />} />
            <Route path="/installations/field-reports"                        element={<Reports />} />
            <Route path="/reports"                                             element={<Navigate to="/installations/field-reports" replace />} />
            <Route path="/forms"                                               element={<Forms />} />
            <Route path="/forms/builder"                                      element={<FormBuilder />} />
            <Route path="/forms/:formType"                                     element={<FormPage />} />
            <Route path="/technicians"                                         element={<Technicians />} />
            <Route path="/risk-assessment"                                     element={<RiskAssessment />} />
            <Route path="/inventory"                                           element={<Inventory />} />
            <Route path="/inventory/stock"                                     element={<InventoryStock />} />
            <Route path="/inventory/catalog"                                   element={<PartsCatalog />} />
            <Route path="/inventory/warehouse/:id"                             element={<WarehouseDetail />} />
            <Route path="/inventory/add-part"                                  element={<AddEditPart />} />
            <Route path="/inventory/transfer"                                  element={<InventoryTransfer />} />
            <Route path="/inventory/part/:id"                                  element={<PartDetail />} />
            <Route path="/inventory/part/:id/edit"                             element={<AddEditPart />} />
            <Route path="*"                                                    element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </PageTransition>
      </div>
      <BottomNav />
      <PageSubNav />
    </div>
  )
}
