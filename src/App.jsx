import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import Sidebar       from './components/Sidebar'
import SyncBadge     from './components/SyncBadge'
import BottomNav     from './components/BottomNav'
import PageSubNav    from './components/PageSubNav'
import { lazy, Suspense } from 'react'
import { useAuth } from './lib/useAuth.jsx'

// ─── Lazy-loaded page chunks — each route downloads only when first visited ───
const Login         = lazy(() => import('./pages/Login'))
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
const WarehouseIQ    = lazy(() => import('./pages/WarehouseIQ'))
const InventoryStock   = lazy(() => import('./pages/InventoryStock'))
const PartsCatalog     = lazy(() => import('./pages/PartsCatalog'))
const WarehouseDetail  = lazy(() => import('./pages/WarehouseDetail'))
const PurchaseOrders   = lazy(() => import('./pages/PurchaseOrders'))
const PODetail         = lazy(() => import('./pages/PODetail'))
const PONew            = lazy(() => import('./pages/PONew'))
const Expenses         = lazy(() => import('./pages/Expenses'))
const StockView        = lazy(() => import('./pages/StockView'))
const PartRequest      = lazy(() => import('./pages/PartRequest'))
const ExpenseNew       = lazy(() => import('./pages/ExpenseNew'))
const ExpenseDetail    = lazy(() => import('./pages/ExpenseDetail'))
const PartDetail     = lazy(() => import('./pages/PartDetail'))
const AddEditPart    = lazy(() => import('./pages/AddEditPart'))
const InventoryTransfer = lazy(() => import('./pages/InventoryTransfer'))
const Profile           = lazy(() => import('./pages/Profile'))

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
  '/warehouse-hq':           { title: 'Inventory',         parent: null },
  '/warehouse-hq/iq':        { title: 'Warehouse IQ',      parent: '/warehouse-hq' },
  '/warehouse-hq/overview':  { title: 'Warehouse Overview', parent: '/warehouse-hq' },
  '/warehouse-hq/catalog':   { title: 'Parts Catalog',     parent: '/warehouse-hq' },
  '/sales-orders': { title: 'Sales Orders', parent: null },
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
    return { title: 'Report Form', parent: '/forms' }
  }
  if (pathname === '/warehouse-hq/add-part')
    return { title: 'New Part', parent: '/warehouse-hq' }
  if (pathname === '/warehouse-hq/transfer')
    return { title: 'Transfer Stock', parent: '/warehouse-hq' }
  if (pathname === '/expenses/new')
    return { title: 'New Expense', parent: '/expenses' }
  if (/^\/expenses\/[^/]+$/.test(pathname) && pathname !== '/expenses/new')
    return { title: 'Expense Detail', parent: '/expenses' }
  if (pathname === '/sales-orders/new')
    return { title: 'New Sales Order', parent: '/sales-orders' }
  if (/^\/sales-orders\/[^/]+$/.test(pathname))
    return { title: 'Sales Order', parent: '/sales-orders' }
  if (/^\/ warehouse-hq\/warehouse\/[^/]+$/.test(pathname))
    return { title: 'Warehouse', parent: '/warehouse-hq' }
  if (/^\/ warehouse-hq\/part\/[^/]+\/edit$/.test(pathname))
    return { title: 'Edit Part', parent: '/warehouse-hq' }
  if (/^\/ warehouse-hq\/part\/[^/]+$/.test(pathname))
    return { title: 'Part Detail', parent: '/warehouse-hq' }
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
// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { session, loading, profile } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  return children
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const { session, loading } = useAuth()

  // Show login page without shell
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  if (!session) return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )

  // PIN guard — if authenticated but no PIN set, force PIN setup before app access
  if (session && profile !== undefined && profile !== null && !profile?.pin_hash) return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login forcePinSetup session={session} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )

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
            <Route path="/warehouse-hq"                                           element={<Inventory />} />
            <Route path="/warehouse-hq/iq"                                    element={<WarehouseIQ />} />
            <Route path="/warehouse-hq/inventory"                                 element={<InventoryStock />} />
            <Route path="/warehouse-hq/catalog"                                   element={<PartsCatalog />} />
            <Route path="/stock"                                              element={<StockView />} />
            <Route path="/stock/request"                                        element={<PartRequest />} />
            <Route path="/expenses"                                            element={<Expenses />} />
            <Route path="/expenses/new"                                        element={<ExpenseNew />} />
            <Route path="/expenses/:id"                                         element={<ExpenseDetail />} />
            <Route path="/sales-orders"                           element={<PurchaseOrders />} />
            <Route path="/sales-orders/new"                       element={<PONew />} />
            <Route path="/sales-orders/:id"                       element={<PODetail />} />
            <Route path="/warehouse-hq/warehouse/:id"                             element={<WarehouseDetail />} />
            <Route path="/warehouse-hq/add-part"                                  element={<AddEditPart />} />
            <Route path="/warehouse-hq/transfer"                                  element={<InventoryTransfer />} />
            <Route path="/warehouse-hq/part/:id"                                  element={<PartDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/warehouse-hq/part/:id/edit"                             element={<AddEditPart />} />
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
