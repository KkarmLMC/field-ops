import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  SquaresFour, HardHat, Wrench, MagnifyingGlass,
  ClipboardText, FileText, Users, Gear,
  Question, CaretRight, ArrowLineLeft, ArrowLineRight,
  BookOpen,
} from '@phosphor-icons/react'

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',     Icon: SquaresFour, label: 'Dashboard' },
  {
    // Expandable group
    groupId: 'installations',
    Icon: HardHat,
    label: 'Installations',
    basePath: '/installations',
    children: [
      { path: '/installations/installs', Icon: Wrench,  label: 'Installs' },
    ],
  },
  { path: '/inspections',   Icon: MagnifyingGlass,          label: 'Inspections' },
  { path: '/daily-field-log', Icon: BookOpen,      label: 'Daily Field Log' },
  { path: '/reports',       Icon: ClipboardText,   label: 'Reports' },
  { path: '/forms',         Icon: FileText,        label: 'Forms' },
  { path: '/technicians',   Icon: Users,           label: 'Technicians' },
]

const FOOTER_ITEMS = [
  { Icon: Gear,   label: 'Gear' },
  { Icon: Question, label: 'Help'     },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Keep Installations open if currently on an installations sub-route
  const [groupsOpen, setGroupsOpen] = useState(() => ({
    installations: location.pathname.startsWith('/installations'),
  }))

  const goTo = (path) => {
    navigate(path)
    onClose?.()
  }

  const toggleGroup = (groupId) => {
    setGroupsOpen(s => ({ ...s, [groupId]: !s[groupId] }))
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
            // ── Expandable group ────────────────────────────────────────────
            if (item.groupId) {
              const groupActive  = location.pathname.startsWith(item.basePath)
              const open         = !collapsed && groupsOpen[item.groupId]

              return (
                <div key={item.groupId}>
                  {/* Group parent button */}
                  <button
                    className={`sidebar-item ${groupActive && collapsed ? 'sidebar-item-active' : ''}`}
                    onClick={() => collapsed ? goTo(item.basePath) : toggleGroup(item.groupId)}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.Icon size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <>
                        <span className="sidebar-item-label">{item.label}</span>
                        <CaretRight
                          size={13}
                          style={{
                            marginLeft: 'auto',
                            flexShrink: 0,
                            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.18s',
                            color: 'var(--text-3)',
                          }}
                        />
                      </>
                    )}
                  </button>

                  {/* Children — only when expanded and not collapsed */}
                  {open && item.children.map(({ path, Icon, label }) => (
                    <button
                      key={path}
                      className={`sidebar-item sidebar-sub-item ${isActive(path) ? 'sidebar-item-active' : ''}`}
                      onClick={() => goTo(path)}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      <span className="sidebar-item-label">{label}</span>
                    </button>
                  ))}
                </div>
              )
            }

            // ── Regular item ────────────────────────────────────────────────
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
