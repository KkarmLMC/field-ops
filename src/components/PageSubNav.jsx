/**
 * PageSubNav — fixed sub-navigation bar sitting just above the bottom nav.
 * Rendered once in App.jsx, reads the current route and shows the right items.
 * Mobile-only (hidden ≥768px).
 */

import { useEffect } from 'react'
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
  '/warehouse-hq': [
    { path: '/warehouse-hq',           label: 'Overview'      },
    { path: '/warehouse-hq/iq',        label: 'Warehouse IQ'  },
    { path: '/warehouse-hq/inventory', label: 'Inventory'     },
    { path: '/warehouse-hq/catalog',   label: 'Parts Catalog' },
    { path: '/warehouse-hq/transfer',  label: 'Transfer'      },
  ],
}

// ─── Routes where sub-nav should not appear ───────────────────────────────────
const SUPPRESS = [
  '/forms/builder',
  '/warehouse-hq/add-part',
]

function getSubNav(pathname) {
  if (SUPPRESS.includes(pathname)) return null
  if (/^\/warehouse-hq\/part\//.test(pathname)) return null
  if (/^\/warehouse-hq\/warehouse\//.test(pathname)) return null
  if (/^\/sales-orders\/.+/.test(pathname)) return null
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

  // Toggle body class so CSS can add extra bottom padding to page-content
  useEffect(() => {
    if (items) {
      document.body.classList.add('has-sub-nav')
    } else {
      document.body.classList.remove('has-sub-nav')
    }
    return () => document.body.classList.remove('has-sub-nav')
  }, [items])

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
