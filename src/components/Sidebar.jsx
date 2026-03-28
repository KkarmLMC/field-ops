import { useNavigate, useLocation } from 'react-router-dom'
import {
  PencilSimple, SquaresFour, HardHat, MagnifyingGlass,
  ClipboardText, FileText, Users, Gear,
  Question, ArrowLineLeft, ArrowLineRight,
  BookOpen, ChartBar, Rows, Package, Receipt, CurrencyDollar,
  SignOut, User, Warehouse,
} from '@phosphor-icons/react'
import { useAuth } from '../lib/useAuth.jsx'

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    path: '/dashboard',
    Icon: SquaresFour,
    label: 'Field Overview',
  },
  {
    path: '/installations',
    Icon: HardHat,
    label: 'Installations',
    children: [
      { path: '/installations/pipeline',      Icon: Rows,          label: 'Project Pipeline' },
      { path: '/installations/field-logs',    Icon: BookOpen,      label: 'Field Logs'       },
      { path: '/installations/field-reports', Icon: ClipboardText, label: 'Field Reports'    },
    ],
  },
  { path: '/inspections',     Icon: MagnifyingGlass, label: 'Inspections'     },
  { path: '/risk-assessment', Icon: ChartBar,        label: 'Risk Assessment' },
  { path: '/daily-field-log', Icon: BookOpen,        label: 'Daily Field Log' },
  { path: '/forms',           Icon: FileText,        label: 'Report Forms',
    children: [
      { path: '/forms/builder', Icon: PencilSimple, label: 'Form Builder' },
    ],
  },
  { path: '/warehouse-hq', Icon: Package, label: 'Warehouse HQ',
    children: [
      { path: '/warehouse-hq/iq',        Icon: ChartBar, label: 'Warehouse IQ'  },
      { path: '/warehouse-hq/inventory', Icon: Package,  label: 'Inventory'     },
      { path: '/warehouse-hq/catalog',   Icon: Package,  label: 'Parts Catalog' },
    ],
  },
  { path: '/sales-orders', Icon: Receipt, label: 'Sales Orders' },
  { path: '/technicians',     Icon: Users,   label: 'Technicians'     },
]

const FOOTER_ITEMS = [
  { Icon: Gear,     label: 'Settings' },
  { Icon: Question, label: 'Help'     },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function pathMatch(itemPath, currentPath) {
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/')
}

function groupIsActive(item, currentPath) {
  if (pathMatch(item.path, currentPath)) return true
  return item.children?.some(c => pathMatch(c.path, currentPath)) ?? false
}

// ── Sub-nav children ──────────────────────────────────────────────────────────
function SubNav({ children, collapsed, navigate, goTo, currentPath }) {
  return (
    <div style={{
      overflow: 'hidden',
      marginTop: 2,
    }}>
      {/* Connecting line on the left */}
      <div style={{ position: 'relative', paddingLeft: 4 }}>
        <div style={{
          position: 'absolute',
          left: '1.375rem',
          top: 4,
          bottom: 4,
          width: 1,
          background: 'var(--border)',
          borderRadius: 1,
        }} />
        {children.map(child => {
          const active = pathMatch(child.path, currentPath)
          return (
            <button
              key={child.path}
              className={`sidebar-item sidebar-sub-item ${active ? 'sidebar-item-active' : ''}`}
              onClick={() => goTo(child.path)}
              title={collapsed ? child.label : undefined}
              style={{ marginBottom: 1 }}
            >
              <child.Icon size={14} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-item-label">{child.label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Nav group (parent with optional children) ─────────────────────────────────
function NavGroup({ item, collapsed, goTo, currentPath }) {
  const active      = groupIsActive(item, currentPath)
  const hasChildren = item.children?.length > 0

  return (
    <>
      {/* Parent row — always navigates to its own path */}
      <button
        className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
        onClick={() => goTo(item.path)}
        title={collapsed ? item.label : undefined}
      >
        <item.Icon size={17} style={{ flexShrink: 0 }} />
        {!collapsed && <span className="sidebar-item-label">{item.label}</span>}

        {/* Collapsed mode: active dot */}
        {collapsed && active && (
          <div style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            width: '0.25rem', height: '0.25rem', borderRadius: '50%', background: 'var(--red)',
          }} />
        )}
      </button>

      {/* Children — visible only when this group is active */}
      {hasChildren && active && !collapsed && (
        <SubNav
          children={item.children}
          collapsed={collapsed}
          goTo={goTo}
          currentPath={currentPath}
        />
      )}
    </>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const goTo = (path) => navigate(path)
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-brand-row">
          {collapsed
            ? <img src="/lm-icon.svg"               alt="Lightning Master" className="sidebar-logo-icon-img" />
            : <img src="/lightning-master-logo.svg"  alt="Lightning Master" className="sidebar-logo-img" />
          }
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">MENU</div>}

          {NAV_ITEMS.map(item => (
            <NavGroup
              key={item.path}
              item={item}
              collapsed={collapsed}
              goTo={goTo}
              currentPath={location.pathname}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer-nav">
          {!collapsed && <div className="sidebar-section-label">ACCOUNT</div>}

          {/* User profile */}
          {profile && !collapsed && (
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', marginBottom: 'var(--sp-1)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name || profile.email}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 1 }}>
                {profile.role} · {profile.division}
              </div>
            </div>
          )}

          {/* Sign out */}
          <button onClick={handleSignOut} className="sidebar-item" title={collapsed ? 'Sign Out' : undefined}
            style={{ color: 'var(--text-3)' }}>
            <SignOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="sidebar-item-label">Sign Out</span>}
          </button>

          <button
            className="sidebar-item sidebar-collapse-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ArrowLineRight size={17} style={{ flexShrink: 0 }} />
              : <ArrowLineLeft  size={17} style={{ flexShrink: 0 }} />
            }
            {!collapsed && <span className="sidebar-item-label">Collapse</span>}
          </button>
        </div>

      </aside>
    </>
  )
}
