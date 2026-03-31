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
  Microphone, Stop, Play, Pause, ArrowCounterClockwise,
  PencilSimple, CheckCircle, X } from '@phosphor-icons/react'
import RepeaterField from './RepeaterField.jsx'

// ─── Signature Modal ──────────────────────────────────────────────────────────
function SignatureModal({ onSave, onClose }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const hasMark   = useRef(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  // Size canvas to fill modal on mount and resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      // Save existing drawing
      const data = canvas.toDataURL()
      const img  = new Image()
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = data
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = e => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const p   = getPos(e, canvasRef.current)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  const move = e => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const p      = getPos(e, canvas)
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = 'var(--text-primary)'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    hasMark.current = true
  }

  const end = e => {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    if (hasMark.current) setHasStrokes(true)
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasMark.current = false
    setHasStrokes(false)
  }

  const save = () => {
    if (!hasMark.current) return
    const sig = canvasRef.current.toDataURL('image/png')
    onSave({ sig, signedAt: new Date().toISOString() })
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300 }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset:0, zIndex:301,
        display: 'flex', flexDirection:'column',
        background: '#fff' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--space-l)', borderBottom:'1px solid var(--border-default)', background:'var(--brand-primary)' }}>
          <span style={{ fontSize:'var(--text-md)', fontWeight:700, color:'#fff' }}>Sign Here</span>
          <button type="button" onClick={onClose} style={{ color: 'var(--surface-base)', padding:'var(--space-xs)' }}>
            <X size="1.25rem" />
          </button>
        </div>

        {/* Canvas area */}
        <div style={{ flex:1, position:'relative', background:'var(--surface-base)' }}>
          {/* Baseline guide */}
          <div style={{ position:'absolute', left:'5%', right:'5%', bottom:'35%', height:1, background:'rgba(0,0,0,0.1)', pointerEvents:'none' }} />
          {/* Placeholder text */}
          {!hasStrokes && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:'var(--text-lg)', color:'rgba(0,0,0,0.15)', fontStyle:'italic', userSelect:'none' }}>Sign above the line</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            style={{ width:'100%', height:'100%', cursor:'crosshair', touchAction:'none', display:'block' }}
          />
        </div>

        {/* Footer actions */}
        <div style={{ display:'flex', gap:'var(--space-m)', padding: 'var(--space-l)', marginTop:'var(--space-l)', background:'var(--surface-base)' }}>
          <button type="button" onClick={clear}
            style={{ display:'flex', alignItems:'center', gap:'var(--space-xs)', padding: 'var(--space-s) var(--space-l)', borderRadius:'var(--radius-m)', fontSize:'var(--text-sm)', color:'var(--text-primary)', background: 'var(--surface-base)' }}>
            <ArrowCounterClockwise size="0.875rem"/> Clear
          </button>
          <button type="button" onClick={save} disabled={!hasStrokes}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-s)', padding: 'var(--space-m)', borderRadius:'var(--radius-m)', background: hasStrokes ? 'var(--brand-primary)' : 'var(--surface-hover)', color: hasStrokes ? '#fff' : 'var(--text-muted)', fontSize:'var(--text-md)', fontWeight:600, transition:'all var(--ease-fast)' }}>
            <CheckCircle size="1rem" weight={hasStrokes ? 'fill' : 'regular'}/> Confirm Signature
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Signature Pad ────────────────────────────────────────────────────────────
export function SigPad({ value, onChange, readOnly }) {
  const [modalOpen, setModalOpen] = useState(false)

  // value shape: { sig: base64, signedAt: ISO } or null
  // Legacy: plain base64 string also handled
  const sigData   = value && typeof value === 'object' ? value : value ? { sig: value, signedAt: null } : null
  const hasSig    = !!sigData?.sig
  const signedAt  = sigData?.signedAt ? new Date(sigData.signedAt) : null
  const fmtDate   = signedAt
    ? signedAt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : null

  if (readOnly) {
    if (!hasSig) return <div style={{ height:'2rem', color:'var(--text-muted)', fontSize:'var(--text-sm)', fontStyle:'italic' }}>No signature</div>
    return (
      <div>
        <img src={sigData.sig} alt="Signature" style={{ width:'100%', maxHeight:'5rem', objectFit:'contain', borderRadius:'var(--radius-s)', background: 'var(--surface-base)' }} />
        {fmtDate && <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:'var(--space-xs)' }}>Signed {fmtDate}</div>}
      </div>
    )
  }

  return (
    <>
      {hasSig ? (
        /* Signed state */
        <div style={{ borderRadius:'var(--radius-m)', overflow:'hidden' }}>
          <div style={{ padding: 'var(--space-s) var(--space-m)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface-base)', borderBottom:'1px solid var(--border-default)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-s)' }}>
              <CheckCircle size="0.875rem" weight="fill" style={{ color:'var(--state-success)', flexShrink:0 }} />
              <span style={{ fontSize:'var(--text-xs)', color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>
                {fmtDate ? `Signed ${fmtDate}` : 'Signed'}
              </span>
            </div>
            <div style={{ display:'flex', gap:'var(--space-s)' }}>
              <button type="button" onClick={() => setModalOpen(true)}
                style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                <PencilSimple size="0.75rem"/> Re-sign
              </button>
              <button type="button" onClick={() => onChange(null)}
                style={{ fontSize:'var(--text-xs)', color:'var(--state-error)', display:'flex', alignItems:'center', gap:4 }}>
                <Trash size="0.75rem"/> Clear
              </button>
            </div>
          </div>
          <div style={{ padding: 'var(--space-s)', background:'#fff' }}>
            <img src={sigData.sig} alt="Signature" style={{ width:'100%', maxHeight:'4rem', objectFit:'contain', display:'block' }} />
          </div>
        </div>
      ) : (
        /* Unsigned state */
        <button type="button" onClick={() => setModalOpen(true)}
          style={{ width:'100%', padding:'var(--space-l)', borderRadius:'var(--radius-m)', border:'2px dashed var(--border-default)', background:'var(--surface-base)', display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-s)', color:'var(--text-muted)', fontSize:'var(--text-sm)', transition:'all var(--ease-fast)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--brand-primary)'; e.currentTarget.style.color='var(--brand-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.color='var(--text-muted)' }}
        >
          <PencilSimple size="1rem"/> Tap to Sign
        </button>
      )}

      {modalOpen && (
        <SignatureModal
          onSave={val => { onChange(val); setModalOpen(false) }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
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

  if (readOnly) return <span style={{ fontFamily:'var(--font-mono)', fontSize:'var(--text-sm)' }}>{value || '—'}</span>

  return (
    <div style={{ display:'flex', gap:'var(--space-s)', alignItems:'center' }}>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="lat, lng" style={{ flex:1 }} />
      <button type="button" onClick={capture} disabled={loading}
        style={{ display:'flex', alignItems:'center', gap:'var(--space-xs)', padding: 'var(--space-s) var(--space-m)', borderRadius:'var(--radius-s)', background:'var(--brand-primary)', color:'#fff', fontSize:'var(--text-xs)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap', opacity: loading?0.6:1 }}>
        <MapPin size="0.75rem" /> {loading ? 'Getting…' : 'Get GPS'}
      </button>
      {error && <span style={{ color:'var(--state-error)', fontSize:'var(--text-xs)' }}>{error}</span>}
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
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-s)', marginBottom: photos.length?'var(--space-s)':0 }}>
        {photos.map((src,i) => (
          <div key={i} style={{ position:'relative', width:'5rem', height:'5rem' }}>
            <img src={src} alt={`Photo ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius-m)' }} />
            {!readOnly && (
              <button type="button" onClick={()=>remove(i)}
                style={{ position:'absolute', top:'-0.375rem', right:'-0.375rem', width:'1.25rem', height:'1.25rem', borderRadius:'var(--radius-l)', background:'var(--state-error)', color:'#fff', fontSize:'var(--text-2xs)', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handleFiles} style={{ display:'none' }} />
          <button type="button" onClick={()=>fileRef.current.click()}
            style={{ display:'flex', alignItems:'center', gap:'var(--space-s)', padding: 'var(--space-s) var(--space-m)', borderRadius:'var(--radius-s)', background: 'var(--surface-base)', fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>
            <Camera size="0.875rem" /> Add Photo
          </button>
        </>
      )}
    </div>
  )
}

// ─── Voice Note Field ─────────────────────────────────────────────────────────
function VoiceNoteField({ value, onChange, readOnly }) {
  const [state,    setState]    = useState('idle')   // idle | recording | playing
  const [duration, setDuration] = useState(0)
  const [elapsed,  setElapsed]  = useState(0)
  const [error,    setError]    = useState(null)

  const mediaRecorder = useRef(null)
  const chunks        = useRef([])
  const timerRef      = useRef(null)
  const audioRef      = useRef(null)
  const MAX_SECS      = 30

  // Clean up on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current)
    mediaRecorder.current?.stream?.getTracks().forEach(t => t.stop())
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' })
      chunks.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType })
        const reader = new FileReader()
        reader.onload = () => onChange({ audio: reader.result, duration: elapsed, mimeType: mr.mimeType })
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        setState('idle')
      }
      mr.start(100)
      mediaRecorder.current = mr
      setElapsed(0)
      setState('recording')
      timerRef.current = setInterval(() => {
        setElapsed(s => {
          if (s + 1 >= MAX_SECS) { mr.stop(); return s + 1 }
          return s + 1
        })
      }, 1000)
    } catch (err) {
      setError('Microphone access denied. Check your browser permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') mediaRecorder.current.stop()
    clearInterval(timerRef.current)
  }

  const playPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (state === 'playing') {
      audio.pause()
      setState('idle')
    } else {
      audio.play()
      setState('playing')
      audio.onended = () => { setState('idle'); setElapsed(0) }
      audio.ontimeupdate = () => setElapsed(Math.floor(audio.currentTime))
    }
  }

  const discard = () => {
    clearInterval(timerRef.current)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    onChange(null)
    setElapsed(0)
    setDuration(0)
    setState('idle')
  }

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  // Read-only playback
  if (readOnly) {
    if (!value?.audio) return <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>No recording</span>
    return (
      <audio controls src={value.audio} style={{ width:'100%', height:'2.5rem' }} />
    )
  }

  const hasRecording = !!value?.audio
  const progress = hasRecording ? (elapsed / (value?.duration || 1)) * 100 : (elapsed / MAX_SECS) * 100

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-s)' }}>
      {error && <div style={{ fontSize:'var(--text-xs)', color:'var(--state-error)', padding:'var(--space-s) var(--space-m)', background:'var(--red-soft)', borderRadius:'var(--radius-s)' }}>{error}</div>}

      {/* Hidden audio element for playback */}
      {hasRecording && <audio ref={audioRef} src={value.audio} preload="auto" style={{ display:'none' }} />}

      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-m)', padding: 'var(--space-m)', background: 'var(--surface-base)', borderRadius:'var(--radius-m)' }}>

        {/* Main action button */}
        {state === 'recording' ? (
          <button type="button" onClick={stopRecording}
            style={{ width:'2.5rem', height:'2.5rem', borderRadius:'var(--radius-l)', background:'var(--state-error)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animation:'pulse 1s ease-in-out infinite' }}>
            <Stop size="1rem" weight="fill" />
          </button>
        ) : hasRecording ? (
          <button type="button" onClick={playPause}
            style={{ width:'2.5rem', height:'2.5rem', borderRadius:'var(--radius-l)', background:'var(--brand-primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {state === 'playing' ? <Pause size="1rem" weight="fill" /> : <Play size="1rem" weight="fill" />}
          </button>
        ) : (
          <button type="button" onClick={startRecording}
            style={{ width:'2.5rem', height:'2.5rem', borderRadius:'var(--radius-l)', background:'var(--state-error)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Microphone size="1rem" weight="fill" />
          </button>
        )}

        {/* Progress / waveform bar + timer */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ height:'0.375rem', background:'var(--border-subtle)', borderRadius: 'var(--radius-s)', overflow:'hidden', marginBottom:'var(--space-xs)' }}>
            <div style={{ height:'100%', width:`${Math.min(progress,100)}%`, background: state==='recording'?'var(--state-error)':'var(--brand-primary)', borderRadius: 'var(--radius-s)', transition: state==='recording'?'width 1s linear':'width 0.1s linear' }} />
          </div>
          <div style={{ fontSize:'var(--text-xs)', fontFamily:'var(--font-mono)', color:'var(--text-muted)', display:'flex', justifyContent:'space-between' }}>
            <span style={{ color: state==='recording'?'var(--state-error)':'var(--text-muted)' }}>
              {state === 'recording' ? `● ${fmt(elapsed)}` : hasRecording ? fmt(elapsed) : 'Tap mic to record'}
            </span>
            {state === 'recording' && <span>{fmt(MAX_SECS - elapsed)} left</span>}
            {hasRecording && state !== 'recording' && <span>{fmt(value.duration || 0)}</span>}
          </div>
        </div>

        {/* Discard / re-record */}
        {hasRecording && state !== 'recording' && (
          <button type="button" onClick={discard} title="Discard and re-record"
            style={{ color:'var(--text-muted)', padding:'var(--space-xs)', flexShrink:0 }}>
            <ArrowCounterClockwise size="1rem" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Single Field Renderer ────────────────────────────────────────────────────
export function FormField({ field, value, onChange, error, readOnly }) {
  const { type, options = [], hint } = field

  if (readOnly) {
    let display = value ?? '—'
    if (type==='boolean') display = value===true?'Yes':value===false?'No':'—'
    if (type==='checklist'||type==='checkbox-group') display = Array.isArray(value)?value.join(', ')||'—':'—'
    if (type==='pass-fail')    display = value?.result ? value.result.toUpperCase() + (value.comments?` — ${value.comments}`:'') : '—'
    if (type==='ok-notok-na')  display = value?.result ? value.result.toUpperCase() + (value.explanation?` — ${value.explanation}`:'') : '—'
    if (type==='activity-row') display = value?.activity || '—'
    if (type==='personnel-sig') display = value?.name ? `${value.name}${value.signed?' ✓':''}` : '—'
    if (type==='signature') return <SigPad value={value} readOnly />
    if (type==='photo')     return <PhotoField value={value} readOnly />
    if (type==='gps')       return <GpsField value={value} readOnly />
    if (type==='voice-note') return <VoiceNoteField value={value} readOnly />
    return <span style={{ fontSize:'var(--text-md)', color:'var(--text-primary)' }}>{display}</span>
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

  // ── pass-fail (Fall Protection style) ───────────────────────────────────────
  if (type==='pass-fail') {
    const pf = value && typeof value==='object' ? value : { result:null, comments:'' }
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-s)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'var(--space-xs)', flexShrink:0 }}>
          {[['pass','Pass','var(--state-success)'],['fail','Fail','var(--state-error)']].map(([k,lbl,col]) => (
            <button key={k} type="button" onClick={()=>onChange({...pf, result: pf.result===k?null:k})}
              style={{ padding: 'var(--space-xs) var(--space-m)', borderRadius:'var(--radius-s)', fontSize:'var(--text-sm)', fontWeight:600,
                background: pf.result===k?col:'var(--surface-base)',
                color: pf.result===k?'#fff':'var(--text-primary)', transition:'all var(--ease-fast)' }}>
              {lbl}
            </button>
          ))}
        </div>
        <input value={pf.comments||''} onChange={e=>onChange({...pf,comments:e.target.value})}
          placeholder="Comments" style={{ flex:1, minWidth:'8rem' }} />
      </div>
    )
  }

  // ── ok-notok-na (Manlift style) ──────────────────────────────────────────────
  if (type==='ok-notok-na') {
    const okv = value && typeof value==='object' ? value : { result:null, explanation:'' }
    const cfg = [['ok','OK','var(--state-success)'],['notok','Not OK','var(--state-error)'],['na','N/A','var(--text-muted)']]
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-s)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'var(--space-xs)', flexShrink:0 }}>
          {cfg.map(([k,lbl,col]) => (
            <button key={k} type="button" onClick={()=>onChange({...okv, result: okv.result===k?null:k})}
              style={{ padding: 'var(--space-xs) var(--space-m)', borderRadius:'var(--radius-s)', fontSize:'var(--text-sm)', fontWeight:600,
                background: okv.result===k?col:'var(--surface-base)',
                color: okv.result===k?(k==='na'?'var(--text-primary)':'#fff'):'var(--text-primary)',
                transition:'all var(--ease-fast)' }}>
              {lbl}
            </button>
          ))}
        </div>
        {okv.result==='notok' && (
          <input value={okv.explanation||''} onChange={e=>onChange({...okv,explanation:e.target.value})}
            placeholder="Explanation required" style={{ flex:1, minWidth:'8rem', borderColor:'var(--state-error)' }} />
        )}
      </div>
    )
  }

  // ── checkbox-group (JSA style) ───────────────────────────────────────────────
  if (type==='checkbox-group') {
    const selected = Array.isArray(value) ? value : []
    const toggle = opt => onChange(selected.includes(opt) ? selected.filter(x=>x!==opt) : [...selected,opt])
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,14rem),1fr))', gap:'var(--space-xs)' }}>
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={()=>toggle(opt)}
              style={{ display:'flex', alignItems:'center', gap:'var(--space-s)', padding: 'var(--space-s) var(--space-m)',
                borderRadius:'var(--radius-s)',
                background: checked?'rgba(4,36,92,0.07)':'var(--surface-base)', textAlign:'left', transition:'all var(--ease-fast)' }}>
              <span style={{ width:'1rem', height:'1rem', borderRadius: 'var(--radius-xs)', border:`2px solid ${checked?'var(--brand-primary)':'var(--border-subtle)'}`,
                background: checked?'var(--brand-primary)':'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, fontSize:'var(--text-2xs)', color:'#fff', fontWeight:700 }}>{checked?'✓':''}</span>
              <span style={{ fontSize:'var(--text-sm)', color:checked?'var(--text-primary)':'var(--text-primary)' }}>{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // ── activity-row (JSA activities table) ─────────────────────────────────────
  if (type==='activity-row') {
    const row = value && typeof value==='object' ? value : { activity:'', hazards:'', controls:'', responsibility:'' }
    const setF = (k,v) => onChange({...row,[k]:v})
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,10rem),1fr))', gap:'var(--space-s)' }}>
        <input value={row.activity||''}      onChange={e=>setF('activity',e.target.value)}      placeholder="Activity / Task"  style={{ width:'100%' }} />
        <input value={row.hazards||''}       onChange={e=>setF('hazards',e.target.value)}        placeholder="Hazards"          style={{ width:'100%' }} />
        <input value={row.controls||''}      onChange={e=>setF('controls',e.target.value)}       placeholder="Risk Controls"    style={{ width:'100%' }} />
        <input value={row.responsibility||''} onChange={e=>setF('responsibility',e.target.value)} placeholder="Responsibility"   style={{ width:'100%' }} />
      </div>
    )
  }

  // ── personnel-sig (JSA sign-off rows) ───────────────────────────────────────
  if (type==='personnel-sig') {
    const p = value && typeof value==='object' ? value : { name:'', function:'', signed:false }
    const setP = (k,v) => onChange({...p,[k]:v})
    return (
      <div style={{ display:'flex', gap:'var(--space-s)', alignItems:'center' }}>
        <input value={p.name||''}     onChange={e=>setP('name',e.target.value)}     placeholder="Name"          style={{ flex:2 }} />
        <input value={p.function||''} onChange={e=>setP('function',e.target.value)} placeholder="Function/Role" style={{ flex:2 }} />
        <button type="button" onClick={()=>setP('signed',!p.signed)}
          style={{ flexShrink:0, padding:'var(--space-s) var(--space-m)', borderRadius:'var(--radius-s)', fontSize:'var(--text-sm)', fontWeight:600,
            background: p.signed?'var(--state-success)':'var(--surface-base)',
            color: p.signed?'#fff':'var(--text-primary)', transition:'all var(--ease-fast)', whiteSpace:'nowrap' }}>
          {p.signed ? '✓ Signed' : 'Sign'}
        </button>
      </div>
    )
  }

  if (type==='boolean')
    return (
      <div style={{ display:'flex', gap:'var(--space-s)' }}>
        {['Yes','No'].map(opt => {
          const active = opt==='Yes'?value===true:value===false
          return (
            <button key={opt} type="button" onClick={()=>onChange(opt==='Yes')}
              style={{ flex:1, padding:'var(--space-s)', borderRadius:'var(--radius-s)', background:active?'var(--brand-primary)':'var(--surface-base)', color:active?'#fff':'var(--text-primary)', fontWeight:active?600:400, transition:'all var(--ease-fast)', fontSize:'var(--text-md)' }}>
              {opt}
            </button>
          )
        })}
      </div>
    )

  if (type==='radio')
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-s)' }}>
        {options.map(opt => {
          const active = value===opt
          return (
            <button key={opt} type="button" onClick={()=>onChange(opt)}
              style={{ padding: 'var(--space-s) var(--space-l)', borderRadius:'var(--radius-l)', background:active?'var(--brand-primary)':'var(--surface-base)', color:active?'#fff':'var(--text-primary)', fontWeight:active?600:400, fontSize:'var(--text-md)', transition:'all var(--ease-fast)' }}>
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
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-xs)' }}>
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={()=>toggle(opt)}
              style={{ display:'flex', alignItems:'center', gap:'var(--space-s)', padding: 'var(--space-s) var(--space-m)', borderRadius:'var(--radius-s)', background:checked?'rgba(4,36,92,0.06)':'var(--surface-base)', textAlign:'left', transition:'all var(--ease-fast)' }}>
              {checked ? <CheckSquare size="1rem" style={{ color:'var(--brand-primary)', flexShrink:0 }} /> : <Square size="1rem" style={{ color:'var(--text-muted)', flexShrink:0 }} />}
              <span style={{ fontSize:'var(--text-md)', color:checked?'var(--text-primary)':'var(--text-primary)' }}>{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (type==='signature') return <SigPad value={value} onChange={onChange} />
  if (type==='photo')     return <PhotoField value={value} onChange={onChange} />
  if (type==='gps')       return <GpsField value={value} onChange={onChange} />
  if (type==='voice-note') return <VoiceNoteField value={value} onChange={onChange} />
  if (type==='repeater' || type==='activity-row')
    return <RepeaterField field={field} value={value} onChange={onChange} error={error} />

  return <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={{ width:'100%' }} />
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--space-xs)' }}>
      <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color: error?'var(--state-error)':'var(--text-primary)', marginBottom: field.hint?'0.125rem':0 }}>
        {field.label}
        {field.required && <span style={{ color:'var(--state-error)', marginLeft:'var(--space-xs)' }}>*</span>}
      </div>
      {field.hint && <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', lineHeight:1.4 }}>{field.hint}</div>}
      {error        && <div style={{ fontSize:'var(--text-xs)', color:'var(--state-error)',   marginTop:'0.125rem' }}>{error}</div>}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ section, values, onChange, errors, readOnly, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ background:'var(--surface-base)', borderRadius:'var(--radius-l)', marginBottom:'var(--space-m)', overflow:'hidden' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', padding:'var(--space-m) var(--space-l)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--brand-primary)' }}>
        <span style={{ fontSize:'var(--text-md)', fontWeight:700, color:'#fff' }}>{section.title}</span>
        <CaretDown size="0.875rem" style={{ color: 'var(--surface-base)', transform:open?'rotate(180deg)':'none', transition:'transform var(--ease-base)' }} />
      </button>
      {open && (
        <div style={{ padding: 'var(--space-l)', display:'flex', flexDirection:'column', gap:'var(--space-l)' }}>
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
        (field.type==='boolean' && val !== true && val !== false) ||
        (field.type==='signature' && !val?.sig && !val)
      if (empty) errors[field.id] = 'Required'
    }
  }
  return errors
}

// ─── Main FormEngine Export ───────────────────────────────────────────────────
export default function FormEngine({ schema, values = {}, onChange, errors = {}, readOnly = false }) {
  if (!schema || !schema.sections?.length) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign:'center', color:'var(--text-muted)' }}>No form schema loaded.</div>
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
