/**
 * FormEngine — universal form renderer for Field Ops
 *
 * Renders any form schema fetched from the `form_definitions` Supabase table.
 * All field types supported: text, number, email, date, textarea, select,
 * boolean, radio, checklist, signature, photo, gps.
 *
 * Props:
 *   schema    {object}   — form_definitions row (sections, title, ref, etc.)
 *   values    {object}   — current field values keyed by field id
 *   onChange  {function} — (fieldId, value) => void
 *   errors    {object}   — validation errors keyed by field id (optional)
 *   readOnly  {boolean}  — renders values without inputs (for PDF preview / review)
 */

import { useRef, useEffect, useState } from 'react'
import {
  CaretDown, Trash, MapPin, Camera, CheckSquare, Square,
} from '@phosphor-icons/react'

// ─── Signature Pad ────────────────────────────────────────────────────────────
function SigPad({ value, onChange, readOnly }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image()
      img.onload = () => canvasRef.current?.getContext('2d')?.drawImage(img, 0, 0)
      img.src = value
    }
  }, [])

  if (readOnly) {
    return value
      ? <img src={value} alt="Signature" style={{ width:'100%', height:'4rem', objectFit:'contain', borderRadius:'var(--r-sm)', background:'var(--surface)' }} />
      : <div style={{ height:'2rem', color:'var(--text-3)', fontSize:'var(--fs-sm)', fontStyle:'italic' }}>No signature</div>
  }

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height
    if (e.touches) return { x:(e.touches[0].clientX-rect.left)*sx, y:(e.touches[0].clientY-rect.top)*sy }
    return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy }
  }
  const start = e => { e.preventDefault(); drawing.current=true; const ctx=canvasRef.current.getContext('2d'); const p=getPos(e,canvasRef.current); ctx.beginPath(); ctx.moveTo(p.x,p.y) }
  const move  = e => { e.preventDefault(); if(!drawing.current) return; const ctx=canvasRef.current.getContext('2d'); const p=getPos(e,canvasRef.current); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#111'; ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y) }
  const end   = e => { e.preventDefault(); if(!drawing.current) return; drawing.current=false; onChange(canvasRef.current.toDataURL('image/png')) }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0,0,480,80); onChange(null) }

  return (
    <div style={{ position:'relative' }}>
      <canvas ref={canvasRef} width={480} height={80}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width:'100%', height:'5rem', border:'1px solid var(--border-l)', borderRadius:'var(--r-sm)', background:'var(--surface)', cursor:'crosshair', touchAction:'none', display:'block' }}
      />
      {!value && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text-3)', fontSize:'var(--fs-sm)', pointerEvents:'none', fontStyle:'italic' }}>Sign here</div>}
      {value  && (
        <button type="button" onClick={clear} style={{ position:'absolute', top:'var(--sp-1)', right:'var(--sp-1)', background:'var(--hover)', border:'1px solid var(--border-l)', borderRadius:'var(--r-xs)', padding:'0.125rem 0.375rem', fontSize:'var(--fs-xs)', color:'var(--text-2)', display:'flex', alignItems:'center', gap:'var(--sp-1)' }}>
          <Trash size={10} /> Clear
        </button>
      )}
    </div>
  )
}

// ─── GPS Field ────────────────────────────────────────────────────────────────
function GpsField({ value, onChange, readOnly }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const capture = () => {
    if (!navigator.geolocation) { setError('Geolocation not available'); return }
    setLoading(true); setError(null)
    navigator.geolocation.getCurrentPosition(
      pos => { setLoading(false); onChange(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`) },
      err => { setLoading(false); setError('Could not get location') }
    )
  }

  if (readOnly) return <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-sm)' }}>{value || '—'}</span>

  return (
    <div style={{ display:'flex', gap:'var(--sp-2)', alignItems:'center' }}>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="lat, lng" style={{ flex:1 }} />
      <button type="button" onClick={capture} disabled={loading}
        style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-sm)', background:'var(--navy)', color:'#fff', fontSize:'var(--fs-xs)', fontFamily:'var(--mono)', whiteSpace:'nowrap', opacity: loading?0.6:1 }}>
        <MapPin size={12} /> {loading ? 'Getting…' : 'Get GPS'}
      </button>
      {error && <span style={{ color:'var(--red)', fontSize:'var(--fs-xs)' }}>{error}</span>}
    </div>
  )
}

// ─── Photo Field ──────────────────────────────────────────────────────────────
function PhotoField({ value, onChange, readOnly }) {
  const fileRef = useRef(null)
  const photos  = Array.isArray(value) ? value : value ? [value] : []

  const handleFiles = e => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => onChange([...photos, ev.target.result])
      reader.readAsDataURL(file)
    })
  }
  const remove = idx => onChange(photos.filter((_,i)=>i!==idx))

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-2)', marginBottom: photos.length?'var(--sp-2)':0 }}>
        {photos.map((src,i) => (
          <div key={i} style={{ position:'relative', width:'5rem', height:'5rem' }}>
            <img src={src} alt={`Photo ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--r-md)' }} />
            {!readOnly && (
              <button type="button" onClick={()=>remove(i)}
                style={{ position:'absolute', top:'-0.375rem', right:'-0.375rem', width:'1.25rem', height:'1.25rem', borderRadius:'var(--r-full)', background:'var(--red)', color:'#fff', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handleFiles} style={{ display:'none' }} />
          <button type="button" onClick={()=>fileRef.current.click()}
            style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-sm)', background:'var(--surface-raised)', border:'1px solid var(--border-l)', fontSize:'var(--fs-sm)', color:'var(--text-2)' }}>
            <Camera size={14} /> Add Photo
          </button>
        </>
      )}
    </div>
  )
}

// ─── Single Field Renderer ────────────────────────────────────────────────────
export function FormField({ field, value, onChange, error, readOnly }) {
  const { type, options = [], hint } = field

  if (readOnly) {
    let display = value ?? '—'
    if (type==='boolean') display = value===true?'Yes':value===false?'No':'—'
    if (type==='checklist'&&Array.isArray(value)) display = value.join(', ')||'—'
    if (type==='signature') return <SigPad value={value} readOnly />
    if (type==='photo')     return <PhotoField value={value} readOnly />
    if (type==='gps')       return <GpsField value={value} readOnly />
    return <span style={{ fontSize:'var(--fs-md)', color:'var(--text-1)' }}>{display}</span>
  }

  if (type==='text'||type==='email')
    return <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={{ width:'100%' }} />

  if (type==='number')
    return <input type="number" step="any" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="0" style={{ width:'100%' }} />

  if (type==='date')
    return <input type="date" value={value||''} onChange={e=>onChange(e.target.value)} style={{ width:'100%' }} />

  if (type==='textarea')
    return <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3} style={{ width:'100%', resize:'vertical', lineHeight:1.5 }} />

  if (type==='select')
    return (
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{ width:'100%' }}>
        <option value="">Select…</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    )

  if (type==='boolean')
    return (
      <div style={{ display:'flex', gap:'var(--sp-2)' }}>
        {['Yes','No'].map(opt => {
          const active = opt==='Yes'?value===true:value===false
          return (
            <button key={opt} type="button" onClick={()=>onChange(opt==='Yes')}
              style={{ flex:1, padding:'var(--sp-2)', borderRadius:'var(--r-sm)', border:`1px solid ${active?'var(--navy)':'var(--border-l)'}`, background:active?'var(--navy)':'var(--surface)', color:active?'#fff':'var(--text-2)', fontWeight:active?600:400, transition:'all var(--ease-fast)', fontSize:'var(--fs-md)' }}>
              {opt}
            </button>
          )
        })}
      </div>
    )

  if (type==='radio')
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-2)' }}>
        {options.map(opt => {
          const active = value===opt
          return (
            <button key={opt} type="button" onClick={()=>onChange(opt)}
              style={{ padding:'var(--sp-2) var(--sp-4)', borderRadius:'var(--r-full)', border:`1px solid ${active?'var(--navy)':'var(--border-l)'}`, background:active?'var(--navy)':'var(--surface)', color:active?'#fff':'var(--text-2)', fontWeight:active?600:400, fontSize:'var(--fs-md)', transition:'all var(--ease-fast)' }}>
              {opt}
            </button>
          )
        })}
      </div>
    )

  if (type==='checklist') {
    const selected = Array.isArray(value) ? value : []
    const toggle = opt => {
      const next = selected.includes(opt) ? selected.filter(s=>s!==opt) : [...selected, opt]
      onChange(next)
    }
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-1)' }}>
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={()=>toggle(opt)}
              style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-sm)', border:`1px solid ${checked?'var(--navy)':'var(--border-l)'}`, background:checked?'rgba(4,36,92,0.06)':'var(--surface)', textAlign:'left', transition:'all var(--ease-fast)' }}>
              {checked ? <CheckSquare size={16} style={{ color:'var(--navy)', flexShrink:0 }} /> : <Square size={16} style={{ color:'var(--text-3)', flexShrink:0 }} />}
              <span style={{ fontSize:'var(--fs-md)', color:checked?'var(--text-1)':'var(--text-2)' }}>{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (type==='signature') return <SigPad value={value} onChange={onChange} />
  if (type==='photo')     return <PhotoField value={value} onChange={onChange} />
  if (type==='gps')       return <GpsField value={value} onChange={onChange} />

  return <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={{ width:'100%' }} />
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ field, error }) {
  return (
    <div style={{ marginBottom:'var(--sp-1)' }}>
      <div style={{ fontSize:'var(--fs-sm)', fontWeight:600, color: error?'var(--red)':'var(--text-2)', marginBottom: field.hint?'0.125rem':0 }}>
        {field.label}
        {field.required && <span style={{ color:'var(--red)', marginLeft:'var(--sp-1)' }}>*</span>}
      </div>
      {field.hint && <div style={{ fontSize:'var(--fs-xs)', color:'var(--text-3)', lineHeight:1.4 }}>{field.hint}</div>}
      {error        && <div style={{ fontSize:'var(--fs-xs)', color:'var(--red)',   marginTop:'0.125rem' }}>{error}</div>}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ section, values, onChange, errors, readOnly, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ background:'var(--surface-raised)', borderRadius:'var(--r-xl)', marginBottom:'var(--sp-3)', overflow:'hidden' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', padding:'var(--sp-3) var(--sp-4)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--navy)' }}>
        <span style={{ fontSize:'var(--fs-md)', fontWeight:700, color:'#fff' }}>{section.title}</span>
        <CaretDown size={14} style={{ color:'rgba(255,255,255,0.7)', transform:open?'rotate(180deg)':'none', transition:'transform var(--ease-base)' }} />
      </button>
      {open && (
        <div style={{ padding:'var(--sp-4)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
          {section.fields.map(field => (
            <div key={field.id}>
              <FieldLabel field={field} error={errors?.[field.id]} />
              <FormField
                field={field}
                value={values[field.id]}
                onChange={val=>onChange(field.id, val)}
                error={errors?.[field.id]}
                readOnly={readOnly}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function validateSchema(schema, values) {
  const errors = {}
  for (const section of schema.sections || []) {
    for (const field of section.fields || []) {
      if (!field.required) continue
      const val = values[field.id]
      const empty =
        val === undefined || val === null || val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (field.type==='boolean' && val !== true && val !== false)
      if (empty) errors[field.id] = 'Required'
    }
  }
  return errors
}

// ─── Main FormEngine Export ───────────────────────────────────────────────────
export default function FormEngine({ schema, values = {}, onChange, errors = {}, readOnly = false }) {
  if (!schema || !schema.sections?.length) {
    return <div style={{ padding:'var(--sp-8)', textAlign:'center', color:'var(--text-3)' }}>No form schema loaded.</div>
  }

  return (
    <div>
      {schema.sections.map((section, i) => (
        <Section
          key={section.title + i}
          section={section}
          values={values}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  )
}
