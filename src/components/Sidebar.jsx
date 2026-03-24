import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Zap, ClipboardList,
  Users, Settings, HelpCircle, ChevronLeft, ChevronRight,
  FileText,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard',   Icon: LayoutDashboard, label: 'Dashboard'   },
  { path: '/projects',    Icon: FolderOpen,       label: 'Projects'    },
  { path: '/jobs',        Icon: Zap,              label: 'Jobs'        },
  { path: '/reports',     Icon: ClipboardList,    label: 'Reports'     },
  { path: '/forms',       Icon: FileText,          label: 'Forms'       },
  { path: '/technicians', Icon: Users,            label: 'Technicians' },
]

const FOOTER_ITEMS = [
  { Icon: Settings,   label: 'Settings' },
  { Icon: HelpCircle, label: 'Help'     },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const goTo = (path) => {
    navigate(path)
    onClose?.()
  }

  return (
    <>
      {/* Mobile dim overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>

        {/* Brand header — layout changes based on collapsed state */}
        {collapsed ? (
          <div className="sidebar-brand-row sidebar-brand-collapsed">
            <div className="sidebar-logo-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            {/* Full-width expand button so it's always easy to find */}
            <button
              className="sidebar-expand-btn"
              onClick={onToggle}
              title="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <div className="sidebar-brand-row">
            <div className="sidebar-logo-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div className="sidebar-brand-name">Bolt LP</div>
              <div className="sidebar-brand-sub">Field Operations</div>
            </div>
            <button className="sidebar-toggle-btn" onClick={onToggle} title="Collapse sidebar">
              <ChevronLeft size={13} />
            </button>
          </div>
        )}

        {/* Main navigation */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">MENU</div>}
          {NAV_ITEMS.map(({ path, Icon, label }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/')
            return (
              <button
                key={path}
                className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
                onClick={() => goTo(path)}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span className="sidebar-item-label">{label}</span>}
                {/* Active dot for collapsed state */}
                {collapsed && active && (
                  <div style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 4, height: 4, borderRadius: '50%', background: 'var(--red)',
                  }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer-nav">
          {!collapsed && <div className="sidebar-section-label">ACCOUNT</div>}
          {FOOTER_ITEMS.map(({ Icon, label }) => (
            <button key={label} className="sidebar-item" title={collapsed ? label : undefined}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-item-label">{label}</span>}
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
