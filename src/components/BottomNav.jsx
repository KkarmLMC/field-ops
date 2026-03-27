/**
 * BottomNav — mobile-only horizontal scroll-snap navigation bar
 *
 * All nav items live in a single scrollable row. CSS scroll-snap ensures
 * items land cleanly on swipe. The active item auto-scrolls into view when
 * the route changes.
 *
 * Tab set is role-aware — field and management see different items.
 * Hidden automatically on form/detail pages.
 * Desktop (≥768px): hidden — sidebar handles navigation.
 */

import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  SquaresFour, BookOpen, FileText,
  MagnifyingGlass, Users, HardHat, ChartBar, Package,
} from '@phosphor-icons/react'
import useRole from '../lib/useRole.js'

// ─── Routes where the bar is hidden ──────────────────────────────────────────
const HIDDEN_ROUTES = ['/forms/builder']

const HIDDEN_PREFIXES = [
  '/forms/',
  '/installations/',
]

// Routes inside a hidden prefix that should still show the nav
const KEEP_ROUTES = [
  '/installations/pipeline',
  '/installations/field-logs',
  '/installations/field-reports',
  '/forms/jsa',
]

function shouldHide(pathname) {
  if (HIDDEN_ROUTES.includes(pathname)) return true
  if (KEEP_ROUTES.includes(pathname)) return false
  return HIDDEN_PREFIXES.some(p => pathname.startsWith(p))
}

// ─── Nav items per role ───────────────────────────────────────────────────────

const FIELD_ITEMS = [
  { id: 'overview',      path: '/dashboard',        Icon: SquaresFour,    label: 'Overview',     exactMatch: true },
  { id: 'fieldlog',      path: '/daily-field-log',  Icon: BookOpen,       label: 'Field Logs'    },
  { id: 'forms',         path: '/forms',             Icon: FileText,       label: 'Report Forms',        exactMatch: true },
  { id: 'inspections',   path: '/inspections',       Icon: MagnifyingGlass,label: 'Inspections'  },
  { id: 'warehouse-hq',     path: '/warehouse-hq',          Icon: Package,        label: 'Warehouse HQ',    exactMatch: true },
  { id: 'risk',          path: '/risk-assessment',   Icon: ChartBar,       label: 'Assessment'         },
  { id: 'jsa',           path: '/forms/jsa',         Icon: HardHat,        label: 'JSA'          },
]

const MGMT_ITEMS = [
  { id: 'overview',    path: '/dashboard',        Icon: SquaresFour,    label: 'Overview',     exactMatch: true },
  { id: 'installs',    path: '/installations',    Icon: HardHat,        label: 'Installations',exactMatch: true },
  { id: 'inspections', path: '/inspections',      Icon: MagnifyingGlass,label: 'Inspections'  },
  { id: 'fieldlog',    path: '/daily-field-log',  Icon: BookOpen,       label: 'Daily Field Log'    },
  { id: 'forms',       path: '/forms',             Icon: FileText,       label: 'Report Forms',        exactMatch: true },
  { id: 'warehouse-hq',   path: '/warehouse-hq',          Icon: Package,        label: 'Warehouse HQ',    exactMatch: true },
  { id: 'risk',        path: '/risk-assessment',   Icon: ChartBar,       label: 'Assessment'         },
  { id: 'technicians', path: '/technicians',       Icon: Users,          label: 'Technicians'  },
]

// ─── Active path detection ────────────────────────────────────────────────────
// exactMatch items only highlight on their own path, EXCEPT parent items
// that have known children — those stay highlighted on child routes too.
const PARENT_PREFIXES = ['/installations', '/forms', '/warehouse-hq']

function isActive(item, pathname) {
  if (item.exactMatch) {
    // Exact match OR highlighted on known child routes
    if (pathname === item.path) return true
    if (PARENT_PREFIXES.includes(item.path)) {
      return pathname.startsWith(item.path + '/')
    }
    return false
  }
  return pathname === item.path || pathname.startsWith(item.path + '/')
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { isManagement } = useRole()
  const navigate  = useNavigate()
  const location  = useLocation()
  const trackRef  = useRef(null)

  const items = isManagement ? MGMT_ITEMS : FIELD_ITEMS

  // Auto-scroll the active tab into centre when route changes
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const activeIndex = items.findIndex(item => isActive(item, location.pathname))
    if (activeIndex === -1) return
    const tab = track.children[activeIndex]
    if (!tab) return
    const trackW = track.offsetWidth
    const tabLeft = tab.offsetLeft
    const tabW    = tab.offsetWidth
    track.scrollTo({ left: tabLeft - trackW / 2 + tabW / 2, behavior: 'smooth' })
  }, [location.pathname, items])

  if (shouldHide(location.pathname)) return null

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__track" ref={trackRef}>
        {items.map(item => {
          const active = isActive(item, location.pathname)
          return (
            <button
              key={item.id}
              className={`bottom-nav__tab ${active ? 'bottom-nav__tab--active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className="bottom-nav__indicator" />
              <div className="bottom-nav__icon">
                <item.Icon size={22} weight={active ? 'fill' : 'regular'} />
              </div>
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Edge fades — hint that the bar is scrollable */}
    </nav>
  )
}
