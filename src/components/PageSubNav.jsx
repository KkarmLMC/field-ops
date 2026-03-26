/**
 * PageSubNav — fixed sub-navigation bar sitting just above the bottom nav.
 * Rendered once in App.jsx, reads the current route and shows the right items.
 * Mobile-only (hidden ≥768px).
 */

import { useNavigate, useLocation } from 'react-router-dom'

// ─── Sub-nav configs keyed by parent route prefix ─────────────────────────────
const SUB_NAV_MAP = {
  '/installations': [
    { path: '/installations',               label: 'Installations' },
    { path: '/installations/pipeline',      label: 'Pipeline'     },
    { path: '/installations/field-logs',    label: 'Field Logs'   },
    { path: '/installations/field-reports', label: 'Reports'      },
  ],
  '/forms': [
    { path: '/forms',         label: 'Report Forms' },
    { path: '/forms/builder', label: 'Form Builder' },
  ],
}

// ─── Routes where sub-nav should not appear ───────────────────────────────────
const SUPPRESS = [
  '/forms/builder', // Form builder manages its own full-screen UI
]

function getSubNav(pathname) {
  if (SUPPRESS.includes(pathname)) return null
  for (const [prefix, items] of Object.entries(SUB_NAV_MAP)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return items
    }
  }
  return null
}

export default function PageSubNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = getSubNav(location.pathname)
  if (!items) return null

  return (
    <div className="page-sub-nav">
      {items.map(item => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`page-sub-nav__item ${active ? 'page-sub-nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
