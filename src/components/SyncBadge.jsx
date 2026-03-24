import { useSync } from '../hooks/useSync'

export default function SyncBadge({ compact }) {
  const { status, label } = useSync()

  if (compact) {
    // Tiny dot-only version for mobile header
    return (
      <div className={`sync-badge ${status}`} style={{ padding: '4px 8px', fontSize: 10 }}>
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
