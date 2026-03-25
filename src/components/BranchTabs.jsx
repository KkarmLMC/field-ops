import { useState, useRef } from 'react'
import { STATS, JOBS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

export default function BranchTabs({ active, onChange, lmCount, boltCount, boltDallasCount }) {
  const [hoveredId, setHoveredId] = useState(null)
  const trackRef = useRef(null)

  const lmStats = {
    active:    JOBS.filter(j => j.branch === 'lm'         && j.status === 'active').length,
    scheduled: JOBS.filter(j => j.branch === 'lm'         && j.status === 'scheduled').length,
    completed: JOBS.filter(j => j.branch === 'lm'         && j.status === 'completed').length,
  }
  const boltStats = {
    active:    JOBS.filter(j => j.branch === 'bolt'        && j.status === 'active').length,
    scheduled: JOBS.filter(j => j.branch === 'bolt'        && j.status === 'scheduled').length,
    completed: JOBS.filter(j => j.branch === 'bolt'        && j.status === 'completed').length,
  }
  const dallasStats = {
    active:    JOBS.filter(j => j.branch === 'bolt-dallas' && j.status === 'active').length,
    scheduled: JOBS.filter(j => j.branch === 'bolt-dallas' && j.status === 'scheduled').length,
    completed: JOBS.filter(j => j.branch === 'bolt-dallas' && j.status === 'completed').length,
  }

  const tabs = [
    { id: 'lm',          label: STATS.lm.label,             sectors: STATS.lm.sectors,             stats: lmStats,     total: lmCount        ?? (lmStats.active + lmStats.scheduled + lmStats.completed),       ...BRANCH_COLORS['lm'] },
    { id: 'bolt',        label: STATS.bolt.label,           sectors: STATS.bolt.sectors,           stats: boltStats,   total: boltCount       ?? (boltStats.active + boltStats.scheduled + boltStats.completed),   ...BRANCH_COLORS['bolt'] },
    { id: 'bolt-dallas', label: STATS['bolt-dallas'].label, sectors: STATS['bolt-dallas'].sectors, stats: dallasStats, total: boltDallasCount ?? (dallasStats.active + dallasStats.scheduled + dallasStats.completed), ...BRANCH_COLORS['bolt-dallas'] },
  ]

  // Update active branch while user swipes
  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    const cardWidth = track.scrollWidth / tabs.length
    const idx = Math.round(track.scrollLeft / cardWidth)
    const tab = tabs[Math.max(0, Math.min(idx, tabs.length - 1))]
    if (tab && tab.id !== active) onChange(tab.id)
  }

  // Scroll to card when dot is tapped
  const scrollToTab = (id) => {
    const idx = tabs.findIndex(t => t.id === id)
    const track = trackRef.current
    if (track) {
      const cardWidth = track.scrollWidth / tabs.length
      track.scrollTo({ left: idx * cardWidth, behavior: 'smooth' })
    }
    onChange(id)
  }

  return (
    <div className="branch-tabs">
      <div ref={trackRef} className="branch-tabs-mobile-track" onScroll={handleScroll}>
        {tabs.map(tab => {
          const isActive   = active === tab.id
          const isHovered  = hoveredId === tab.id && !isActive
          const showActive = isActive || isHovered
          const bg    = showActive ? tab.bgActive   : tab.bgInactive
          const text  = showActive ? tab.textActive : tab.textInactive
          const sub   = showActive ? tab.subActive  : tab.subInactive
          const total = tab.total || 1

          return (
            <button
              key={tab.id}
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
                  { label: 'Active',    value: tab.stats.active },
                  { label: 'Scheduled', value: tab.stats.scheduled },
                  { label: 'Done',      value: tab.stats.completed },
                ].map((s, i) => (
                  <div key={i} className="branch-card-stat">
                    <span className="branch-card-stat-value" style={{ color: text, transition: 'color 0.15s' }}>{s.value}</span>
                    <span className="branch-card-stat-label" style={{ color: sub, transition: 'color 0.15s' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Dot indicators — update on swipe via active prop */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginTop: '0.625rem' }}>
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => scrollToTab(tab.id)}
              style={{
                width:      isActive ? '1.5rem' : '0.4375rem',
                height:     '0.4375rem',
                borderRadius: '0.25rem',
                background: isActive ? BRANCH_COLORS[tab.id].bgActive : '#D1D5DB',
                border:     'none',
                padding:    0,
                cursor:     'pointer',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
