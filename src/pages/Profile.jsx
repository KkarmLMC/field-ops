import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Lock, Eye, EyeSlash, CheckCircle, Shield,
  ArrowLeft, Warning, PencilSimple, SignOut,
  Buildings, AppWindow, Trash, IdentificationCard } from '@phosphor-icons/react'
import { Button, IconButton, Card, Badge, Surface, Spinner, PageHeader, SearchInput, EmptyState, FilterPills, ActionButton, StatusBadge } from '../components/ui'
import { db } from '../lib/supabase.js'
import { logActivity } from '../lib/logActivity.js'

// ─── App source for activity logging — derived from VITE_APP_NAME ─────────────
const APP_SOURCE = (import.meta.env.VITE_APP_NAME || 'lmc_platform').toLowerCase().replace(/ /g, '_')
import { useAuth } from '../lib/useAuth.jsx'

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── PIN pad ──────────────────────────────────────────────────────────────────
function PinPad({ onComplete }) {
  const [digits, setDigits] = useState([])
  const press = (d) => {
    const next = [...digits, d]
    setDigits(next)
    if (next.length === 6) { onComplete(next.join('')); setDigits([]) }
  }
  const del = () => setDigits(d => d.slice(0, -1))
  const btnStyle = {
    height: 60, borderRadius: 'var(--radius-m)',
    background: 'var(--surface-base)',
    fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    transition: 'all 0.12s', WebkitTapHighlightColor: 'transparent' }
  const hoverOn  = e => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--surface-base)'; e.currentTarget.style.borderColor = 'var(--brand-primary)' }
  const hoverOff = e => { e.currentTarget.style.background = 'var(--surface-base)'; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'var(--border-subtle)' }
  const pressOn  = e => { e.currentTarget.style.background = 'var(--navy-dark)'; e.currentTarget.style.transform = 'scale(0.97)' }
  const pressOff = e => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.transform = 'scale(1)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 'var(--space-xl)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < digits.length ? 'var(--brand-primary)' : 'var(--border-subtle)', transition: 'background 0.1s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-m)', maxWidth: 260, margin: '0 auto' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => press(String(n))} style={btnStyle}
            onMouseEnter={hoverOn} onMouseLeave={hoverOff} onMouseDown={pressOn} onMouseUp={pressOff}
            onTouchStart={hoverOn} onTouchEnd={hoverOff}>{n}</button>
        ))}
        <div />
        <button onClick={() => press('0')} style={btnStyle}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff} onMouseDown={pressOn} onMouseUp={pressOff}
          onTouchStart={hoverOn} onTouchEnd={hoverOff}>0</button>
        <button onClick={del} style={{ ...btnStyle, fontSize: 'var(--text-lg)' }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff} onMouseDown={pressOn} onMouseUp={pressOff}
          onTouchStart={hoverOn} onTouchEnd={hoverOff}>⌫</button>
      </div>
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ label, color = 'var(--brand-primary)', bg = 'rgba(4,36,92,0.08)' }) {
  return (
    <Badge variant="secondary" label={label} />
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, action }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-m) var(--space-l)', background: 'var(--brand-primary)', borderRadius: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', color: 'var(--surface-base)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>
          {Icon && <Icon size="0.9375rem" />} {title}
        </div>
        {action}
      </div>
      <div style={{ padding: 'var(--space-l)' }}>{children}</div>
    </Card>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-m)', marginBottom: 'var(--space-m)', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', textAlign: 'right' }}>{children}</div>
    </div>
  )
}

// ─── Activity Log Component ───────────────────────────────────────────────────
function ActivityLog({ userId }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const PER_PAGE = 10

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    db.from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)
      .then(({ data }) => {
        setLogs(data || [])
        setLoading(false)
      })
  }, [userId, page])

  const fmtTime = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffH   = Math.floor(diffMs / 3600000)
    const diffD   = Math.floor(diffMs / 86400000)
    if (diffMin < 1)  return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffH   < 24) return `${diffH}h ago`
    if (diffD   < 7)  return `${diffD}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const APP_LABELS = { field_ops: 'Field Ops', warehouse_iq: 'Warehouse IQ', mission_control: 'Mission Control' }

  const CATEGORY_COLOR = {
    sales_order: 'var(--state-info)', fulfillment: 'var(--purple)', shipment: 'var(--blue-shade-20)',
    import: 'var(--warning-text)',      profile: 'var(--grey-shade-20)',     auth: 'var(--grey-base)',
    parts: 'var(--success-dark)',       inventory: 'var(--success-dark)',   transfer: 'var(--warning-text)' }

  return (
    <Card>
      <div style={{ padding: 'var(--space-m) var(--space-l)', background: 'var(--brand-primary)', color: 'var(--surface-base)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>
        Activity Log
      </div>
      <div style={{ padding: 'var(--space-s) 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
            <Spinner />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            No activity recorded yet
          </div>
        ) : (
          <>
            {logs.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: 'var(--space-m) var(--space-l)',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                {/* Category dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 'var(--space-xs)',
                  background: CATEGORY_COLOR[log.category] || 'var(--text-muted)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--fw-medium)', lineHeight: 1.4 }}>
                    {log.label}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-s)', marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{fmtTime(log.created_at)}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>·</span>
                    <span style={{
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                      color: CATEGORY_COLOR[log.category] || 'var(--text-muted)' }}>{APP_LABELS[log.app] || log.app}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-m) var(--space-l)' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: page === 0 ? 'var(--text-muted)' : 'var(--brand-primary)', background: 'none', cursor: page === 0 ? 'default' : 'pointer', padding: 0 }}>
                ← Previous
              </button>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Page {page + 1}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PER_PAGE}
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: logs.length < PER_PAGE ? 'var(--text-muted)' : 'var(--brand-primary)', background: 'none', cursor: logs.length < PER_PAGE ? 'default' : 'pointer', padding: 0 }}>
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  // Identity editing
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal]         = useState(profile?.full_name || '')
  const [nameSaving, setNameSaving]   = useState(false)

  // Password
  const [showPwForm, setShowPwForm] = useState(false)
  const [newEmail, setNewEmail]     = useState('')
  const [newPw, setNewPw]           = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [pwSaving, setPwSaving]     = useState(false)

  // PIN
  const [pinSection, setPinSection] = useState('idle') // idle | verify-old | enter-new | confirm-new
  const [newPin, setNewPin]         = useState('')
  const [pinError, setPinError]     = useState('')
  const [removingPin, setRemovingPin] = useState(false)
  const hasPin = !!profile?.pin_hash

  // Flash
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  const saveName = async () => {
    if (!nameVal.trim()) return
    setNameSaving(true)
    const { error } = await db.from('profiles').update({ full_name: nameVal.trim() }).eq('id', user.id)
    setNameSaving(false)
    if (error) { flash('Could not save name.', true); return }
    setEditingName(false)
    flash('Name updated.')
    logActivity(db, user?.id, APP_SOURCE, { category: 'profile', action: 'updated_name', label: 'Updated display name' })
  }

  const savePassword = async () => {
    if (!newPw || newPw.length < 8) { flash('Password must be at least 8 characters.', true); return }
    setPwSaving(true)
    const { error } = await db.auth.updateUser({ password: newPw, ...(newEmail ? { email: newEmail } : {}) })
    setPwSaving(false)
    if (error) { flash(error.message, true); return }
    setShowPwForm(false); setNewPw(''); setNewEmail('')
    logActivity(db, user?.id, APP_SOURCE, { category: 'profile', action: 'updated_password', label: newEmail ? 'Updated email and password' : 'Changed password' })
    flash(newEmail ? 'Email + password updated. Check your inbox to confirm.' : 'Password updated.')
  }

  const handlePinStep = async (pin) => {
    setPinError('')
    if (pinSection === 'verify-old') {
      const hashed = await hashPin(pin)
      const { data } = await db.from('profiles').select('pin_hash').eq('id', user.id).single()
      if (data?.pin_hash !== hashed) { setPinError('Incorrect PIN. Try again.'); return }
      setPinSection('enter-new')
    } else if (pinSection === 'enter-new') {
      setNewPin(pin); setPinSection('confirm-new')
    } else if (pinSection === 'confirm-new') {
      if (pin !== newPin) { setPinError("PINs don't match. Try again."); setPinSection('enter-new'); setNewPin(''); return }
      const hashed = await hashPin(pin)
      const { error } = await db.from('profiles').update({ pin_hash: hashed, pin_set_at: new Date().toISOString() }).eq('id', user.id)
      if (error) { setPinError('Could not save PIN.'); return }
      setPinSection('idle'); setNewPin('')
      flash('PIN updated. You can now log in with your PIN.')
      logActivity(db, user?.id, APP_SOURCE, { category: 'profile', action: 'updated_pin', label: 'Changed login PIN' })
    }
  }

  const removePin = async () => {
    if (!confirm('Remove your PIN? You will need to use your password to log in.')) return
    setRemovingPin(true)
    await db.from('profiles').update({ pin_hash: null, pin_set_at: null }).eq('id', user.id)
    setRemovingPin(false)
    flash('PIN removed.')
  }

  const pinLabel = {
    'verify-old':  'Enter your current PIN to continue',
    'enter-new':   hasPin ? 'Enter your new PIN' : 'Choose a 6-digit PIN',
    'confirm-new': 'Confirm your PIN' }

  const roleColors = {
    admin:   { color: 'var(--error-shade-40)', bg: 'var(--state-error-soft)' },
    manager: { color: 'var(--state-info)', bg: 'var(--state-info-soft)' },
    user:    { color: 'var(--success-dark)', bg: 'var(--state-success-soft)' } }
  const roleStyle = roleColors[profile?.role] || roleColors.user

  const pipelineRoleColors = {
    warehouse_manager: { color: 'var(--purple-shade-20)', bg: 'var(--purple-soft)' },
    fulfillment:       { color: 'var(--blue-shade-40)', bg: 'var(--state-info-soft)' },
    shipping:          { color: 'var(--blue-shade-20)', bg: 'var(--blue-tint-80)' } }
  const pipelineStyle = pipelineRoleColors[profile?.pipeline_role] || null

  const appLabels = {
    'field-ops':     'Field Ops',
    'warehouse-iq':  'Warehouse IQ',
    'mission-control': 'Mission Control' }

  // Avatar initials
  const initials = (profile?.full_name || profile?.email || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'none', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-m)' }}>
          <ArrowLeft size="0.875rem" /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-l)' }}>
          {/* Avatar */}
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surface-base)', fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-black)', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>ACCOUNT</div>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-black)', lineHeight: 1.1 }}>{profile?.full_name || 'My Profile'}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Flash messages */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', padding: 'var(--space-m)', background: 'var(--state-success-soft)', borderRadius: 'var(--radius-l)', color: 'var(--state-success-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-l)' }}>
          <CheckCircle size="0.9375rem" weight="fill" style={{ flexShrink: 0 }} /> {success}
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', padding: 'var(--space-m)', background: 'var(--state-error-soft)', borderRadius: 'var(--radius-l)', color: 'var(--error-alt)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-l)' }}>
          <Warning size="0.9375rem" style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* ── Identity ── */}
      <Section icon={User} title="Identity"
        action={!editingName && (
          <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>
            <PencilSimple size="0.75rem" /> Edit Name
          </Button>
        )}>

        {editingName ? (
          <div style={{ marginBottom: 'var(--space-m)' }}>
            <label className="form-field__label">Full Name</label>
            <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
              <input value={nameVal} onChange={e => setNameVal(e.target.value)} autoFocus style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && saveName()} />
              <Button onClick={saveName} disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => { setEditingName(false); setNameVal(profile?.full_name || '') }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Row label="Full Name">{profile?.full_name || '—'}</Row>
        )}

        <Row label="Email">{user?.email || '—'}</Row>

        {profile?.division && (
          <Row label="Division">
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <Buildings size="0.8125rem" style={{ color: 'var(--text-primary)' }} />
              {profile.division}
            </span>
          </Row>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-m)', marginBottom: 'var(--space-xs)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>Member Since</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
      </Section>

      {/* ── Access & Roles ── */}
      <Section icon={Shield} title="Access & Roles">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-m)', marginBottom: 'var(--space-m)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>App Role</div>
          <Badge label={profile?.role || 'user'} variant="secondary" />
        </div>

        {profile?.pipeline_role && pipelineStyle && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-m)', marginBottom: 'var(--space-m)', borderBottom: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>Pipeline Role</div>
            <Badge label={profile.pipeline_role.replace('_', ' ')} variant="secondary" />
          </div>
        )}

        {profile?.app_access?.length > 0 && (
          <div style={{ marginBottom: 'var(--space-m)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 8 }}>App Access</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              {profile.app_access.map(app => (
                <Badge key={app} label={appLabels[app] || app} variant="secondary" />
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: 'var(--space-m)', background: 'var(--surface-hover)', borderRadius: 'var(--radius-l)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Role assignments are managed by your administrator. Contact admin to request changes.
        </div>
      </Section>

      {/* ── PIN ── */}
      <Section icon={Lock} title={hasPin ? 'Login PIN' : 'Set Up PIN'}
        action={pinSection !== 'idle' && (
          <Button size="sm" variant="ghost" onClick={() => { setPinSection('idle'); setPinError(''); setNewPin('') }}>
            Cancel
          </Button>
        )}>

        {pinSection === 'idle' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-m)', marginBottom: 'var(--space-m)', borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{hasPin ? '6-digit PIN is set ✓' : 'No PIN set'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {hasPin
                    ? `Last set: ${profile?.pin_set_at ? new Date(profile.pin_set_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'unknown'}`
                    : 'Set a PIN to log in faster — no password needed'}
                </div>
              </div>
              <Button onClick={() => setPinSection(hasPin ? 'verify-old' : 'enter-new')}>
                {hasPin ? 'Change PIN' : 'Set PIN'}
              </Button>
            </div>

            {hasPin && (
              <Button variant="danger" size="sm" onClick={removePin} disabled={removingPin}>
                <Trash size="0.8125rem" /> {removingPin ? 'Removing…' : 'Remove PIN'}
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-l)' }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', marginBottom: 4 }}>{pinLabel[pinSection]}</div>
              {pinError && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)', color: 'var(--error-alt)', fontSize: 'var(--text-sm)', marginTop: 8 }}>
                  <Warning size="0.875rem" /> {pinError}
                </div>
              )}
            </div>
            <PinPad onComplete={handlePinStep} />
          </div>
        )}
      </Section>

      {/* ── Password & Email ── */}
      <Section icon={Lock} title="Password & Email"
        action={!showPwForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowPwForm(true)}>
            <PencilSimple size="0.75rem" /> Change
          </Button>
        )}>

        {showPwForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
            <div>
              <label className="form-field__label">New Email (optional)</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Leave blank to keep current" />
            </div>
            <div>
              <label className="form-field__label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" style={{ paddingRight: 'var(--sp-10)' }} />
                <button onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeSlash size="1rem" /> : <Eye size="1rem" />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
              <Button variant="secondary" onClick={() => { setShowPwForm(false); setNewPw(''); setNewEmail('') }} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button onClick={savePassword} disabled={pwSaving} style={{ flex: 2 }}>
                {pwSaving ? 'Saving…' : 'Update Password'}
              </Button>
            </div>
          </div>
        ) : (
          <Row label="Password">
            <span style={{ color: 'var(--text-muted)' }}>••••••••</span>
          </Row>
        )}
      </Section>

      {/* ── Sign out ── */}
      <Card>
        <div style={{ padding: 'var(--space-m) var(--space-l)', background: 'var(--brand-primary)', color: 'var(--surface-base)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>Session</div>
        <div style={{ padding: 'var(--space-l)' }}>
          <Button variant="danger" onClick={() => { signOut(); navigate('/login', { replace: true }) }}>
            <SignOut size="1rem" /> Sign Out of this app
          </Button>
        </div>
      </Card>

    </div>
  )
}
