import { useNavigate, useLocation } from 'react-router-dom'
import { SquaresFour, Buildings, Lightning, ClipboardText, HardHat } from '@phosphor-icons/react'

const TABS = [
  { path: '/dashboard',   Icon: SquaresFour,   label: 'Overview'   },
  { path: '/projects',    Icon: Buildings,     label: 'Projects'   },
  { path: '/jobs',        Icon: Lightning,     label: 'Jobs'       },
  { path: '/reports',     Icon: ClipboardText, label: 'Reports'    },
  { path: '/technicians', Icon: HardHat,       label: 'Techs'      },
]

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="tab-bar">
      {TABS.map(tab => {
        const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
        return (
          <button
            key={tab.path}
            className={`tab-btn ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {/* Active indicator line at top */}
            <div style={{
              position: 'absolute',
              top: 0, left: '50%',
              width: active ? 28 : 0,
              height: '0.125rem',
              background: 'var(--red)',
              borderRadius: '0 0 2px 2px',
              transform: 'translateX(-50%)',
              transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
            <span className="tab-btn-icon" style={{
              transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}><tab.Icon size={18} weight={active ? 'fill' : 'regular'} /></span>
            <span className="tab-btn-label" style={{
              color: active ? 'var(--red)' : 'var(--text-3)',
              fontWeight: active ? 700 : 500,
              transition: 'color 0.15s, font-weight 0.15s',
            }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
