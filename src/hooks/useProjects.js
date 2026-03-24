import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false })
    setProjects(data || [])
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
