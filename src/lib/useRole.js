/**
 * useRole — role system for Field Ops
 *
 * Roles:
 *   'field'      — field technicians, default role
 *   'management' — managers, can edit forms, access builder, manage settings
 *
 * Current implementation: role stored in localStorage.
 * When Supabase Auth is added, replace getRole() with a session
 * lookup — every gated component updates automatically.
 *
 * Usage:
 *   const { role, isManagement, isField } = useRole()
 *   { isManagement && <button>Edit Form</button> }
 */

import { useState, useEffect } from 'react'

const ROLE_KEY    = 'fieldops_role'
const VALID_ROLES = ['field', 'management']
const DEFAULT_ROLE = 'field'

export function getRole() {
  // TODO: replace with Supabase Auth session lookup when login is built
  // Temporarily returning 'management' to show all nav items during development
  return 'management'
}

export function setRole(role) {
  if (VALID_ROLES.includes(role)) {
    localStorage.setItem(ROLE_KEY, role)
  }
}

export default function useRole() {
  const [role, setRoleState] = useState(getRole)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === ROLE_KEY) setRoleState(getRole())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return {
    role,
    isManagement: role === 'management',
    isField:      role === 'field',
  }
}
