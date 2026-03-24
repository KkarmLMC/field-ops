import { useState, useEffect } from 'react'
import { getPendingCount } from '../lib/offline'

export function useSync() {
  const [online, setOnline]   = useState(navigator.onLine)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    getPendingCount().then(setPending)
    const i = setInterval(() => getPendingCount().then(setPending), 5000)
    return () => clearInterval(i)
  }, [])

  const status = !online ? 'offline' : pending > 0 ? 'pending' : 'online'
  const label  = !online ? 'Offline' : pending > 0 ? `${pending} pending` : 'Synced'
  return { online, pending, status, label }
}
