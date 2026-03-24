import { STATS } from '../data/mockData.js'

/**
 * BranchTabs — top-of-page filter tabs for Lightning Master vs Bolt Lightning.
 *
 * Props:
 *   active      — 'lm' | 'bolt'
 *   onChange    — (branch) => void
 *   lmCount     — optional override for LM count badge
 *   boltCount   — optional override for Bolt count badge
 */
export default function BranchTabs({ active, onChange, lmCount, boltCount }) {
  const lm   = STATS.lm
  const bolt = STATS.bolt

  const tabs = [
    {
      id: 'lm',
      label: lm.label,
      sectors: lm.sectors,
      count: lmCount ?? lm.active,
      countLabel: 'active',
      icon: '⚡',
      accentColor: '#D97706',
      accentBg: '#FFFBEB',
      borderActive: '#D97706',
    },
    {
      id: 'bolt',
      label: bolt.label,
      sectors: bolt.sectors,
      count: boltCount ?? bolt.active,
      countLabel: 'active',
      icon: '🔩',
      accentColor: '#2563EB',
      accentBg: '#EFF6FF',
      borderActive: '#2563EB',
    },
  ]

  return (
    <div className="branch-tabs">
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={`branch-tab ${isActive ? 'branch-tab-active' : ''}`}
            onClick={() => onChange(tab.id)}
            style={isActive ? {
              borderColor: tab.borderActive,
              background: tab.accentBg,
            } : {}}
          >
            <span className="branch-tab-icon">{tab.icon}</span>
            <div className="branch-tab-text">
              <div className="branch-tab-name" style={isActive ? { color: tab.accentColor } : {}}>
                {tab.label}
              </div>
              <div className="branch-tab-sectors">{tab.sectors}</div>
            </div>
            <div
              className="branch-tab-badge"
              style={isActive ? { background: tab.accentColor, color: 'white' } : {}}
            >
              {tab.count}
            </div>
          </button>
        )
      })}
    </div>
  )
}
