import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightning, Eye, EyeSlash, Warning } from '@phosphor-icons/react'
import { useAuth } from '../lib/useAuth.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    const { error: authError } = await signIn(email, password)
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 'var(--sp-5)',
    }}>
      {/* Logo / Brand */}
      <div style={{ marginBottom: 'var(--sp-8)', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--r-xl)',
          background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--sp-4)',
        }}>
          <Lightning size={28} weight="fill" style={{ color: '#fff' }} />
        </div>
        <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1 }}>
          Field Ops
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: 4 }}>
          Lightning Master · Bolt Lightning Protection
        </div>
      </div>

      {/* Login card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface-raised)',
        borderRadius: 'var(--r-2xl)',
        padding: 'var(--sp-6)',
        border: '1px solid var(--border-l)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--sp-5)' }}>
          Sign in
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--sp-3)' }}>
            <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 'var(--sp-1)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 'var(--sp-1)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}
              >
                {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', background: '#FEF2F2', borderRadius: 'var(--r-lg)', marginBottom: 'var(--sp-4)', color: '#B91C1C', fontSize: 'var(--fs-sm)' }}>
              <Warning size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 'var(--sp-3)',
              borderRadius: 'var(--r-lg)', border: 'none',
              background: 'var(--navy)', color: '#fff',
              fontWeight: 700, fontSize: 'var(--fs-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--font)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 'var(--sp-6)', fontSize: 'var(--fs-xs)', color: 'var(--text-3)', textAlign: 'center' }}>
        Contact your administrator to create an account.
      </div>
    </div>
  )
}
