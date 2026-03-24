import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/dashboard',   icon: '📊', label: 'Dashboard'  },
  { path: '/projects',    icon: '🏗️', label: 'Projects'   },
  { path: '/jobs',        icon: '⚡', label: 'Jobs'       },
  { path: '/reports',     icon: '📋', label: 'Reports'    },
  { path: '/technicians', icon: '👷', label: 'Techs'      },
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
            <span className="tab-btn-icon">{tab.icon}</span>
            <span className="tab-btn-label">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
