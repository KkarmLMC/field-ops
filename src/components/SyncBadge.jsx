import { useSync } from '../hooks/useSync'

export default function SyncBadge({ compact }) {
  const { status, label } = useSync()

  if (compact) {
    // Tiny dot-only version for mobile header
    return (
      <div className={`sync-badge ${status}`} style={{ padding: 'var(--space-2xs) var(--space-s)', fontSize: 'var(--text-2xs)' }}>
        <div className="sync-dot" />
        {label}
      </div>
    )
  }

  return (
    <div className={`sync-badge ${status}`}>
      <div className="sync-dot" />
      {label}
    </div>
  )
}
