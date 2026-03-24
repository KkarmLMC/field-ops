import Dexie from 'dexie'

// Local IndexedDB database for offline support
export const localDB = new Dexie('FieldOpsOffline')

localDB.version(1).stores({
  pendingReports:  '++id, project_id, report_date, synced',
  pendingForms:    '++id, project_id, template_id, synced',
  pendingPhotos:   '++id, submission_id, section_key, synced',
  projectsCache:   'id, stage, updated_at',
})

export async function getPendingCount() {
  const reports = await localDB.pendingReports.where('synced').equals(0).count()
  const forms   = await localDB.pendingForms.where('synced').equals(0).count()
  return reports + forms
}
