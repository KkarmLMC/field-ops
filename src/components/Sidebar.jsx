/**
 * FO Sidebar — Config wrapper
 * All rendering is delegated to the shared ui/navigation/Sidebar.
 * This file owns: nav items, auth, clock, logo config.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  PencilSimple, SquaresFour, HardHat, MagnifyingGlass,
  ClipboardText, FileText, Users,
  BookOpen, ChartBar, Rows, Package, Receipt, CurrencyDollar,
  SignOut, User, Warehouse,
  ArrowLineLeft, ArrowLineRight } from '@phosphor-icons/react'
import { Sidebar as SharedSidebar } from './ui'
import { useAuth } from '../lib/useAuth.jsx'

// ─── Nav item config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard',      Icon: SquaresFour, label: 'Field Overview' },
  { path: '/installations',  Icon: HardHat,     label: 'Installations',
    children: [
      { path: '/installations/pipeline',      Icon: Rows,          label: 'Project Pipeline' },
      { path: '/installations/field-logs',    Icon: BookOpen,      label: 'Field Logs'       },
      { path: '/installations/field-reports', Icon: ClipboardText, label: 'Field Reports'    },
    ] },
  { path: '/inspections',     Icon: MagnifyingGlass, label: 'Inspections'     },
  { path: '/risk-assessment', Icon: ChartBar,        label: 'Risk Assessment' },
  { path: '/daily-field-log', Icon: BookOpen,        label: 'Daily Field Log' },
  { path: '/forms',           Icon: FileText,        label: 'Report Forms',
    children: [
      { path: '/forms/builder', Icon: PencilSimple, label: 'Form Builder' },
    ] },
  { path: '/stock',        Icon: Warehouse, label: 'Stock Lookup' },
  { path: '/sales-orders', Icon: Receipt,   label: 'Sales Orders' },
  { path: '/technicians',  Icon: Users,     label: 'Technicians'  },
]

// ─── Clock ───────────────────────────────────────────────────────────────────

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return (
    <span className="sidebar-clock__text">
      {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
      {' · '}
      {t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
    </span>
  )
}

// ─── Sidebar (config wrapper) ────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const footerSlot = (
    <div className="sidebar-account-row">
      <span className="sidebar-section-label">ACCOUNT</span>
      <div className="sidebar-clock">
        <div className="sidebar-clock__dot" />
        <Clock />
      </div>
    </div>
  )

  const footerItems = [
    { path: '/profile', Icon: User,    label: 'View Profile' },
    { path: null,       Icon: SignOut,  label: 'Sign Out', onClick: handleSignOut },
  ]

  const collapseIcons = {
    expanded:  <ArrowLineLeft  size="1.0625rem" />,
    collapsed: <ArrowLineRight size="1.0625rem" />,
  }

  return (
    <SharedSidebar
      collapsed={collapsed}
      onToggle={onToggle}
      items={NAV_ITEMS}
      footerItems={footerItems}
      brand={{
        name: 'Field Ops',
        subtitle: 'Lightning Master',
        icon: HardHat,
      }}
      currentPath={location.pathname}
      onNavigate={navigate}
      footerSlot={footerSlot}
      collapseIcons={collapseIcons}
    />
  )
}
