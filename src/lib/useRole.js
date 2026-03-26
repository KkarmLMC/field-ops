/**
 * useRole — lightweight role system for Field Ops
 *
 * Current implementation: role stored in localStorage.
 * When Supabase Auth is added, replace the getRole() function
 * with a Supabase session lookup — every component using this
 * hook will update automatically with zero other changes.
 *
 * Roles:
 *   'technician'  — field staff, default role
 *   'manager'     — can edit forms, access builder, manage settings
 *   'admin'       — full access (same as manager for now)
 *
 * Usage:
 *   const { role, isManager, isTech } = useRole()
 *   { isManager && <button>Edit Form</button> }
 */

import { useState, useEffect } from 'react'

const ROLE_KEY = 'fieldops_role'
const VALID_ROLES = ['technician', 'manager', 'admin']
const DEFAULT_ROLE = 'technician'

export function getRole() {
  try {
    const stored = localStorage.getItem(ROLE_KEY)
    return VALID_ROLES.includes(stored) ? stored : DEFAULT_ROLE
  } catch {
    return DEFAULT_ROLE
  }
}

export function setRole(role) {
  if (VALID_ROLES.includes(role)) {
    localStorage.setItem(ROLE_KEY, role)
  }
}

export default function useRole() {
  const [role, setRoleState] = useState(getRole)

  // Sync across tabs if role changes elsewhere
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ROLE_KEY) setRoleState(getRole())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return {
    role,
    isManager: role === 'manager' || role === 'admin',
    isAdmin:   role === 'admin',
    isTech:    role === 'technician',
  }
}
