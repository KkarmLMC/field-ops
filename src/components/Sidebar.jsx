import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Zap, ClipboardList,
  Users, Settings, HelpCircle, ChevronLeft, ChevronRight,
  FileText, PanelLeftClose, PanelLeftOpen,
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

        {/* Brand header — logo takes full width, no toggle button here */}
        <div className="sidebar-brand-row">
          {collapsed ? (
            <img
              src="/lm-icon.svg"
              alt="Lightning Master"
              className="sidebar-logo-icon-img"
            />
          ) : (
            <img
              src="/lightning-master-logo.svg"
              alt="Lightning Master"
              className="sidebar-logo-img"
            />
          )}
        </div>

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

        {/* Footer — settings, help, + collapse toggle at the very bottom */}
        <div className="sidebar-footer-nav">
          {!collapsed && <div className="sidebar-section-label">ACCOUNT</div>}
          {FOOTER_ITEMS.map(({ Icon, label }) => (
            <button key={label} className="sidebar-item" title={collapsed ? label : undefined}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-item-label">{label}</span>}
            </button>
          ))}
          {/* Collapse / expand toggle lives here */}
          <button
            className="sidebar-item sidebar-collapse-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen size={17} style={{ flexShrink: 0 }} />
              : <PanelLeftClose size={17} style={{ flexShrink: 0 }} />
            }
            {!collapsed && <span className="sidebar-item-label">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
