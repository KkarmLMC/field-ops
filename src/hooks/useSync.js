/**
 * useSync — tracks online status and pending offline queue count.
 * Auto-flushes the queue when the device comes back online.
 *
 * Returns: { online, pending, status, label }
 *   status: 'online' | 'offline' | 'pending' | 'syncing'
 */

import { useState, useEffect, useRef } from 'react'
import { getPendingCount, flushQueue } from '../lib/offline'

export function useSync() {
  const [online,  setOnline]  = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const wasOffline = useRef(false)

  // Flush queue when coming back online
  const tryFlush = async () => {
    const count = await getPendingCount()
    if (count === 0) return
    setSyncing(true)
    await flushQueue()
    setSyncing(false)
    getPendingCount().then(setPending)
  }

  useEffect(() => {
    const onOnline  = () => {
      setOnline(true)
      if (wasOffline.current) tryFlush()
      wasOffline.current = false
    }
    const onOffline = () => {
      setOnline(false)
      wasOffline.current = true
    }
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Poll pending count every 10s
  useEffect(() => {
    getPendingCount().then(setPending)
    const i = setInterval(() => getPendingCount().then(setPending), 10000)
    return () => clearInterval(i)
  }, [])

  const status = syncing
    ? 'syncing'
    : !online
      ? 'offline'
      : pending > 0
        ? 'pending'
        : 'online'

  const label = syncing
    ? `Syncing ${pending}…`
    : !online
      ? 'Offline'
      : pending > 0
        ? `${pending} pending`
        : 'Synced'

  return { online, pending, syncing, status, label }
}
