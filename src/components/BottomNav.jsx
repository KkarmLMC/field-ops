/**
 * BottomNav — mobile-only bottom navigation bar
 *
 * Renders 4 tabs + a slide-up "More" tray for secondary destinations.
 * Tab set is role-aware: field technicians and management see different
 * primary tabs, with different items in the More tray.
 *
 * Hidden automatically on form/detail pages where the bar would compete
 * with submit buttons or detailed content.
 *
 * Desktop (≥768px): hidden — sidebar handles navigation.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  SquaresFour, BookOpen, FileText, DotsThree,
  HardHat, MagnifyingGlass, Users, PencilSimple,
  ClipboardText, X, Lightning, Rows,
} from '@phosphor-icons/react'
import useRole from '../lib/useRole.js'

// ─── Routes where the bar is hidden ──────────────────────────────────────────
// Form pages, deep detail pages, and builder pages hide the bar so it doesn't
// compete with submit buttons or overlap form content.
const HIDDEN_ROUTES = [
  '/forms/builder',
]

const HIDDEN_PREFIXES = [
  '/forms/',            // individual form pages
  '/installations/',    // project detail pages (not the hub itself)
]

function shouldHide(pathname) {
  if (HIDDEN_ROUTES.includes(pathname)) return true
  // Hide on sub-routes but keep the hub pages
  const KEEP = [
    '/installations/pipeline',
    '/installations/field-logs',
    '/installations/field-reports',
  ]
  if (KEEP.includes(pathname)) return false
  return HIDDEN_PREFIXES.some(p => pathname.startsWith(p))
}

// ─── Nav configs per role ─────────────────────────────────────────────────────

const FIELD_TABS = [
  {
    id:    'home',
    path:  '/dashboard',
    Icon:  SquaresFour,
    label: 'Overview',
  },
  {
    id:    'log',
    path:  '/daily-field-log',
    Icon:  BookOpen,
    label: 'My Log',
  },
  {
    id:    'forms',
    path:  '/forms',
    Icon:  FileText,
    label: 'Forms',
  },
  {
    id:    'more',
    Icon:  DotsThree,
    label: 'More',
    isTray: true,
  },
]

const FIELD_TRAY = [
  { path: '/inspections',   Icon: MagnifyingGlass, label: 'Inspections',   color: '#6366F1' },
  { path: '/forms/jsa',     Icon: HardHat,         label: 'JSA',           color: '#D97706' },
]

const MGMT_TABS = [
  {
    id:    'home',
    path:  '/dashboard',
    Icon:  SquaresFour,
    label: 'Overview',
  },
  {
    id:    'installs',
    path:  '/installations',
    Icon:  Lightning,
    label: 'Jobs',
  },
  {
    id:    'forms',
    path:  '/forms',
    Icon:  FileText,
    label: 'Forms',
  },
  {
    id:    'more',
    Icon:  DotsThree,
    label: 'More',
    isTray: true,
  },
]

const MGMT_TRAY = [
  { path: '/installations/pipeline',      Icon: Rows,           label: 'Pipeline',      color: 'var(--navy)' },
  { path: '/installations/field-logs',    Icon: BookOpen,       label: 'Field Logs',    color: 'var(--navy)' },
  { path: '/installations/field-reports', Icon: ClipboardText,  label: 'Field Reports', color: 'var(--navy)' },
  { path: '/inspections',                 Icon: MagnifyingGlass,label: 'Inspections',   color: '#6366F1' },
  { path: '/technicians',                 Icon: Users,           label: 'Technicians',  color: '#0891B2' },
  { path: '/forms/builder',               Icon: PencilSimple,   label: 'Form Builder',  color: '#D97706' },
]

// ─── Active path detection ────────────────────────────────────────────────────
function isTabActive(tab, pathname) {
  if (!tab.path) return false
  if (tab.path === '/dashboard') return pathname === '/dashboard'
  return pathname === tab.path || pathname.startsWith(tab.path + '/')
}

function anyTrayActive(trayItems, pathname) {
  return trayItems.some(item => pathname === item.path || pathname.startsWith(item.path + '/'))
}

// ─── More Tray ────────────────────────────────────────────────────────────────
function MoreTray({ items, onNavigate, onClose }) {
  const location = useLocation()

  useEffect(() => {
    // Trap scroll behind tray
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.45)',
          animation: 'anim-fade-in 0.18s ease',
        }}
      />

      {/* Tray */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: 'var(--bottom-nav-h, 4rem)',
        zIndex: 200,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--sp-4))',
        animation: 'anim-slide-up 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
      }}>
        {/* Handle */}
        <div style={{
          width: '2.5rem', height: '0.25rem',
          background: 'var(--border-l)',
          borderRadius: 'var(--r-full)',
          margin: '0.75rem auto var(--sp-4)',
        }} />

        {/* Tray label */}
        <div style={{
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 var(--sp-5) var(--sp-3)',
        }}>
          More
        </div>

        {/* Grid of items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--sp-2)',
          padding: '0 var(--sp-4)',
        }}>
          {items.map(item => {
            const active = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-4) var(--sp-2)',
                  borderRadius: 'var(--r-lg)',
                  border: 'none',
                  background: active ? 'var(--surface-raised)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background var(--ease-fast)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onTouchStart={e => e.currentTarget.style.background = 'var(--hover)'}
                onTouchEnd={e => e.currentTarget.style.background = active ? 'var(--surface-raised)' : 'transparent'}
              >
                {/* Icon bubble */}
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--r-lg)',
                  background: active ? item.color : 'var(--surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background var(--ease-fast)',
                }}>
                  <item.Icon
                    size={22}
                    weight={active ? 'fill' : 'regular'}
                    style={{ color: active ? '#fff' : item.color }}
                  />
                </div>
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--text-1)' : 'var(--text-2)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { isManagement } = useRole()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [trayOpen, setTrayOpen] = useState(false)

  const tabs  = isManagement ? MGMT_TABS  : FIELD_TABS
  const tray  = isManagement ? MGMT_TRAY  : FIELD_TRAY

  // Close tray on route change
  useEffect(() => { setTrayOpen(false) }, [location.pathname])

  // Hide on form/detail routes
  if (shouldHide(location.pathname)) return null

  const moreIsActive = anyTrayActive(tray, location.pathname)

  const handleTabPress = (tab) => {
    if (tab.isTray) {
      setTrayOpen(o => !o)
    } else {
      setTrayOpen(false)
      navigate(tab.path)
    }
  }

  const handleTrayNavigate = (path) => {
    setTrayOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Tray */}
      {trayOpen && (
        <MoreTray
          items={tray}
          onNavigate={handleTrayNavigate}
          onClose={() => setTrayOpen(false)}
        />
      )}

      {/* Bar */}
      <nav className="bottom-nav">
        {tabs.map(tab => {
          const active = tab.isTray
            ? (trayOpen || moreIsActive)
            : isTabActive(tab, location.pathname)

          return (
            <button
              key={tab.id}
              className={`bottom-nav__tab ${active ? 'bottom-nav__tab--active' : ''}`}
              onClick={() => handleTabPress(tab)}
            >
              {/* Active indicator */}
              <div className="bottom-nav__indicator" />

              {/* Icon */}
              <div className="bottom-nav__icon">
                <tab.Icon
                  size={tab.isTray ? 24 : 22}
                  weight={active ? 'fill' : 'regular'}
                />
              </div>

              {/* Label */}
              <span className="bottom-nav__label">
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
