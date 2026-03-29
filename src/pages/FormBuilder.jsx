/**
 * Form Builder — /forms/builder
 *
 * Management UI for viewing, editing, and adding fields to forms.
 * All changes save directly to the form_definitions table in Supabase.
 * No code deploy required — forms update live across the app.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Trash, ArrowUp, ArrowDown, FloppyDisk,
  PencilSimple, Eye, CaretRight, CheckCircle, SpinnerGap, X,
  DotsSixVertical,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
const FIELD_TYPES = [
  { value: 'text',          label: 'Text' },
  { value: 'number',        label: 'Number' },
  { value: 'email',         label: 'Email' },
  { value: 'date',          label: 'Date' },
  { value: 'textarea',      label: 'Long Text' },
  { value: 'select',        label: 'Dropdown' },
  { value: 'boolean',       label: 'Yes / No' },
  { value: 'radio',         label: 'Radio (single select)' },
  { value: 'checklist',     label: 'Checklist (multi-select)' },
  { value: 'checkbox-group',label: 'Checkbox Group (JSA style)' },
  { value: 'pass-fail',     label: 'Pass / Fail (Fall Protection)' },
  { value: 'ok-notok-na',   label: 'OK / Not OK / N/A (Manlift)' },
  { value: 'activity-row',  label: 'Activity Row (JSA table)' },
  { value: 'personnel-sig', label: 'Personnel Sign-Off (JSA)' },
  { value: 'signature',     label: 'Signature Pad' },
  { value: 'photo',         label: 'Photo Capture' },
  { value: 'voice-note',    label: 'Voice Note' },
  { value: 'gps',           label: 'GPS Location' },
]

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// ─── Drag-to-reorder with floating ghost ────────────────────────────────────
// Ghost element follows finger/cursor. Drop zone shows dashed insert line.
// Works on both touch (mobile) and mouse (desktop).
function useDragReorder(items, onReorder) {
  const [dragIdx,    setDragIdx]    = useState(null)
  const [overIdx,    setOverIdx]    = useState(null)
  const [ghostPos,   setGhostPos]   = useState({ x: 0, y: 0 })
  const [ghostLabel, setGhostLabel] = useState('')
  const rowRefs  = useRef([])
  const dragRef  = useRef(null)   // tracks dragIdx without stale closure

  const getRowAtY = (y) => {
    for (let i = 0; i < rowRefs.current.length; i++) {
      const el = rowRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (y >= rect.top && y <= rect.bottom) return i
    }
    return null
  }

  const startDrag = (idx, x, y) => {
    dragRef.current = idx
    setDragIdx(idx)
    setOverIdx(idx)
    setGhostPos({ x, y })
    setGhostLabel(items[idx]?.label || items[idx]?.type || 'Field')
  }

  const moveDrag = (x, y) => {
    setGhostPos({ x, y })
    const over = getRowAtY(y)
    if (over !== null) setOverIdx(over)
  }

  const endDrag = () => {
    const src = dragRef.current
    setOverIdx(curr => {
      if (src !== null && curr !== null && src !== curr) {
        const next = [...items]
        const [moved] = next.splice(src, 1)
        next.splice(curr, 0, moved)
        onReorder(next)
      }
      return null
    })
    dragRef.current = null
    setDragIdx(null)
    setGhostLabel('')
  }

  // Touch handlers
  const handleTouchStart = (e, idx) => {
    e.preventDefault()
    const t = e.touches[0]
    startDrag(idx, t.clientX, t.clientY)
  }
  const handleTouchMove = (e) => {
    e.preventDefault()
    const t = e.touches[0]
    moveDrag(t.clientX, t.clientY)
  }
  const handleTouchEnd = () => endDrag()

  // Mouse handlers
  const handleMouseDown = (e, idx) => {
    e.preventDefault()
    startDrag(idx, e.clientX, e.clientY)
    const onMove = (me) => moveDrag(me.clientX, me.clientY)
    const onUp   = () => {
      endDrag()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return {
    dragIdx, overIdx, ghostPos, ghostLabel,
    rowRefs,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    handleMouseDown,
  }
}

// ─── Drag Ghost — floats under finger/cursor ──────────────────────────────────
function DragGhost({ label, pos, visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed',
      left: pos.x,
      top: pos.y,
      transform: 'translate(-50%, -50%) rotate(2deg)',
      pointerEvents: 'none',
      zIndex: 9999,
      background: 'var(--navy)',
      color: '#fff',
      padding: 'var(--sp-2) var(--sp-4)',
      borderRadius: 'var(--r-md)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      maxWidth: '16rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      <DotsSixVertical size={14} weight="bold" style={{ flexShrink: 0, opacity: 0.7 }} />
      {label}
    </div>
  )
}

// ─── Field Editor row ─────────────────────────────────────────────────────────
function FieldRow({ field, index, onChange, onDelete, isDragging, isOver, dragHandleProps }) {
  const [expanded, setExpanded] = useState(false)
  const needsOptions = ['select','radio','checklist','checkbox-group'].includes(field.type)

  return (
    <div style={{ position: 'relative' }}>
      {/* Drop indicator line above this row */}
      {isOver && (
        <div style={{
          position: 'absolute', top: -2, left: 0, right: 0, height: 3,
          background: 'var(--navy)', borderRadius: 2, zIndex: 10,
          boxShadow: '0 0 6px rgba(4,36,92,0.4)',
        }} />
      )}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-l)',
          borderRadius: 'var(--r-md)',
          marginBottom: 'var(--sp-2)',
          overflow: 'hidden',
          opacity: isDragging ? 0.35 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {/* Collapsed header */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)' }}>
          <div
            {...dragHandleProps}
            style={{ color:'var(--text-3)', cursor:'grab', padding:'var(--sp-2)', flexShrink:0, display:'flex', alignItems:'center', touchAction:'none', userSelect:'none', WebkitUserSelect:'none' }}
            title="Hold and drag to reorder"
          >
            <DotsSixVertical size={18} weight="bold" />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:'var(--fs-md)', marginBottom:'0.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {field.label || <span style={{ color:'var(--text-3)', fontStyle:'italic' }}>Unlabelled field</span>}
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)' }}>
              {field.type}{field.required?' · required':''}
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
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ fontSize:'var(--fs-xs)', fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:'var(--sp-1)' }}>Label *</label>
                <input value={field.label||''} onChange={e=>onChange(index,{...field, label:e.target.value, id: field.id||slugify(e.target.value)})} placeholder="Field label" style={{ width:'100%' }}/>
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
    </div>
  )
}

// ─── Field type picker sheet ──────────────────────────────────────────────────
// Groups field types visually so picking is faster than a flat list.
const TYPE_GROUPS = [
  { label: 'Basic',    types: ['text','number','email','date','textarea'] },
  { label: 'Choice',   types: ['select','boolean','radio','checklist','checkbox-group'] },
  { label: 'Safety',   types: ['pass-fail','ok-notok-na','activity-row','personnel-sig'] },
  { label: 'Capture',  types: ['signature','photo','voice-note','gps'] },
]
const TYPE_MAP = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t.label]))

function TypePickerSheet({ onPick, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200 }} />
      {/* Sheet */}
      <div style={{
        position:'fixed', left:0, right:0, bottom:0, zIndex:201,
        background:'var(--surface)', borderRadius:'var(--r-xl) var(--r-xl) 0 0',
        padding:'var(--sp-4)', maxHeight:'75vh', overflowY:'auto',
        boxShadow:'0 -4px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Handle */}
        <div style={{ width:'2.5rem', height:'0.25rem', background:'var(--border-l)', borderRadius:99, margin:'0 auto var(--sp-4)' }} />
        <div style={{ fontSize:'var(--fs-md)', fontWeight:700, marginBottom:'var(--sp-4)' }}>Choose Field Type</div>
        {TYPE_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:'var(--sp-4)' }}>
            <div style={{ fontSize:'var(--fs-xs)', fontFamily:'var(--mono)', color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'var(--sp-2)' }}>
              {group.label}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 10rem), 1fr))', gap:'var(--sp-2)' }}>
              {group.types.map(type => (
                <button key={type} type="button" onClick={() => onPick(type)}
                  style={{ padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-md)', border:'1px solid var(--border-l)', background:'var(--surface-raised)', textAlign:'left', fontSize:'var(--fs-sm)', color:'var(--text-1)', fontWeight:500, transition:'all var(--ease-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--navy)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='var(--navy)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--surface-raised)'; e.currentTarget.style.color='var(--text-1)'; e.currentTarget.style.borderColor='var(--border-l)' }}
                >
                  {TYPE_MAP[type]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
function SectionEditor({ section, sectionIdx, totalSections, onChange, onDelete, onMoveSection }) {
  const [showTypePicker, setShowTypePicker] = useState(false)

  const addField = (type) => {
    const newField = { id:`field_${Date.now()}`, label:'', type, required:false }
    onChange(sectionIdx, { ...section, fields:[...(section.fields||[]), newField] })
    setShowTypePicker(false)
  }

  const updateField = (fieldIdx, updated) => {
    const fields = (section.fields||[]).map((f,i)=>i===fieldIdx?updated:f)
    onChange(sectionIdx, { ...section, fields })
  }

  const deleteField = (fieldIdx) => {
    onChange(sectionIdx, { ...section, fields:(section.fields||[]).filter((_,i)=>i!==fieldIdx) })
  }

  const { dragIdx, overIdx, ghostPos, ghostLabel, rowRefs, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown } =
    useDragReorder(section.fields || [], (reordered) => onChange(sectionIdx, { ...section, fields: reordered }))

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

      {/* Fields — touch + mouse draggable */}
      <div
        style={{ padding:'var(--sp-3)' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {(section.fields||[]).map((field, fi) => (
          <div key={field.id+fi} ref={el => rowRefs.current[fi] = el}>
            <FieldRow
              field={field}
              index={fi}
              onChange={updateField}
              onDelete={deleteField}
              isDragging={dragIdx === fi}
              isOver={overIdx === fi && dragIdx !== null && dragIdx !== fi}
              dragHandleProps={{
                onTouchStart: (e) => handleTouchStart(e, fi),
                onMouseDown:  (e) => handleMouseDown(e, fi),
              }}
            />
          </div>
        ))}
        <button type="button" onClick={() => setShowTypePicker(true)}
          style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-sm)', border:'1px dashed var(--border-l)', width:'100%', justifyContent:'center', color:'var(--text-3)', fontSize:'var(--fs-sm)', marginTop:section.fields?.length?'var(--sp-2)':0 }}>
          <Plus size={13}/> Add Field
        </button>
      </div>

      {/* Floating ghost follows finger/cursor */}
      <DragGhost label={ghostLabel} pos={ghostPos} visible={dragIdx !== null} />

      {/* Type picker sheet */}
      {showTypePicker && <TypePickerSheet onPick={addField} onClose={() => setShowTypePicker(false)} />}
    </div>
  )
}

// ─── Form Editor ──────────────────────────────────────────────────────────────
function FormEditor({ form, onSave, onCancel }) {
  const [sections, setSections] = useState(JSON.parse(JSON.stringify(form.sections || [])))
  const [formMode, setFormMode] = useState(form.form_mode || 'scroll')
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
    const { error } = await db.from('form_definitions').update({ sections, form_mode: formMode }).eq('slug', form.slug)
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
          <div style={{ fontSize:'var(--fs-xs)', fontFamily:'var(--mono)', color:'var(--text-2)', textTransform:'uppercase', marginBottom:'var(--sp-1)' }}>{form.ref || form.category}</div>
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

      {/* Form mode selector */}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-4)', padding:'var(--sp-3) var(--sp-4)', background:'var(--surface-raised)', borderRadius:'var(--r-lg)', border:'1px solid var(--border-l)' }}>
        <span style={{ fontSize:'var(--fs-xs)', fontWeight:700, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>Form Mode</span>
        <div style={{ display:'flex', gap:'var(--sp-2)', flex:1 }}>
          {[
            { value:'scroll', label:'Scroll' },
            { value:'tabbed', label:'Tabbed' },
            { value:'index',  label:'Index'  },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => setFormMode(opt.value)}
              style={{
                flex:1, padding:'var(--sp-2)', borderRadius:'var(--r-sm)', fontSize:'var(--fs-xs)', fontWeight:600,
                border:`1px solid ${formMode===opt.value?'var(--navy)':'var(--border-l)'}`,
                background: formMode===opt.value?'var(--navy)':'transparent',
                color: formMode===opt.value?'#fff':'var(--text-3)',
                cursor:'pointer', transition:'all var(--ease-fast)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sections.map((sec, i) => (
        <div key={sec.title+i}>
          <SectionEditor section={sec} sectionIdx={i} totalSections={sections.length} onChange={updateSection} onDelete={deleteSection} onMoveSection={moveSection} />
          {/* Add Section button between sections */}
          <button type="button" onClick={() => {
            const next = [...sections]
            next.splice(i + 1, 0, { title:'New Section', fields:[] })
            setSections(next)
          }}
            style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-md)', border:'1px dashed var(--border-l)', width:'100%', justifyContent:'center', color:'var(--text-3)', fontSize:'var(--fs-xs)', marginBottom:'var(--sp-3)', background:'none' }}>
            <Plus size={11}/> Add Section Below
          </button>
        </div>
      ))}

      <button type="button" onClick={addSection}
        style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-3)', borderRadius:'var(--r-lg)', border:'2px dashed var(--border-l)', width:'100%', justifyContent:'center', color:'var(--text-3)', fontSize:'var(--fs-md)', marginBottom:'var(--sp-8)' }}>
        <Plus size={16}/> Add Section at End
      </button>
    </div>
  )
}

// ─── Main Form Builder page ───────────────────────────────────────────────────
export default function FormBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [forms,    setForms]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)

  useEffect(() => {
    db.from('form_definitions').select('*').eq('active', true).order('sort_order', { ascending:true })
      .then(({ data }) => {
        if (data) {
          setForms(data)
          // Auto-open editor if ?slug= param is present (coming from Preview button)
          const slug = searchParams.get('slug')
          if (slug) {
            const target = data.find(f => f.slug === slug)
            if (target) setEditing(target)
          }
        }
        setLoading(false)
      })
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
