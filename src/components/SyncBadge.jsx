import { useSync } from '../hooks/useSync'

export default function SyncBadge() {
  const { status, label } = useSync()
  return (
    <div className={`sync-badge ${status}`}>
      <div className="sync-dot" />
      {label}
    </div>
  )
}
