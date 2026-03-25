import { useNavigate, useLocation } from 'react-router-dom'
import {
  SquaresFour, HardHat, MagnifyingGlass,
  ClipboardText, FileText, Users, Gear,
  Question, ArrowLineLeft, ArrowLineRight,
  BookOpen, ChartBar,
} from '@phosphor-icons/react'

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',        Icon: SquaresFour,    label: 'Field Overview'   },
  { path: '/installations',    Icon: HardHat,        label: 'Installations'    },
  { path: '/inspections',      Icon: MagnifyingGlass, label: 'Inspections'     },
  { path: '/daily-field-log',  Icon: BookOpen,       label: 'Daily Field Log'  },
  { path: '/jsa',              Icon: HardHat,        label: 'JSA'              },
  { path: '/risk-assessment',  Icon: ChartBar,       label: 'Risk Assessment'  },
  { path: '/reports',          Icon: ClipboardText,  label: 'Reports'          },
  { path: '/forms',            Icon: FileText,       label: 'Forms'            },
  { path: '/technicians',      Icon: Users,          label: 'Technicians'      },
]

const FOOTER_ITEMS = [
  { Icon: Gear,   label: 'Gear' },
  { Icon: Question, label: 'Help'     },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const goTo = (path) => {
    navigate(path)
    onClose?.()
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-brand-row">
          {collapsed
            ? <img src="/lm-icon.svg"              alt="Lightning Master" className="sidebar-logo-icon-img" />
            : <img src="/lightning-master-logo.svg" alt="Lightning Master" className="sidebar-logo-img" />
          }
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">MENU</div>}

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
                onClick={() => goTo(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <item.Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                {collapsed && active && (
                  <div style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: '0.25rem', height: '0.25rem', borderRadius: '50%', background: 'var(--red)',
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
          <button
            className="sidebar-item sidebar-collapse-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ArrowLineRight  size={17} style={{ flexShrink: 0 }} />
              : <ArrowLineLeft size={17} style={{ flexShrink: 0 }} />
            }
            {!collapsed && <span className="sidebar-item-label">Collapse</span>}
          </button>
        </div>

      </aside>
    </>
  )
}
