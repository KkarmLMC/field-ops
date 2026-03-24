import { useState } from 'react'
import { STATS, JOBS } from '../data/mockData.js'

export default function BranchTabs({ active, onChange, lmCount, boltCount, boltDallasCount }) {
  const [hoveredId, setHoveredId] = useState(null)

  // Live counts from JOBS data
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
    {
      id:      'lm',
      label:   STATS.lm.label,
      sectors: STATS.lm.sectors,
      stats:   lmStats,
      total:   lmCount ?? (lmStats.active + lmStats.scheduled + lmStats.completed),
      // Navy — Lightning Master
      bgActive:    '#04245C',
      textActive:  '#ffffff',
      subActive:   'rgba(255,255,255,0.55)',
      bgInactive:  '#F0F3FA',
      textInactive:'#000000',
      subInactive: '#9CA3AF',
    },
    {
      id:      'bolt',
      label:   STATS.bolt.label,
      sectors: STATS.bolt.sectors,
      stats:   boltStats,
      total:   boltCount ?? (boltStats.active + boltStats.scheduled + boltStats.completed),
      // Red — Bolt Florida
      bgActive:    '#C0101B',
      textActive:  '#ffffff',
      subActive:   'rgba(255,255,255,0.55)',
      bgInactive:  '#FEF0F1',
      textInactive:'#000000',
      subInactive: '#9CA3AF',
    },
    {
      id:      'bolt-dallas',
      label:   STATS['bolt-dallas'].label,
      sectors: STATS['bolt-dallas'].sectors,
      stats:   dallasStats,
      total:   boltDallasCount ?? (dallasStats.active + dallasStats.scheduled + dallasStats.completed),
      // Slate grey — Bolt Dallas
      bgActive:    '#1F2937',
      textActive:  '#ffffff',
      subActive:   'rgba(255,255,255,0.55)',
      bgInactive:  '#ECEEF0',
      textInactive:'#000000',
      subInactive: '#9CA3AF',
    },
  ]

  return (
    <div className="branch-tabs">
      {tabs.map(tab => {
        const isActive  = active === tab.id
        const isHovered = hoveredId === tab.id && !isActive
        // Active card: always show active palette. Inactive + hovered: preview active palette.
        const showActive = isActive || isHovered
        const bg   = showActive ? tab.bgActive   : tab.bgInactive
        const text = showActive ? tab.textActive : tab.textInactive
        const sub  = showActive ? tab.subActive  : tab.subInactive
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
            {/* Top row: entity name + active pill */}
            <div className="branch-card-top">
              <div className="branch-card-name" style={{ color: text, transition: 'color 0.15s' }}>
                {tab.label}
              </div>
              <div
                className={`branch-card-pill${showActive ? ' branch-card-pill--on' : ''}`}
                style={{
                  background: showActive ? 'rgba(255,255,255,0.2)' : tab.bgActive + '22',
                  color:      showActive ? '#fff' : tab.bgActive,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {tab.stats.active} active
              </div>
            </div>

            {/* Sectors subtitle */}
            <div className="branch-card-sectors" style={{ color: sub, transition: 'color 0.15s' }}>
              {tab.sectors}
            </div>

            {/* Progress bar */}
            <div className="branch-card-bar-wrap">
              <div
                className="branch-card-bar-track"
                style={{ background: showActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
              >
                <div
                  className="branch-card-bar-fill"
                  style={{
                    width: `${Math.round((tab.stats.active / total) * 100)}%`,
                    background: showActive ? '#ffffff' : tab.bgActive,
                  }}
                />
              </div>
            </div>

            {/* Stat row */}
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
  )
}
