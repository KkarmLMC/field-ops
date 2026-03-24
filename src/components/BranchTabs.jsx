import { STATS, JOBS } from '../data/mockData.js'

export default function BranchTabs({ active, onChange, lmCount, boltCount }) {
  const lm   = STATS.lm
  const bolt = STATS.bolt

  // Live counts from JOBS data
  const lmStats = {
    active:    JOBS.filter(j => j.branch === 'lm' && j.status === 'active').length,
    scheduled: JOBS.filter(j => j.branch === 'lm' && j.status === 'scheduled').length,
    completed: JOBS.filter(j => j.branch === 'lm' && j.status === 'completed').length,
  }
  const boltStats = {
    active:    JOBS.filter(j => j.branch === 'bolt' && j.status === 'active').length,
    scheduled: JOBS.filter(j => j.branch === 'bolt' && j.status === 'scheduled').length,
    completed: JOBS.filter(j => j.branch === 'bolt' && j.status === 'completed').length,
  }

  const tabs = [
    {
      id:      'lm',
      label:   'Lightning Master',
      sectors: 'Oilfield · Chemical · Industrial',
      stats:   lmStats,
      total:   lmCount ?? (lmStats.active + lmStats.scheduled + lmStats.completed),
      // Active palette
      bgActive:   '#04245C',   // navy
      textActive: '#ffffff',
      subActive:  'rgba(255,255,255,0.55)',
      // Inactive palette
      bgInactive:   '#F0F3FA',
      textInactive: '#04245C',
      subInactive:  '#6B7BA4',
    },
    {
      id:      'bolt',
      label:   'Bolt Lightning',
      sectors: 'Commercial · Municipal · Hotels',
      stats:   boltStats,
      total:   boltCount ?? (boltStats.active + boltStats.scheduled + boltStats.completed),
      // Active palette
      bgActive:   '#04245C',   // navy (same as LM)
      textActive: '#ffffff',
      subActive:  'rgba(255,255,255,0.55)',
      // Inactive palette
      bgInactive:   '#F0F3FA',
      textInactive: '#04245C',
      subInactive:  '#6B7BA4',
    },
  ]

  return (
    <div className="branch-tabs">
      {tabs.map(tab => {
        const isActive = active === tab.id
        const bg       = isActive ? tab.bgActive       : tab.bgInactive
        const text     = isActive ? tab.textActive     : tab.textInactive
        const sub      = isActive ? tab.subActive      : tab.subInactive
        const total    = tab.total || 1  // avoid divide-by-zero

        return (
          <button
            key={tab.id}
            className="branch-card"
            onClick={() => onChange(tab.id)}
            style={{ background: bg }}
          >
            {/* Top row: entity name + active pill */}
            <div className="branch-card-top">
              <div className="branch-card-name" style={{ color: text }}>
                {tab.label}
              </div>
              <div
                className="branch-card-pill"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : tab.bgActive + '22',
                  color: isActive ? '#fff' : tab.bgActive,
                }}
              >
                {tab.stats.active} active
              </div>
            </div>

            {/* Sectors subtitle */}
            <div className="branch-card-sectors" style={{ color: sub }}>
              {tab.sectors}
            </div>

            {/* Progress bar — active / total */}
            <div className="branch-card-bar-wrap">
              <div
                className="branch-card-bar-track"
                style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
              >
                <div
                  className="branch-card-bar-fill"
                  style={{
                    width: `${Math.round((tab.stats.active / total) * 100)}%`,
                    background: isActive ? '#ffffff' : tab.bgActive,
                  }}
                />
              </div>
            </div>

            {/* Stat row: active · scheduled · completed */}
            <div className="branch-card-stats">
              {[
                { label: 'Active',    value: tab.stats.active },
                { label: 'Scheduled', value: tab.stats.scheduled },
                { label: 'Done',      value: tab.stats.completed },
              ].map((s, i) => (
                <div key={i} className="branch-card-stat">
                  <span className="branch-card-stat-value" style={{ color: text }}>{s.value}</span>
                  <span className="branch-card-stat-label" style={{ color: sub }}>{s.label}</span>
                </div>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
