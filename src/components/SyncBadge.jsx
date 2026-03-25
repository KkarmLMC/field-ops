import { useSync } from '../hooks/useSync'

export default function SyncBadge({ compact }) {
  const { status, label } = useSync()

  if (compact) {
    // Tiny dot-only version for mobile header
    return (
      <div className={`sync-badge ${status}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.625rem' }}>
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
