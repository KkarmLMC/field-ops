import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash, Package, CheckCircle, ArrowLeft } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.jsx'
import { logActivity } from '../lib/logActivity.js'
import ProjectPicker from '../components/ProjectPicker.jsx'

export default function PartRequest() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [params] = useSearchParams()

  const [parts, setParts]       = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const [project, setProject] = useState(null)   // selected project object
  const [form, setForm] = useState({
    justification: '',
    warehouse_id: params.get('warehouse') || '',
    division: profile?.division || 'LM' })
  const [items, setItems] = useState([{ part_id: '', quantity: 1, notes: '' }])

  useEffect(() => {
    Promise.all([
      db.from('parts').select('id, name, sku').eq('is_active', true).order('name'),
      db.from('warehouses').select('id, name, city, state').eq('is_active', true).order('sort_order'),
    ]).then(([{ data: p }, { data: w }]) => {
      setParts(p || [])
      setWarehouses(w || [])
      if (w?.length && !form.warehouse_id) setForm(f => ({ ...f, warehouse_id: w[0].id }))
      setLoading(false)
    })
  }, [])

  const addItem = () => setItems(i => [...i, { part_id: '', quantity: 1, notes: '' }])
  const removeItem = idx => setItems(i => i.filter((_, j) => j !== idx))
  const updateItem = (idx, key, val) => setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item))

  const handleSubmit = async () => {
    setError('')
    if (!project) return setError('Please select a project from the database.')
    if (!form.justification.trim()) return setError('Justification is required.')
    if (items.some(i => !i.part_id)) return setError('Please select a part for each line item.')
    if (!form.warehouse_id) return setError('Please select a warehouse.')

    setSaving(true)
    try {
      const { data: co, error: coErr } = await db
        .from('change_orders')
        .insert({
          project_id:    project?.id || null,
          job_reference: project ? `${project.name}${project.job_number ? ' · ' + project.job_number : ''}` : '',
          justification: form.justification,
          warehouse_id:  form.warehouse_id,
          division:      form.division,
          submitted_by:  profile?.full_name || profile?.email || 'Field Tech',
          submitted_by_id: profile?.id || null,
          status:        'pending' })
        .select('id')
        .single()

      if (coErr) throw coErr

      const { error: itemErr } = await db
        .from('change_order_items')
        .insert(items.map(i => ({ co_id: co.id, part_id: i.part_id, quantity: Number(i.quantity), notes: i.notes || null })))

      if (itemErr) throw itemErr

      await logActivity(db, user?.id, 'field_ops', {
        category:    'parts',
        action:      'part_request_submitted',
        label:       `Submitted part request (${items.length} item${items.length !== 1 ? 's' : ''})`,
        entity_type: 'change_order',
        entity_id:   co?.id,
        meta:        { item_count: items.length } })
      setSaved(true)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-l)', textAlign: 'center' }}>
      <CheckCircle size="3.25rem" weight="fill" style={{ color: 'var(--state-success)' }} />
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Request Submitted</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 280 }}>
        Your part request is pending management review in Mission Control. You'll be notified once it's approved.
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-m)', marginTop: 'var(--space-s)' }}>
        <button onClick={() => navigate('/stock')} className="btn btn-secondary">Back to Stock</button>
        <button onClick={() => { setSaved(false); setItems([{ part_id: '', quantity: 1, notes: '' }]); setProject(null); setForm(f => ({ ...f, justification: '' })) }}
          className="btn btn-primary">New Request</button>
      </div>
    </div>
  )

  if (loading) return <div className="page-content" className="spinner-pad"><div className="spinner" /></div>

  return (
    <div className="page-content fade-in">
      <button onClick={() => navigate('/stock')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-m)' }}>
        <ArrowLeft size="0.875rem" /> Back to Stock
      </button>

      {/* Job details */}
      <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
        <div style={{ background: 'var(--brand-primary)', padding: 'var(--space-m) var(--space-l)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>Job Details</div>
        </div>
        <div style={{ padding: 'var(--space-l)', display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
          <ProjectPicker
            value={project}
            onChange={setProject}
            label="Project / Job"
            required
          />
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Fulfillment Warehouse <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <select value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
              <option value="">— Select warehouse —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} — {w.city}, {w.state}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Justification <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
              placeholder="Why do you need these parts? What's the job context or change in scope?" rows={3} />
          </div>
        </div>
      </div>

      {/* Parts */}
      <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
        <div style={{ background: 'var(--brand-primary)', padding: 'var(--space-m) var(--space-l)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>Parts Requested</div>
          <span className="list-card__meta">{items.length} line{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ padding: 'var(--space-m)', display: 'flex', flexDirection: 'column', gap: 'var(--space-s)' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: 'var(--radius-l)', padding: 'var(--space-m)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-s)', marginBottom: 'var(--space-s)' }}>
                <select value={item.part_id} onChange={e => updateItem(idx, 'part_id', e.target.value)} style={{ flex: 1 }}>
                  <option value="">— Select part —</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                </select>
                <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  style={{ width: 64, textAlign: 'center' }} />
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} style={{ background: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                    <Trash size="0.9375rem" />
                  </button>
                )}
              </div>
              <input value={item.notes} onChange={e => updateItem(idx, 'notes', e.target.value)}
                placeholder="Note (optional)" style={{ fontSize: 'var(--text-xs)' }} />
            </div>
          ))}
          <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)', padding: 'var(--space-s)', borderRadius: 'var(--radius-l)', border: '1px dashed var(--border-default)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            <Plus size="0.875rem" /> Add Part
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: 'var(--space-m)', borderRadius: 'var(--radius-l)', background: 'var(--state-error-soft)', color: 'var(--error-alt)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-l)' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={saving}
        style={{ width: '100%', padding: 'var(--space-l)', borderRadius: 'var(--radius-m)', background: saving ? 'var(--text-muted)' : 'var(--brand-primary)', color: '#fff', fontWeight: 800, fontSize: 'var(--text-md)', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)' }}>
        {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Submitting…</> : 'Submit Part Request →'}
      </button>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-s)' }}>
        This request goes to Mission Control for management review before any parts are pulled.
      </div>
    </div>
  )
}
