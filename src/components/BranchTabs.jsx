import { useState, useRef, useEffect } from 'react'
import { STATS, PROJECTS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

export default function BranchTabs({ active, onChange, lmCount, boltCount }) {
  const [hoveredId,   setHoveredId]   = useState(null)
  const [dragOffset,  setDragOffset]  = useState(0)
  const [isDragging,  setIsDragging]  = useState(false)
  const [isMobile,    setIsMobile]    = useState(() => typeof window !== 'undefined' && window.innerWidth <= 599)

  const trackRef      = useRef(null)
  const touchStart    = useRef({ x: 0, y: 0, dir: null })
  const dragOffsetRef = useRef(0)   // ref copy so touchEnd reads latest value without stale closure
  const activeIdxRef  = useRef(0)   // ref copy so touchMove handler avoids re-attaching on every swipe

  const lmStats = {
    active:    PROJECTS.filter(p => p.branch === 'lm'   && p.stage === 'in-progress').length,
    scheduled: PROJECTS.filter(p => p.branch === 'lm'   && p.stage === 'scheduled').length,
    completed: PROJECTS.filter(p => p.branch === 'lm'   && p.stage === 'complete').length }
  const boltStats = {
    active:    PROJECTS.filter(p => p.branch === 'bolt' && p.stage === 'in-progress').length,
    scheduled: PROJECTS.filter(p => p.branch === 'bolt' && p.stage === 'scheduled').length,
    completed: PROJECTS.filter(p => p.branch === 'bolt' && p.stage === 'complete').length }

  const tabs = [
    { id: 'lm',   label: STATS.lm.label,   sectors: STATS.lm.sectors,   stats: lmStats,   total: lmCount   ?? (lmStats.active   + lmStats.scheduled   + lmStats.completed),   ...BRANCH_COLORS['lm']   },
    { id: 'bolt', label: STATS.bolt.label, sectors: STATS.bolt.sectors, stats: boltStats, total: boltCount ?? (boltStats.active + boltStats.scheduled + boltStats.completed), ...BRANCH_COLORS['bolt'] },
  ]

  const n         = tabs.length
  const activeIdx = tabs.findIndex(t => t.id === active)

  // Keep activeIdxRef in sync so the non-passive touchmove closure is always fresh
  useEffect(() => { activeIdxRef.current = activeIdx }, [activeIdx])

  // isMobile media-query listener
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Non-passive touchmove listener — needed so we can call e.preventDefault()
  // and stop the page from scrolling when the user is swiping cards horizontally.
  // Must be registered with { passive: false }; React's synthetic onTouchMove
  // may be registered passively depending on the browser, making preventDefault a no-op.
  useEffect(() => {
    const el = trackRef.current
    if (!el || !isMobile) return

    const onMove = (e) => {
      const dx = e.touches[0].clientX - touchStart.current.x
      const dy = e.touches[0].clientY - touchStart.current.y

      // Determine scroll direction on the first significant movement
      if (touchStart.current.dir === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        touchStart.current.dir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
      }
      if (touchStart.current.dir !== 'h') return   // vertical — let the page scroll

      e.preventDefault()   // horizontal — own this gesture

      const idx    = activeIdxRef.current
      const atEdge = (idx === 0 && dx > 0) || (idx === n - 1 && dx < 0)
      const offset = dx * (atEdge ? 0.25 : 1)   // rubber-band resistance at edges

      dragOffsetRef.current = offset
      setDragOffset(offset)
      setIsDragging(true)
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [isMobile, n])

  const handleTouchStart = (e) => {
    touchStart.current    = { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: null }
    dragOffsetRef.current = 0
    setDragOffset(0)
    setIsDragging(false)
  }

  const handleTouchEnd = () => {
    const offset    = dragOffsetRef.current
    const idx       = activeIdxRef.current
    const threshold = window.innerWidth * 0.2   // 20% of screen width triggers a swipe

    if      (offset < -threshold && idx < n - 1) onChange(tabs[idx + 1].id)
    else if (offset >  threshold && idx > 0)     onChange(tabs[idx - 1].id)

    dragOffsetRef.current = 0
    setDragOffset(0)
    setIsDragging(false)
  }

  // On mobile the track is n × 100% wide and shifted with translateX.
  // On desktop the CSS grid takes over and we apply no transform.
  const trackStyle = isMobile ? {
    width:      `${n * 100}%`,
    transform:  `translateX(calc(${-activeIdx * (100 / n)}% + ${dragOffset}px))`,
    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' } : {}

  const slideStyle = isMobile ? { width: `${100 / n}%` } : {}

  return (
    <div className="branch-tabs">
      <div
        ref={trackRef}
        className="branch-tabs-mobile-track"
        style={trackStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tabs.map(tab => {
          const isActive   = active === tab.id
          const isHovered  = hoveredId === tab.id && !isActive
          const showActive = isActive || isHovered
          const bg    = showActive ? tab.bgActive   : tab.bgInactive
          const text  = showActive ? tab.textActive : tab.textInactive
          const sub   = showActive ? tab.subActive  : tab.subInactive
          const total = tab.total || 1

          return (
            <div key={tab.id} className="branch-card-slide" style={slideStyle}>
              <button
                className={`branch-card${isActive ? ' branch-card--active' : ''}`}
                onClick={() => onChange(tab.id)}
                onMouseEnter={() => setHoveredId(tab.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ background: bg, transition: 'background 0.15s, transform 0.12s' }}
              >
                <div className="branch-card-top">
                  <div className="branch-card-name" style={{ color: text, transition: 'color 0.15s' }}>{tab.label}</div>
                  <div className={`branch-card-pill${showActive ? ' branch-card-pill--on' : ''}`}
                    style={{ background: showActive ? 'rgba(255,255,255,0.2)' : tab.bgActive, color: '#fff', transition: 'background 0.15s' }}>
                    {tab.stats.active} active
                  </div>
                </div>

                <div className="branch-card-sectors" style={{ color: sub, transition: 'color 0.15s' }}>{tab.sectors}</div>

                <div className="branch-card-bar-wrap">
                  <div className="branch-card-bar-track" style={{ background: showActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}>
                    <div className="branch-card-bar-fill" style={{ width: `${Math.round((tab.stats.active / total) * 100)}%`, background: showActive ? '#ffffff' : tab.bgActive }} />
                  </div>
                </div>

                <div className="branch-card-stats">
                  {[
                    { label: 'Active',    value: tab.stats.active    },
                    { label: 'Scheduled', value: tab.stats.scheduled },
                    { label: 'Done',      value: tab.stats.completed },
                  ].map((s, i) => (
                    <div key={i} className="branch-card-stat">
                      <span className="branch-card-stat-value" style={{ color: text, transition: 'color 0.15s' }}>{s.value}</span>
                      <span className="branch-card-stat-label" style={{ color: sub,  transition: 'color 0.15s' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Dot indicators — mobile only (hidden on desktop via CSS) */}
      <div className="branch-dots">
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                width:        isActive ? '1.5rem' : '0.4375rem',
                height:       '0.4375rem',
                borderRadius: '0.25rem',
                background:   isActive ? BRANCH_COLORS[tab.id].bgActive : 'var(--grey-tint-40)',
                padding:      0,
                cursor:       'pointer',
                transition:   'width 0.25s ease, background 0.25s ease' }}
            />
          )
        })}
      </div>
    </div>
  )
}
