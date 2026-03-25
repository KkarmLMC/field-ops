import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Lightning, MagnifyingGlass, Ruler, ClipboardText,
  Plus, CheckCircle, CaretRight, Eye, ArrowLeft,
  Trash, SpinnerGap, CaretDown, X,
} from '@phosphor-icons/react'
import { jsPDF } from 'jspdf'
import { db } from '../lib/supabase.js'
import { JOBS, TECHNICIANS } from '../data/mockData.js'
import BranchTabs from '../components/BranchTabs'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Form type config ──────────────────────────────────────────────────────────
export const COMPLETION_TYPES = {
  'installation': {
    label:    'Installation Completion',
    short:    'Installation',
    icon:     Lightning,
    color:    'var(--accent)',
    colorDim: 'var(--accent-glow)',
    desc:     'Final sign-off on completed LPS installation',
    ref:      'NFPA 780 / UL 96A',
    fields:   [
      { id: 'lps_class',       label: 'LPS Class',                   type: 'select', options: ['Class I', 'Class II'], required: true },
      { id: 'air_terminals',   label: 'Air Terminals Installed',      type: 'number', required: true },
      { id: 'down_conductors', label: 'Down Conductors Installed',    type: 'number', required: true },
      { id: 'ground_rods',     label: 'Ground Rods Installed',        type: 'number', required: true },
      { id: 'bonding_complete',label: 'Bonding Complete',             type: 'boolean', required: true },
      { id: 'ul_label',        label: 'UL Master Label Applied',      type: 'boolean' },
      { id: 'resistance_ohms', label: 'Ground Resistance (ohms)',     type: 'number' },
    ],
  },
  'inspection': {
    label:    'Inspection Completion',
    short:    'Inspection',
    icon:     MagnifyingGlass,
    color:    'var(--blue)',
    colorDim: 'var(--blue-dim)',
    desc:     'Post-inspection findings and compliance status',
    ref:      'LPI-175 / LPI-177',
    fields:   [
      { id: 'inspection_type', label: 'Inspection Type',              type: 'select', options: ['Annual', 'Bi-Annual', 'Post-Strike', 'Pre-Certification'], required: true },
      { id: 'system_class',    label: 'System Class',                 type: 'select', options: ['Class I', 'Class II'] },
      { id: 'overall_result',  label: 'Overall Result',               type: 'select', options: ['Pass', 'Pass with Conditions', 'Fail'], required: true },
      { id: 'deficiencies',    label: 'Deficiencies Found',           type: 'textarea' },
      { id: 'corrective_req',  label: 'Corrective Action Required',   type: 'boolean' },
      { id: 'next_inspection', label: 'Next Inspection Due',          type: 'date' },
    ],
  },
  'site-survey': {
    label:    'Site Survey Completion',
    short:    'Site Survey',
    icon:     Ruler,
    color:    'var(--green)',
    colorDim: 'var(--green-dim)',
    desc:     'Site survey findings and LPS recommendations',
    ref:      'NFPA 780 Annex L',
    fields:   [
      { id: 'structure_type',  label: 'Structure Type',               type: 'select', options: ['Commercial', 'Industrial', 'Healthcare', 'Educational', 'Residential', 'Utility', 'Other'], required: true },
      { id: 'height_ft',       label: 'Structure Height (ft)',         type: 'number', required: true },
      { id: 'lps_recommended', label: 'LPS Recommended',              type: 'boolean', required: true },
      { id: 'risk_ratio',      label: 'Nd/Nc Risk Ratio',             type: 'number' },
      { id: 'estimated_cost',  label: 'Estimated Install Cost ($)',    type: 'number' },
      { id: 'proposal_ready',  label: 'Proposal Ready to Send',       type: 'boolean' },
    ],
  },
  'annual-test': {
    label:    'Annual Test Completion',
    short:    'Annual Test',
    icon:     ClipboardText,
    color:    '#7C3AED',
    colorDim: 'rgba(124,58,237,0.15)',
    desc:     'Annual continuity and resistance test results',
    ref:      'NFPA 780 §4.18',
    fields:   [
      { id: 'test_method',     label: 'Test Method',                  type: 'select', options: ['Fall-of-Potential', 'Clamp-On', 'Stakeless'], required: true },
      { id: 'resistance_ohms', label: 'Ground Resistance (ohms)',     type: 'number', required: true },
      { id: 'resistance_pass', label: 'Resistance ≤ 10 ohms',         type: 'boolean', required: true },
      { id: 'continuity_pass', label: 'Continuity Test Passed',       type: 'boolean', required: true },
      { id: 'corrosion_found', label: 'Corrosion / Damage Found',     type: 'boolean' },
      { id: 'repairs_needed',  label: 'Repairs Recommended',          type: 'boolean' },
      { id: 'cert_issued',     label: 'Test Certificate Issued',      type: 'boolean' },
    ],
  },
}

// ─── Signature Pad ─────────────────────────────────────────────────────────────

function SigPad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image()
      img.onload = () => canvasRef.current?.getContext('2d')?.drawImage(img, 0, 0)
      img.src = value
    }
  }, [])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  const start = (e) => { e.preventDefault(); drawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const move  = (e) => { e.preventDefault(); if (!drawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#c8d4e0'; ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const end   = (e) => { e.preventDefault(); if (!drawing.current) return; drawing.current = false; onChange(canvasRef.current.toDataURL('image/png')) }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, 480, 80); onChange(null) }

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} width={480} height={80}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width:'100%', height:80, borderRadius:4, display:'block', border:'1px solid var(--border)', background:'var(--bg-3)', cursor:'crosshair', touchAction:'none' }}
      />
      {!value && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text-muted)', fontSize:12, pointerEvents:'none', fontFamily:'var(--mono)' }}>Sign here</div>}
      {value && <button type="button" onClick={clear} style={{ position:'absolute', top:4, right:4, background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:3, padding:'2px 6px', fontSize:10, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:3 }}><Trash size={10} /> Clear</button>}
    </div>
  )
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────
async function generateCompletionPdf(formType, formData, jobData) {
  const cfg  = COMPLETION_TYPES[formType]
  const doc  = new jsPDF({ unit:'pt', format:'letter' })
  const W=612, ML=40, CW=532
  const NAVY=[26,35,95], NAVY2=[42,55,120], NAVY_LT=[235,240,255]
  const WHITE=[255,255,255], BG=[248,249,252], BORDER=[218,222,232]
  const LABEL=[107,114,128], TEXT=[17,24,39]
  const GREEN=[22,163,74], GREEN_BG=[240,253,244], GREEN_BD=[134,239,172]
  let y = 0

  const checkPage = (n=28) => { if (y+n>750) { drawFooter(); doc.addPage(); y=40 } }
  const drawFooter = () => {
    const ph = doc.internal.pageSize.getHeight()
    doc.setFillColor(...BG); doc.rect(0,ph-34,W,34,'F')
    doc.setDrawColor(...BORDER); doc.line(0,ph-34,W,ph-34)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(`LMC Field Operations  ·  ${cfg.label}  ·  ${cfg.ref}`, ML, ph-14)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, W/2, ph-14, {align:'center'})
    doc.text(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), W-ML, ph-14, {align:'right'})
  }
  const sectionHead = (title) => {
    checkPage(28)
    doc.setFillColor(...NAVY); doc.rect(ML,y,3,18,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), ML+10, y+12)
    doc.setDrawColor(...NAVY_LT); doc.line(ML+10+doc.getTextWidth(title.toUpperCase())+6, y+8, ML+CW, y+8)
    y += 22
  }
  const fieldRow = (label, value, shade=false) => {
    const valStr = String(value ?? '—')
    const lines = doc.splitTextToSize(valStr, CW-140)
    const rowH = Math.max(20, lines.length*12+8)
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(lines, ML+140, y+13)
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y += rowH
  }
  const boolRow = (label, value, shade=false) => {
    const rowH = 20
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    const isTrue = value === true || value === 'true'
    const pillW = 40, pillX = ML+CW-pillW-6, pillY = y+(rowH-14)/2
    doc.setFillColor(...(isTrue ? GREEN_BG : [254,242,242]))
    doc.setDrawColor(...(isTrue ? GREEN_BD : [254,202,202]))
    doc.roundedRect(pillX, pillY, pillW, 14, 2, 2, 'FD')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5)
    doc.setTextColor(...(isTrue ? GREEN : [220,38,38]))
    doc.text(isTrue ? 'YES' : 'NO', pillX+pillW/2, pillY+9.5, {align:'center'})
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y += rowH
  }

  // Header
  doc.setFillColor(...NAVY); doc.rect(0,0,W,80,'F')
  doc.setFillColor(...NAVY2); doc.rect(W-160,0,160,80,'F')
  doc.setFillColor(59,130,246); doc.rect(0,80,W,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...WHITE)
  doc.text('LMC', ML, 36)
  doc.setDrawColor(80,100,160); doc.line(ML+42,12,ML+42,68)
  doc.setFontSize(11); doc.text('Field Operations', ML+52, 30)
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(170,185,220)
  doc.text(cfg.label, ML+52, 46)
  doc.text(cfg.ref, ML+52, 60)
  doc.setFillColor(...GREEN); doc.roundedRect(W-148,12,112,20,3,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('COMPLETED & SIGNED', W-92, 25, {align:'center'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(170,185,220)
  doc.text(new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}), W-ML, 50, {align:'right'})
  y = 84

  // Summary strip
  doc.setFillColor(...NAVY_LT); doc.rect(0,y,W,32,'F')
  doc.setDrawColor(...BORDER); doc.line(0,y+32,W,y+32)
  const cw4=W/4
  ;[
    {label:'SITE',       val: formData.site_name||jobData?.siteName||'—'},
    {label:'JOB #',      val: formData.job_number||jobData?.id||'—'},
    {label:'DATE',       val: formData.date_completed||'—'},
    {label:'TECHNICIAN', val: formData.tech_name||'—'},
  ].forEach(({label,val},i) => {
    const cx=i*cw4
    if (i>0) { doc.setDrawColor(...BORDER); doc.line(cx,y+4,cx,y+28) }
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...LABEL)
    doc.text(label, cx+cw4/2, y+11, {align:'center'})
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...NAVY)
    let v=val; while(doc.getTextWidth(v)>cw4-12&&v.length>4) v=v.slice(0,-2)+'…'
    doc.text(v, cx+cw4/2, y+24, {align:'center'})
  })
  y += 44

  // Job Info
  sectionHead('Job Information')
  fieldRow('Site Name',    formData.site_name||jobData?.siteName||'—')
  fieldRow('Address',      formData.site_address||jobData?.address||'—', true)
  fieldRow('Job Number',   formData.job_number||jobData?.id||'—')
  fieldRow('Technician',   formData.tech_name||'—', true)
  fieldRow('Date',         formData.date_completed||'—')
  y += 6

  // Type-specific fields
  sectionHead(`${cfg.short} Details`)
  cfg.fields.forEach((f, i) => {
    const val = formData[f.id]
    if (f.type === 'boolean') boolRow(f.label, val, i%2===1)
    else fieldRow(f.label, val ?? '—', i%2===1)
  })
  y += 6

  // Notes & punch list
  if (formData.notes) {
    sectionHead('Notes')
    fieldRow('Notes', formData.notes)
    y += 6
  }
  if (formData.punch_list?.length > 0) {
    sectionHead('Punch List')
    formData.punch_list.forEach((item, i) => {
      fieldRow(`Item ${i+1}`, item, i%2===1)
    })
    y += 6
  }

  // Signatures
  sectionHead('Sign-Off')
  ;[
    { role:'Supervisor', name: formData.supervisor_name, sig: formData.supervisor_sig },
    { role:'Customer',   name: formData.customer_name,   sig: formData.customer_sig   },
  ].forEach((person, n) => {
    if (!person.name) return
    const rowH = 56
    checkPage(rowH)
    if (n%2===1) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(person.name, ML+6, y+16)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(person.role, ML+6, y+28)
    if (person.sig?.startsWith('data:image')) {
      try { doc.addImage(person.sig, 'PNG', ML+200, y+6, 120, 38) } catch(e) {}
    }
    doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
    doc.roundedRect(ML+CW-80, y+18, 68, 16, 3, 3, 'FD')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREEN)
    doc.text('SIGNED', ML+CW-46, y+29, {align:'center'})
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y += rowH
  })

  drawFooter()

  // Upload
  const pdfBlob  = doc.output('blob')
  const date     = formData.date_completed || new Date().toISOString().slice(0,10)
  const slug     = (formData.site_name||'site').toLowerCase().replace(/\s+/g,'-').slice(0,20)
  const filePath = `completion-forms/${formType}_${date}_${slug}_${Date.now().toString(36)}.pdf`
  const { error } = await db.storage.from('field-log-pdfs').upload(filePath, pdfBlob, { contentType:'application/pdf', upsert:true })
  if (error) throw error
  const { data: urlData } = db.storage.from('field-log-pdfs').getPublicUrl(filePath)
  return urlData.publicUrl
}

// ─── Field renderer ────────────────────────────────────────────────────────────
function FormField({ field, value, onChange }) {
  const base = { width:'100%', fontSize:13 }

  if (field.type === 'select') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)} style={base}>
      <option value="">Select…</option>
      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  if (field.type === 'boolean') return (
    <div style={{ display:'flex', gap:8 }}>
      {['Yes','No'].map(opt => {
        const isOpt = opt==='Yes' ? value===true : value===false
        return (
          <button key={opt} type="button" onClick={()=>onChange(opt==='Yes')}
            style={{ flex:1, padding:'8px', borderRadius:4, fontSize:13, border:`1px solid ${isOpt?'var(--accent)':'var(--border)'}`, background:isOpt?'var(--accent-glow)':'var(--bg-3)', color:isOpt?'var(--accent)':'var(--text-dim)', fontWeight:isOpt?600:400 }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
  if (field.type === 'textarea') return (
    <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3}
      style={{ ...base, resize:'vertical', lineHeight:1.5, padding:'8px 12px' }} />
  )
  if (field.type === 'date') return (
    <input type="date" value={value||''} onChange={e=>onChange(e.target.value)} style={base} />
  )
  if (field.type === 'number') return (
    <input type="number" step="any" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="0" style={base} />
  )
  return <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base} />
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children, open, onToggle }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:6, marginBottom:10, overflow:'hidden' }}>
      <button type="button" onClick={onToggle} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:open?'1px solid var(--border)':'none' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</span>
        <CaretDown size={12} style={{ color:'var(--text-dim)', transform:open?'rotate(180deg)':'none', transition:'transform 0.15s' }} />
      </button>
      {open && <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>{children}</div>}
    </div>
  )
}

function FieldLabel({ label, required }) {
  return (
    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
      {label}{required && <span style={{ color:'var(--red)', marginLeft:3 }}>*</span>}
    </div>
  )
}

// ─── Completion Form ───────────────────────────────────────────────────────────
function CompletionFormView({ formType, jobId, onSave, onCancel }) {
  const cfg  = COMPLETION_TYPES[formType]
  const job  = jobId ? JOBS.find(j=>j.id===jobId) : null
  const tech = job ? TECHNICIANS.find(t=>t.id===job.assignedTo) : null

  const [values, setValues] = useState({
    site_name:      job?.siteName || '',
    site_address:   job?.address  || '',
    job_number:     job?.id       || '',
    tech_name:      tech?.name    || '',
    date_completed: new Date().toISOString().slice(0,10),
    branch:         job?.branch   || 'lm',
  })
  const [open,       setOpen]       = useState({ job:true, details:true, notes:true, signoff:true })
  const [punchItems, setPunchItems] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  const set = (k,v) => setValues(f=>({...f,[k]:v}))
  const toggle = (k) => setOpen(o=>({...o,[k]:!o[k]}))

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    const payload = { ...values, punch_list: punchItems.filter(Boolean) }
    try {
      const pdfUrl = await generateCompletionPdf(formType, payload, job)
      await db.from('completion_forms').insert({
        form_type:      formType,
        branch:         values.branch || job?.branch || 'lm',
        job_id:         jobId || null,
        site_name:      values.site_name,
        site_address:   values.site_address,
        job_number:     values.job_number,
        tech_name:      values.tech_name,
        date_completed: values.date_completed,
        notes:          values.notes,
        punch_list:     punchItems.filter(Boolean),
        form_data:      payload,
        supervisor_name:values.supervisor_name,
        supervisor_sig: values.supervisor_sig,
        customer_name:  values.customer_name,
        customer_sig:   values.customer_sig,
        status:         'submitted',
        pdf_url:        pdfUrl,
      })
      onSave({ pdfUrl, siteName: values.site_name, formType })
    } catch(err) {
      setError('PDF upload failed. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  const Icon = cfg.icon

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-dim)', fontSize:13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width:1, height:16, background:'var(--border)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Icon size={14} style={{ color: cfg.color }} />
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{cfg.ref}</span>
        </div>
      </div>

      {/* Job info section */}
      <Section title="Job Information" open={open.job} onToggle={()=>toggle('job')}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Site Name" required />
            <input value={values.site_name||''} onChange={e=>set('site_name',e.target.value)} placeholder="Site name" style={{ width:'100%', fontSize:13 }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Address" />
            <input value={values.site_address||''} onChange={e=>set('site_address',e.target.value)} placeholder="Street address" style={{ width:'100%', fontSize:13 }} />
          </div>
          <div>
            <FieldLabel label="Job Number" />
            <input value={values.job_number||''} onChange={e=>set('job_number',e.target.value)} placeholder="JOB-2026-XXXX" style={{ width:'100%', fontSize:13 }} />
          </div>
          <div>
            <FieldLabel label="Date Completed" required />
            <input type="date" value={values.date_completed||''} onChange={e=>set('date_completed',e.target.value)} style={{ width:'100%', fontSize:13 }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Assigned Technician" required />
            <input value={values.tech_name||''} onChange={e=>set('tech_name',e.target.value)} placeholder="Technician name" style={{ width:'100%', fontSize:13 }} />
          </div>
        </div>
      </Section>

      {/* Type-specific fields */}
      <Section title={`${cfg.short} Details`} open={open.details} onToggle={()=>toggle('details')}>
        {cfg.fields.map(field => (
          <div key={field.id}>
            <FieldLabel label={field.label} required={field.required} />
            <FormField field={field} value={values[field.id]} onChange={v=>set(field.id,v)} />
          </div>
        ))}
      </Section>

      {/* Notes + punch list */}
      <Section title="Notes & Punch List" open={open.notes} onToggle={()=>toggle('notes')}>
        <div>
          <FieldLabel label="Notes" />
          <textarea value={values.notes||''} onChange={e=>set('notes',e.target.value)} rows={3}
            placeholder="Any additional notes, observations, or follow-up items…"
            style={{ width:'100%', fontSize:13, resize:'vertical', lineHeight:1.5, padding:'8px 12px' }} />
        </div>
        <div>
          <FieldLabel label="Punch List Items" />
          {punchItems.map((item, i) => (
            <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
              <input value={item} onChange={e=>{ const n=[...punchItems]; n[i]=e.target.value; setPunchItems(n) }}
                placeholder={`Item ${i+1}`} style={{ flex:1, fontSize:13 }} />
              {punchItems.length > 1 && (
                <button type="button" onClick={()=>setPunchItems(p=>p.filter((_,j)=>j!==i))}
                  style={{ color:'var(--text-dim)', padding:'0 8px' }}><X size={13} /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={()=>setPunchItems(p=>[...p,''])}
            style={{ fontSize:12, color:'var(--accent)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
            <Plus size={12} /> Add item
          </button>
        </div>
      </Section>

      {/* Sign-off */}
      <Section title="Sign-Off" open={open.signoff} onToggle={()=>toggle('signoff')}>
        {[
          { role:'Supervisor', nameKey:'supervisor_name', sigKey:'supervisor_sig' },
          { role:'Customer',   nameKey:'customer_name',   sigKey:'customer_sig'   },
        ].map(({ role, nameKey, sigKey }) => (
          <div key={role}>
            <FieldLabel label={`${role} Sign-Off`} />
            <input value={values[nameKey]||''} onChange={e=>set(nameKey,e.target.value)}
              placeholder={`${role} full name`} style={{ width:'100%', fontSize:13, marginBottom:6 }} />
            {values[nameKey] && (
              <SigPad value={values[sigKey]||null} onChange={v=>set(sigKey,v)} />
            )}
          </div>
        ))}
      </Section>

      {error && (
        <div style={{ padding:'10px 14px', marginBottom:10, background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:5, fontSize:12, color:'var(--red)' }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', padding:'13px', borderRadius:5, marginBottom:20,
        background: submitting?'var(--bg-4)':'var(--accent)',
        color: submitting?'var(--text-dim)':'#000',
        fontFamily:'var(--mono)', fontSize:12, fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase',
        border:`1px solid ${submitting?'var(--border)':'var(--accent)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
        {submitting
          ? <><SpinnerGap size={14} style={{ animation:'spin 1s linear infinite' }} /> Generating PDF…</>
          : <><CheckCircle size={14} /> Complete &amp; Sign</>
        }
      </button>
    </div>
  )
}

// ─── Success view ──────────────────────────────────────────────────────────────
function SuccessView({ result, onBack }) {
  return (
    <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px' }}>
      <CheckCircle size={52} style={{ color:'var(--green)', marginBottom:12 }} />
      <div style={{ fontFamily:'var(--head)', fontSize:22, fontWeight:700, marginBottom:6 }}>Form Completed</div>
      <div style={{ color:'var(--text-dim)', fontSize:13, marginBottom:24, textAlign:'center' }}>
        {COMPLETION_TYPES[result.formType]?.label} for {result.siteName} has been saved and PDF generated.
      </div>
      <div style={{ display:'flex', gap:10 }}>
        {result.pdfUrl && (
          <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:5,
            background:'var(--blue-dim)', color:'var(--blue)',
            fontFamily:'var(--mono)', fontSize:11, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.06em', textDecoration:'none',
          }}>
            <Eye size={13} /> View PDF
          </a>
        )}
        <button onClick={onBack} style={{ padding:'10px 18px', borderRadius:5, background:'var(--bg-4)', border:'1px solid var(--border)', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-dim)' }}>
          Back to Forms
        </button>
      </div>
    </div>
  )
}

// ─── Completion form row ───────────────────────────────────────────────────────
function CompletionRow({ form }) {
  const cfg = COMPLETION_TYPES[form.form_type] || {}
  const Icon = cfg.icon || ClipboardText
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
      <div style={{ width:36, height:36, borderRadius:4, flexShrink:0, background:cfg.colorDim||'var(--bg-4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={16} style={{ color: cfg.color||'var(--text-dim)' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {form.site_name || 'Unnamed Site'}
        </div>
        <div style={{ fontSize:11, color:'var(--text-dim)' }}>
          {cfg.short} · {form.tech_name} · {form.date_completed}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        <span style={{ padding:'2px 8px', borderRadius:3, fontFamily:'var(--mono)', fontSize:10, fontWeight:600, textTransform:'uppercase', background:'var(--green-dim)', color:'var(--green)' }}>
          Complete
        </span>
        {form.pdf_url && (
          <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:3, background:'var(--blue-dim)', color:'var(--blue)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, textTransform:'uppercase', textDecoration:'none' }}>
            <Eye size={10} /> View PDF
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function CompletionForms() {
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')

  const [view,      setView]      = useState(typeParam && COMPLETION_TYPES[typeParam] ? 'form' : 'list')
  const [activeType,setActiveType]= useState(typeParam && COMPLETION_TYPES[typeParam] ? typeParam : null)
  const [activeJob, setActiveJob] = useState(null)
  const [result,    setResult]    = useState(null)
  const [forms,     setForms]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [branch,    setBranch]    = useState('lm')

  useEffect(() => {
    db.from('completion_forms').select('*').order('created_at',{ascending:false})
      .then(({data,error}) => {
        if (!error && data) setForms(data)
        setLoading(false)
      })
  }, [])

  const handleStart = (type) => { setActiveType(type); setActiveJob(null); setView('form') }
  const handleSave  = (res)  => { setResult(res); setView('success') }
  const handleBack  = ()     => { setView('list'); setResult(null); setActiveType(null)
    // Refresh list
    db.from('completion_forms').select('*').order('created_at',{ascending:false})
      .then(({data}) => { if (data) setForms(data) })
  }

  if (view === 'form') return <CompletionFormView formType={activeType} jobId={activeJob} onSave={handleSave} onCancel={()=>setView('list')} />
  if (view === 'success') return <SuccessView result={result} onBack={handleBack} />

  const bc = BRANCH_COLORS[branch]
  const branchForms = forms.filter(f => f.branch === branch)

  return (
    <div className="page-content fade-in">

      {/* Form type tiles */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
          Completion Forms
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {Object.entries(COMPLETION_TYPES).map(([type, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={type} onClick={()=>handleStart(type)} style={{
                display:'flex', flexDirection:'column', gap:10, padding:'16px',
                background:'#EEF3FF',
                border:'1.5px solid #D0DBFF',
                borderRadius:16,
                textAlign:'left',
                transition:'transform 0.12s, box-shadow 0.12s',
                boxShadow:'0 1px 4px rgba(30,60,180,0.06)',
              }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(30,60,180,0.12)' }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(30,60,180,0.06)' }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'#fff', border:'1.5px solid #D0DBFF', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(30,60,180,0.08)' }}>
                    <Icon size={16} style={{ color:'#1E3CB4' }} />
                  </div>
                  <CaretRight size={12} style={{ color:'#7A9EE0' }} />
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#0D1F6B', marginBottom:3 }}>{cfg.short}</div>
                  <div style={{ fontSize:11, color:'#5A7AB8', lineHeight:1.45 }}>{cfg.desc}</div>
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'#8AAAE0', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {cfg.ref}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Submissions list */}
      <BranchTabs active={branch} onChange={setBranch} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          { label:'Total',    val: branchForms.length,                                                   color:'var(--text)'  },
          { label:'This Month', val: branchForms.filter(f=>f.date_completed?.startsWith('2026-03')).length, color:'var(--accent)' },
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
            <div style={{ fontFamily:'var(--head)', fontSize:24, fontWeight:700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:6 }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:bc.bgActive, transition:'background 0.2s' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:bc.textActive, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Recent Submissions
          </span>
        </div>
        {loading
          ? <div style={{ padding:'40px 16px', textAlign:'center', color:'var(--text-dim)', fontSize:13 }}>Loading…</div>
          : branchForms.length === 0
            ? <div style={{ padding:'40px 16px', textAlign:'center', color:'var(--text-dim)', fontSize:13 }}>No completion forms for this branch yet</div>
            : branchForms.map(f => <CompletionRow key={f.id} form={f} />)
        }
      </div>
    </div>
  )
}
