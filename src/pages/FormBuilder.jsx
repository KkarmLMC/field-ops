/**
 * Form Builder — /forms/builder
 *
 * Management UI for viewing, editing, and adding fields to forms.
 * All changes save directly to the form_definitions table in Supabase.
 * No code deploy required — forms update live across the app.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Trash, ArrowUp, ArrowDown, FloppyDisk,
  PencilSimple, Eye, CaretRight, CheckCircle, SpinnerGap, X,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

const FIELD_TYPES = [
  { value: 'text',      label: 'Text' },
  { value: 'number',    label: 'Number' },
  { value: 'email',     label: 'Email' },
  { value: 'date',      label: 'Date' },
  { value: 'textarea',  label: 'Long Text' },
  { value: 'select',    label: 'Dropdown' },
  { value: 'boolean',   label: 'Yes / No' },
  { value: 'radio',     label: 'Radio (single select)' },
  { value: 'checklist', label: 'Checklist (multi-select)' },
  { value: 'signature', label: 'Signature' },
  { value: 'photo',     label: 'Photo Capture' },
  { value: 'gps',       label: 'GPS Location' },
]

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// ─── Field Editor row ─────────────────────────────────────────────────────────
function FieldRow({ field, index, total, onChange, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(false)
  const needsOptions = ['select','radio','checklist'].includes(field.type)

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border-l)', borderRadius:'var(--r-md)', marginBottom:'var(--sp-2)', overflow:'hidden' }}>
      {/* Collapsed header */}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
          <button type="button" onClick={()=>onMove(index,-1)} disabled={index===0} style={{ opacity:index===0?0.3:1, padding:'0 var(--sp-1)' }}><ArrowUp size={11}/></button>
          <button type="button" onClick={()=>onMove(index,1)} disabled={index===total-1} style={{ opacity:index===total-1?0.3:1, padding:'0 var(--sp-1)' }}><ArrowDown size={11}/></button>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:'var(--fs-md)', marginBottom:'0.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {field.label || <span style={{ color:'var(--text-3)', fontStyle:'italic' }}>Unlabelled field</span>}
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)' }}>
            {field.type}{field.required?' · required':''}{field.id?' · '+field.id:''}
          </div>
        </div>
        <button type="button" onClick={()=>setExpanded(e=>!e)} style={{ color:'var(--text-3)', padding:'var(--sp-1)' }}>
          <PencilSimple size={14}/>
        </button>
        <button type="button" onClick={()=>onDelete(index)} style={{ color:'var(--red)', padding:'var(--sp-1)' }}>
          <Trash size={14}/>
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding:'var(--sp-3)', background:'var(--surface-raised)', borderTop:'1px solid var(--border-l)', display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
            <div>
              <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Label *</label>
              <input value={field.label||''} onChange={e=>onChange(index,{...field, label:e.target.value, id: field.id||slugify(e.target.value)})} placeholder="Field label" style={{ width:'100%' }}/>
            </div>
            <div>
              <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Field ID</label>
              <input value={field.id||''} onChange={e=>onChange(index,{...field, id:e.target.value})} placeholder="auto_generated" style={{ width:'100%', fontFamily:'var(--mono)' }}/>
            </div>
            <div>
              <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Type</label>
              <select value={field.type||'text'} onChange={e=>onChange(index,{...field, type:e.target.value})} style={{ width:'100%' }}>
                {FIELD_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', cursor:'pointer' }}>
                <input type="checkbox" checked={!!field.required} onChange={e=>onChange(index,{...field,required:e.target.checked})} />
                <span style={{ fontSize:'var(--fs-sm)', color:'var(--text-2)' }}>Required</span>
              </label>
            </div>
          </div>
          <div>
            <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Hint / Help text</label>
            <input value={field.hint||''} onChange={e=>onChange(index,{...field,hint:e.target.value})} placeholder="Optional helper text shown below the label" style={{ width:'100%' }}/>
          </div>
          {needsOptions && (
            <div>
              <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Options (one per line)</label>
              <textarea
                value={(field.options||[]).join('\n')}
                onChange={e=>onChange(index,{...field, options: e.target.value.split('\n').filter(Boolean)})}
                rows={4} style={{ width:'100%', fontFamily:'var(--mono)', fontSize:'var(--fs-sm)', resize:'vertical' }}
                placeholder="Option A&#10;Option B&#10;Option C"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section Editor ───────────────────────────────────────────────────────────
function SectionEditor({ section, sectionIdx, totalSections, onChange, onDelete, onMoveSection }) {
  const addField = () => {
    const newField = { id:`field_${Date.now()}`, label:'', type:'text', required:false }
    onChange(sectionIdx, { ...section, fields:[...section.fields, newField] })
  }

  const updateField = (fieldIdx, updated) => {
    const fields = section.fields.map((f,i)=>i===fieldIdx?updated:f)
    onChange(sectionIdx, { ...section, fields })
  }

  const deleteField = (fieldIdx) => {
    onChange(sectionIdx, { ...section, fields:section.fields.filter((_,i)=>i!==fieldIdx) })
  }

  const moveField = (fieldIdx, dir) => {
    const fields = [...section.fields]
    const target = fieldIdx + dir
    if (target < 0 || target >= fields.length) return
    ;[fields[fieldIdx], fields[target]] = [fields[target], fields[fieldIdx]]
    onChange(sectionIdx, { ...section, fields })
  }

  return (
    <div style={{ background:'var(--surface-raised)', borderRadius:'var(--r-xl)', marginBottom:'var(--sp-4)', overflow:'hidden' }}>
      {/* Section header */}
      <div style={{ background:'var(--navy)', padding:'var(--sp-3) var(--sp-4)', display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
        <div style={{ flex:1 }}>
          <input
            value={section.title||''}
            onChange={e=>onChange(sectionIdx,{...section,title:e.target.value})}
            placeholder="Section title"
            style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'var(--r-sm)', color:'#fff', fontWeight:700, fontSize:'var(--fs-md)', padding:'var(--sp-1) var(--sp-2)', width:'100%' }}
          />
        </div>
        <div style={{ display:'flex', gap:'var(--sp-1)' }}>
          <button type="button" onClick={()=>onMoveSection(sectionIdx,-1)} disabled={sectionIdx===0} style={{ color:'rgba(255,255,255,0.6)', opacity:sectionIdx===0?0.3:1 }}><ArrowUp size={13}/></button>
          <button type="button" onClick={()=>onMoveSection(sectionIdx,1)} disabled={sectionIdx===totalSections-1} style={{ color:'rgba(255,255,255,0.6)', opacity:sectionIdx===totalSections-1?0.3:1 }}><ArrowDown size={13}/></button>
          <button type="button" onClick={()=>onDelete(sectionIdx)} style={{ color:'rgba(255,100,100,0.8)' }}><Trash size={13}/></button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding:'var(--sp-3)' }}>
        {section.fields.map((field, fi) => (
          <FieldRow
            key={field.id+fi}
            field={field}
            index={fi}
            total={section.fields.length}
            onChange={updateField}
            onDelete={deleteField}
            onMove={moveField}
          />
        ))}
        <button type="button" onClick={addField}
          style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-sm)', border:'1px dashed var(--border-l)', width:'100%', justifyContent:'center', color:'var(--text-3)', fontSize:'var(--fs-sm)', marginTop:section.fields.length?'var(--sp-2)':0 }}>
          <Plus size={13}/> Add Field
        </button>
      </div>
    </div>
  )
}

// ─── Form Editor ──────────────────────────────────────────────────────────────
function FormEditor({ form, onSave, onCancel }) {
  const [sections, setSections] = useState(JSON.parse(JSON.stringify(form.sections || [])))
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState(null)

  const updateSection = (idx, updated) => setSections(s=>s.map((sec,i)=>i===idx?updated:sec))
  const deleteSection = (idx) => setSections(s=>s.filter((_,i)=>i!==idx))
  const moveSection   = (idx, dir) => {
    const next = [...sections]
    const t    = idx + dir
    if (t<0||t>=next.length) return
    ;[next[idx],next[t]] = [next[t],next[idx]]
    setSections(next)
  }
  const addSection = () => setSections(s=>[...s, { title:'New Section', fields:[] }])

  const handleSave = async () => {
    setSaving(true); setError(null)
    const { error } = await db.from('form_definitions').update({ sections }).eq('slug', form.slug)
    setSaving(false)
    if (error) { setError('Save failed: ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSave({ ...form, sections })
  }

  return (
    <div className="page-content fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
        <div>
          <div style={{ fontSize:'var(--fs-xs)', fontFamily:'var(--mono)', color:'var(--text-3)', textTransform:'uppercase', marginBottom:'var(--sp-1)' }}>{form.ref || form.category}</div>
          <div style={{ fontSize:'var(--fs-lg)', fontWeight:700 }}>{form.title}</div>
        </div>
        <div style={{ display:'flex', gap:'var(--sp-2)' }}>
          <button type="button" onClick={onCancel} style={{ padding:'var(--sp-2) var(--sp-4)', borderRadius:'var(--r-sm)', border:'1px solid var(--border-l)', fontSize:'var(--fs-sm)', color:'var(--text-2)' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'var(--sp-2) var(--sp-4)', borderRadius:'var(--r-sm)', background:saved?'var(--green)':saving?'var(--hover)':'var(--navy)', color:saved||!saving?'#fff':'var(--text-3)', fontSize:'var(--fs-sm)', fontWeight:600, transition:'background var(--ease-fast)' }}>
            {saving ? <><SpinnerGap size={13} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : saved ? <><CheckCircle size={13}/> Saved!</> : <><FloppyDisk size={13}/> Save Changes</>}
          </button>
        </div>
      </div>

      {error && <div style={{ padding:'var(--sp-3)', marginBottom:'var(--sp-3)', background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-sm)', color:'var(--red)' }}>{error}</div>}

      {sections.map((sec, i) => (
        <SectionEditor key={sec.title+i} section={sec} sectionIdx={i} totalSections={sections.length} onChange={updateSection} onDelete={deleteSection} onMoveSection={moveSection} />
      ))}

      <button type="button" onClick={addSection}
        style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-3)', borderRadius:'var(--r-lg)', border:'2px dashed var(--border-l)', width:'100%', justifyContent:'center', color:'var(--text-3)', fontSize:'var(--fs-md)', marginBottom:'var(--sp-8)' }}>
        <Plus size={16}/> Add Section
      </button>
    </div>
  )
}

// ─── Main Form Builder page ───────────────────────────────────────────────────
export default function FormBuilder() {
  const navigate = useNavigate()
  const [forms,    setForms]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)

  useEffect(() => {
    db.from('form_definitions').select('*').eq('active', true).order('sort_order', { ascending:true })
      .then(({ data }) => { if(data) setForms(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = (updated) => {
    setForms(f => f.map(form => form.slug===updated.slug ? updated : form))
  }

  if (editing) return <FormEditor form={editing} onSave={handleSave} onCancel={()=>setEditing(null)} />

  return (
    <div className="page-content fade-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background:'var(--navy)' }}/>Form Builder</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"/></div>
        ) : forms.length === 0 ? (
          <div className="empty"><div className="empty-desc">No forms found in database.</div></div>
        ) : forms.map(form => (
          <div key={form.slug} style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', padding:'0.875rem var(--sp-4)', borderBottom:'1px solid var(--border-l)' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="project-name">{form.title}</div>
              <div className="project-meta">
                {form.short} · {form.sections?.length || 0} sections · {(form.sections||[]).reduce((n,s)=>n+(s.fields?.length||0),0)} fields
                {form.branch && <span style={{ marginLeft:'var(--sp-2)', padding:'0 var(--sp-2)', borderRadius:'var(--r-full)', background:'var(--card-header-bg)', fontSize:'var(--fs-2xs)', fontFamily:'var(--mono)' }}>{form.branch}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'var(--sp-2)', flexShrink:0 }}>
              <button onClick={()=>navigate(`/forms/${form.slug}`)}
                style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'var(--sp-1) var(--sp-3)', borderRadius:'var(--r-sm)', border:'1px solid var(--border-l)', fontSize:'var(--fs-xs)', color:'var(--text-2)' }}>
                <Eye size={12}/> Preview
              </button>
              <button onClick={()=>setEditing(form)}
                style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'var(--sp-1) var(--sp-3)', borderRadius:'var(--r-sm)', background:'var(--navy)', color:'#fff', fontSize:'var(--fs-xs)' }}>
                <PencilSimple size={12}/> Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
