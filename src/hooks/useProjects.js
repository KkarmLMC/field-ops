import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { MOCK_PROJECTS } from '../data/mockData'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await db
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })
      // Fall back to mock data when Supabase returns empty
      setProjects(data && data.length > 0 ? data : MOCK_PROJECTS)
    } catch {
      // On error (offline, no connection), use mock data
      setProjects(MOCK_PROJECTS)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveProject = async (f) => {
    if (f.id) await db.from('projects').update(f).eq('id', f.id)
    else      await db.from('projects').insert(f)
    load()
  }

  const archiveProject = async (id) => {
    await db.from('projects').update({ archived: true, stage: 'Cancelled' }).eq('id', id)
    load()
  }

  return { projects, loading, saveProject, archiveProject, reload: load }
}
