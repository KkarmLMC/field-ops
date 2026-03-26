/**
 * offline.js — IndexedDB queue for offline form submissions
 *
 * When a tech submits a form with no connection, the payload is stored
 * locally in IndexedDB. When the device comes back online, the queue
 * is flushed to Supabase automatically.
 *
 * Tables:
 *   pendingSubmissions — form_submissions_v2 payloads waiting to sync
 *   cachedForms        — form_definitions schemas cached for offline use
 */

import Dexie from 'dexie'
import { db } from './supabase'

// ─── Local IndexedDB ──────────────────────────────────────────────────────────
export const localDB = new Dexie('FieldOpsOffline')

localDB.version(2).stores({
  pendingSubmissions: '++id, form_slug, branch, queued_at, synced',
  cachedForms:        'slug, updated_at',
  // Legacy tables kept for migration compatibility
  pendingReports:     '++id, project_id, report_date, synced',
  pendingForms:       '++id, project_id, template_id, synced',
  pendingPhotos:      '++id, submission_id, section_key, synced',
  projectsCache:      'id, stage, updated_at',
})

// ─── Queue a form submission ──────────────────────────────────────────────────
export async function queueSubmission(payload) {
  await localDB.pendingSubmissions.add({
    ...payload,
    queued_at: new Date().toISOString(),
    synced: 0,
  })
}

// ─── Flush queue to Supabase ──────────────────────────────────────────────────
export async function flushQueue() {
  const pending = await localDB.pendingSubmissions
    .where('synced').equals(0).toArray()

  if (!pending.length) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed  = 0

  for (const item of pending) {
    try {
      const { id: localId, synced, queued_at, ...payload } = item
      const { error } = await db.from('form_submissions_v2').insert(payload)
      if (error) throw error
      await localDB.pendingSubmissions.update(localId, { synced: 1 })
      flushed++
    } catch {
      failed++
    }
  }

  // Clean up synced items older than 7 days
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await localDB.pendingSubmissions
    .where('synced').equals(1)
    .and(item => item.queued_at < cutoff)
    .delete()

  return { flushed, failed }
}

// ─── Cache form schemas for offline rendering ─────────────────────────────────
export async function cacheFormSchemas(forms) {
  for (const form of forms) {
    await localDB.cachedForms.put({
      slug:       form.slug,
      updated_at: form.updated_at || new Date().toISOString(),
      data:       form,
    })
  }
}

export async function getCachedForm(slug) {
  const row = await localDB.cachedForms.get(slug)
  return row?.data || null
}

// ─── Pending count (used by SyncBadge) ───────────────────────────────────────
export async function getPendingCount() {
  return localDB.pendingSubmissions.where('synced').equals(0).count()
}
