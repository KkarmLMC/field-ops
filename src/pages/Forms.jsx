import { useState, useEffect } from 'react'
import {
  CaretRight, CheckCircle, Eye, Plus, SpinnerGap,
  CaretDown, Trash, X, ArrowLeft,
} from '@phosphor-icons/react'
import { jsPDF } from 'jspdf'
import { db } from '../lib/supabase.js'
import { MOCK_SUBMISSIONS } from '../data/mockData.js'
import { JOBS, TECHNICIANS } from '../data/mockData.js'
import BranchTabs from '../components/BranchTabs'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Completion form type config ───────────────────────────────────────────────
import {
  Lightning, MagnifyingGlass, Ruler, ClipboardText,
} from '@phosphor-icons/react'

export const COMPLETION_TYPES = {
  'installation': {
    label:    'Installation Completion',
    short:    'Installation',
    icon:     Lightning,
    color:    'var(--accent)',
    colorDim: 'var(--accent-dim)',
    desc:     'Final sign-off on completed LPS installation',
    ref:      'NFPA 780 / UL 96A',
    fields: [
      { id: 'lps_class',        label: 'LPS Class',                 type: 'select',  options: ['Class I', 'Class II'], required: true },
      { id: 'air_terminals',    label: 'Air Terminals Installed',    type: 'number',  required: true },
      { id: 'down_conductors',  label: 'Down Conductors Installed',  type: 'number',  required: true },
      { id: 'ground_rods',      label: 'Ground Rods Installed',      type: 'number',  required: true },
      { id: 'bonding_complete', label: 'Bonding Complete',           type: 'boolean', required: true },
      { id: 'ul_label',         label: 'UL Master Label Applied',    type: 'boolean' },
      { id: 'resistance_ohms',  label: 'Ground Resistance (ohms)',   type: 'number' },
    ],
  },
  'inspection': {
    label:    'Inspection Completion',
    short:    'Inspection',
    icon:     MagnifyingGlass,
    color:    'var(--blue)',
    colorDim: 'var(--blue-soft)',
    desc:     'Post-inspection findings and compliance status',
    ref:      'LPI-175 / LPI-177',
    fields: [
      { id: 'inspection_type', label: 'Inspection Type',            type: 'select', options: ['Annual', 'Bi-Annual', 'Post-Strike', 'Pre-Certification'], required: true },
      { id: 'system_class',   label: 'System Class',               type: 'select', options: ['Class I', 'Class II'] },
      { id: 'overall_result', label: 'Overall Result',              type: 'select', options: ['Pass', 'Pass with Conditions', 'Fail'], required: true },
      { id: 'deficiencies',   label: 'Deficiencies Found',         type: 'textarea' },
      { id: 'corrective_req', label: 'Corrective Action Required',  type: 'boolean' },
      { id: 'next_inspection',label: 'Next Inspection Due',         type: 'date' },
    ],
  },
  'site-survey': {
    label:    'Site Survey Completion',
    short:    'Site Survey',
    icon:     Ruler,
    color:    'var(--green)',
    colorDim: 'var(--green-s)',
    desc:     'Site survey findings and LPS recommendations',
    ref:      'NFPA 780 Annex L',
    fields: [
      { id: 'structure_type',  label: 'Structure Type',             type: 'select', options: ['Commercial', 'Industrial', 'Healthcare', 'Educational', 'Residential', 'Utility', 'Other'], required: true },
      { id: 'height_ft',       label: 'Structure Height (ft)',      type: 'number', required: true },
      { id: 'lps_recommended', label: 'LPS Recommended',            type: 'boolean', required: true },
      { id: 'risk_ratio',      label: 'Nd/Nc Risk Ratio',           type: 'number' },
      { id: 'estimated_cost',  label: 'Estimated Install Cost ($)',  type: 'number' },
      { id: 'proposal_ready',  label: 'Proposal Ready to Send',     type: 'boolean' },
    ],
  },
  'annual-test': {
    label:    'Annual Test Completion',
    short:    'Annual Test',
    icon:     ClipboardText,
    color:    '#7C3AED',
    colorDim: 'rgba(124,58,237,0.12)',
    desc:     'Annual continuity and resistance test results',
    ref:      'NFPA 780 §4.18',
    fields: [
      { id: 'test_method',     label: 'Test Method',                type: 'select', options: ['Fall-of-Potential', 'Clamp-On', 'Stakeless'], required: true },
      { id: 'resistance_ohms', label: 'Ground Resistance (ohms)',   type: 'number', required: true },
      { id: 'resistance_pass', label: 'Resistance ≤ 10 ohms',       type: 'boolean', required: true },
      { id: 'continuity_pass', label: 'Continuity Test Passed',     type: 'boolean', required: true },
      { id: 'corrosion_found', label: 'Corrosion / Damage Found',   type: 'boolean' },
      { id: 'repairs_needed',  label: 'Repairs Recommended',        type: 'boolean' },
      { id: 'cert_issued',     label: 'Test Certificate Issued',    type: 'boolean' },
    ],
  },
}

// ─── Status badge map ──────────────────────────────────────────────────────────
const STATUS_BADGE = {
  'Draft':            'badge-hold',
  'Submitted':        'badge-awarded',
  'Under Review':     'badge-scheduled',
  'Pending Customer': 'badge-customer',
  'Customer Signed':  'badge-signed',
  'Complete':         'badge-complete',
  'Rejected':         'badge-review',
}

// ─── Signature pad ─────────────────────────────────────────────────────────────
import { useRef } from 'react'

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
    if (e.touches) return { x: (e.touches[0].clientX - rect.left)*sx, y: (e.touches[0].clientY - rect.top)*sy }
    return { x: (e.clientX - rect.left)*sx, y: (e.clientY - rect.top)*sy }
  }
  const start = (e) => { e.preventDefault(); drawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const move  = (e) => { e.preventDefault(); if (!drawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#374151'; ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const end   = (e) => { e.preventDefault(); if (!drawing.current) return; drawing.current=false; onChange(canvasRef.current.toDataURL('image/png')) }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0,0,480,80); onChange(null) }

  return (
    <div style={{ position:'relative' }}>
      <canvas ref={canvasRef} width={480} height={80}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width:'100%', height:'5rem', borderRadius:'var(--r-sm)', display:'block', background:'var(--bg)', cursor:'crosshair', touchAction:'none' }}
      />
      {!value && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text-3)', fontSize:'var(--fs-sm)', pointerEvents:'none', fontFamily:'var(--mono)' }}>Sign here</div>}
      {value  && <button type="button" onClick={clear} style={{ position:'absolute', top:'var(--sp-1)', right:'var(--sp-1)', background:'var(--hover)', borderRadius:'var(--r-xs)', padding:'0.125rem 0.375rem', fontSize:'var(--fs-xs)', color:'var(--text-2)', display:'flex', alignItems:'center', gap:'var(--sp-1)' }}><Trash size={10}/> Clear</button>}
    </div>
  )
}

// ─── PDF generator ─────────────────────────────────────────────────────────────
async function generateCompletionPdf(formType, formData) {
  const cfg = COMPLETION_TYPES[formType]
  const doc = new jsPDF({ unit:'pt', format:'letter' })
  const W=612, ML=40, CW=532
  const NAVY=[26,35,95], NAVY2=[42,55,120], NAVY_LT=[235,240,255]
  const WHITE=[255,255,255], BG=[248,249,252], BORDER=[218,222,232]
  const LABEL=[107,114,128], TEXT=[17,24,39]
  const GREEN=[22,163,74], GREEN_BG=[240,253,244], GREEN_BD=[134,239,172]
  let y=0

  const checkPage = (n=28) => { if (y+n>750) { drawFooter(); doc.addPage(); y=40 } }
  const drawFooter = () => {
    const ph=doc.internal.pageSize.getHeight()
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
    y+=22
  }
  const fieldRow = (label, value, shade=false) => {
    const lines=doc.splitTextToSize(String(value??'—'), CW-140)
    const rowH=Math.max(20, lines.length*12+8)
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(lines, ML+140, y+13)
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y+=rowH
  }
  const boolRow = (label, value, shade=false) => {
    const rowH=20; checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    const ok=value===true||value==='true'
    const pW=40, pX=ML+CW-pW-6, pY=y+(rowH-14)/2
    doc.setFillColor(...(ok?GREEN_BG:[254,242,242])); doc.setDrawColor(...(ok?GREEN_BD:[254,202,202]))
    doc.roundedRect(pX,pY,pW,14,2,2,'FD')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...(ok?GREEN:[220,38,38]))
    doc.text(ok?'YES':'NO', pX+pW/2, pY+9.5, {align:'center'})
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y+=rowH
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
  doc.text(cfg.label, ML+52, 46); doc.text(cfg.ref, ML+52, 60)
  doc.setFillColor(...GREEN); doc.roundedRect(W-148,12,112,20,3,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('COMPLETED & SIGNED', W-92, 25, {align:'center'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(170,185,220)
  doc.text(new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}), W-ML, 50, {align:'right'})
  y=84

  // Summary strip
  doc.setFillColor(...NAVY_LT); doc.rect(0,y,W,32,'F')
  doc.setDrawColor(...BORDER); doc.line(0,y+32,W,y+32)
  const cw4=W/4
  ;[{label:'SITE',val:formData.site_name||'—'},{label:'JOB #',val:formData.job_number||'—'},{label:'DATE',val:formData.date_completed||'—'},{label:'TECHNICIAN',val:formData.tech_name||'—'}]
    .forEach(({label,val},i) => {
      const cx=i*cw4
      if (i>0) { doc.setDrawColor(...BORDER); doc.line(cx,y+4,cx,y+28) }
      doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...LABEL)
      doc.text(label, cx+cw4/2, y+11, {align:'center'})
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...NAVY)
      let v=val; while(doc.getTextWidth(v)>cw4-12&&v.length>4) v=v.slice(0,-2)+'…'
      doc.text(v, cx+cw4/2, y+24, {align:'center'})
    })
  y+=44

  sectionHead('Job Information')
  fieldRow('Site Name',  formData.site_name||'—')
  fieldRow('Address',    formData.site_address||'—', true)
  fieldRow('Job Number', formData.job_number||'—')
  fieldRow('Technician', formData.tech_name||'—', true)
  fieldRow('Date',       formData.date_completed||'—')
  y+=6

  sectionHead(`${cfg.short} Details`)
  cfg.fields.forEach((f,i) => {
    if (f.type==='boolean') boolRow(f.label, formData[f.id], i%2===1)
    else fieldRow(f.label, formData[f.id]??'—', i%2===1)
  })
  y+=6

  if (formData.notes) { sectionHead('Notes'); fieldRow('Notes', formData.notes); y+=6 }
  if (formData.punch_list?.length) {
    sectionHead('Punch List')
    formData.punch_list.forEach((item,i) => fieldRow(`Item ${i+1}`, item, i%2===1))
    y+=6
  }

  sectionHead('Sign-Off')
  ;[{role:'Supervisor',name:formData.supervisor_name,sig:formData.supervisor_sig},{role:'Customer',name:formData.customer_name,sig:formData.customer_sig}]
    .filter(p=>p.name)
    .forEach((p,n) => {
      const rowH=56; checkPage(rowH)
      if (n%2===1) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...TEXT)
      doc.text(p.name, ML+6, y+16)
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
      doc.text(p.role, ML+6, y+28)
      if (p.sig?.startsWith('data:image')) { try { doc.addImage(p.sig,'PNG',ML+200,y+6,120,38) } catch(e){} }
      doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
      doc.roundedRect(ML+CW-80,y+18,68,16,3,3,'FD')
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREEN)
      doc.text('SIGNED', ML+CW-46, y+29, {align:'center'})
      doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
      y+=rowH
    })

  drawFooter()

  const pdfBlob  = doc.output('blob')
  const date     = formData.date_completed||new Date().toISOString().slice(0,10)
  const slug     = (formData.site_name||'site').toLowerCase().replace(/\s+/g,'-').slice(0,20)
  const filePath = `completion-forms/${formType}_${date}_${slug}_${Date.now().toString(36)}.pdf`
  const { error } = await db.storage.from('field-log-pdfs').upload(filePath, pdfBlob, { contentType:'application/pdf', upsert:true })
  if (error) throw error
  const { data: urlData } = db.storage.from('field-log-pdfs').getPublicUrl(filePath)
  return urlData.publicUrl
}

// ─── Field renderer ────────────────────────────────────────────────────────────
function FormField({ field, value, onChange }) {
  const base = { width:'100%', fontSize:'var(--fs-md)' }
  if (field.type==='select') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)} style={base}>
      <option value="">Select…</option>
      {field.options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )
  if (field.type==='boolean') return (
    <div style={{ display:'flex', gap:'var(--sp-2)' }}>
      {['Yes','No'].map(opt => {
        const active = opt==='Yes'?value===true:value===false
        return (
          <button key={opt} type="button" onClick={()=>onChange(opt==='Yes')} style={{
            flex:1, padding:'var(--sp-2)', borderRadius:'var(--r-sm)', fontSize:'var(--fs-md)',
            border:`1px solid ${active?'var(--navy)':'var(--border)'}`,
            background: active?'var(--navy)':'var(--surface)',
            color: active?'#fff':'var(--text-2)',
            fontWeight: active?600:400, transition:'all var(--ease-fast)',
          }}>{opt}</button>
        )
      })}
    </div>
  )
  if (field.type==='textarea') return <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...base, resize:'vertical', lineHeight:1.5, padding:'var(--sp-2) var(--sp-3)' }} />
  if (field.type==='date')    return <input type="date"   value={value||''} onChange={e=>onChange(e.target.value)} style={base} />
  if (field.type==='number')  return <input type="number" step="any" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="0" style={base} />
  return <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base} />
}

function FieldLabel({ label, required }) {
  return (
    <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'var(--sp-1)' }}>
      {label}{required&&<span style={{ color:'var(--red)', marginLeft:'var(--sp-1)' }}>*</span>}
    </div>
  )
}

function Section({ title, children, open, onToggle }) {
  return (
    <div style={{ background:'var(--surface)', borderRadius:'var(--r-lg)', marginBottom:'var(--sp-3)', overflow:'hidden' }}>
      <button type="button" onClick={onToggle} style={{ width:'100%', padding:'var(--sp-2) var(--sp-4)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--navy)' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</span>
        <CaretDown size={12} style={{ color:'rgba(255,255,255,0.6)', transform:open?'rotate(180deg)':'none', transition:'transform var(--ease-base)' }} />
      </button>
      {open && <div style={{ padding:'var(--sp-4)', display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>{children}</div>}
    </div>
  )
}

// ─── Completion form view ──────────────────────────────────────────────────────
function CompletionFormView({ formType, onSave, onCancel }) {
  const cfg  = COMPLETION_TYPES[formType]
  const [values,      setValues]      = useState({ date_completed: new Date().toISOString().slice(0,10), branch:'lm' })
  const [open,        setOpen]        = useState({ job:true, details:true, notes:true, signoff:true })
  const [punchItems,  setPunchItems]  = useState([''])
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)

  const set    = (k,v) => setValues(f=>({...f,[k]:v}))
  const toggle = (k)   => setOpen(o=>({...o,[k]:!o[k]}))
  const Icon   = cfg.icon

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    const payload = { ...values, punch_list: punchItems.filter(Boolean) }
    try {
      const pdfUrl = await generateCompletionPdf(formType, payload)
      await db.from('completion_forms').insert({
        form_type:       formType,
        branch:          values.branch||'lm',
        site_name:       values.site_name,
        site_address:    values.site_address,
        job_number:      values.job_number,
        tech_name:       values.tech_name,
        date_completed:  values.date_completed,
        notes:           values.notes,
        punch_list:      punchItems.filter(Boolean),
        form_data:       payload,
        supervisor_name: values.supervisor_name,
        supervisor_sig:  values.supervisor_sig,
        customer_name:   values.customer_name,
        customer_sig:    values.customer_sig,
        status:          'submitted',
        pdf_url:         pdfUrl,
      })
      onSave({ pdfUrl, siteName: values.site_name, formType })
    } catch(err) {
      setError('PDF upload failed. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content fade-in">
      {/* Back header */}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', color:'var(--text-2)', fontSize:'var(--fs-md)' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width:'1px', height:'1rem', background:'var(--border)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
          <Icon size={14} style={{ color: cfg.color }} />
          <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', background:'var(--navy)' }}>{cfg.ref}</span>
        </div>
      </div>

      {/* Job info */}
      <Section title="Job Information" open={open.job} onToggle={()=>toggle('job')}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Site Name" required />
            <input value={values.site_name||''} onChange={e=>set('site_name',e.target.value)} placeholder="Site name" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Address" />
            <input value={values.site_address||''} onChange={e=>set('site_address',e.target.value)} placeholder="Street address" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div>
            <FieldLabel label="Job Number" />
            <input value={values.job_number||''} onChange={e=>set('job_number',e.target.value)} placeholder="JOB-2026-XXXX" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div>
            <FieldLabel label="Date Completed" required />
            <input type="date" value={values.date_completed||''} onChange={e=>set('date_completed',e.target.value)} style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Assigned Technician" required />
            <input value={values.tech_name||''} onChange={e=>set('tech_name',e.target.value)} placeholder="Technician name" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
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
            placeholder="Additional notes, observations, or follow-up items…"
            style={{ width:'100%', fontSize:'var(--fs-md)', resize:'vertical', lineHeight:1.5, padding:'var(--sp-2) var(--sp-3)' }} />
        </div>
        <div>
          <FieldLabel label="Punch List Items" />
          {punchItems.map((item,i) => (
            <div key={i} style={{ display:'flex', gap:'var(--sp-2)', marginBottom:'var(--sp-2)' }}>
              <input value={item} onChange={e=>{ const n=[...punchItems]; n[i]=e.target.value; setPunchItems(n) }}
                placeholder={`Item ${i+1}`} style={{ flex:1, fontSize:'var(--fs-md)' }} />
              {punchItems.length>1 && (
                <button type="button" onClick={()=>setPunchItems(p=>p.filter((_,j)=>j!==i))} style={{ color:'var(--text-3)', padding:'0 var(--sp-2)' }}><X size={13}/></button>
              )}
            </div>
          ))}
          <button type="button" onClick={()=>setPunchItems(p=>[...p,''])}
            style={{ fontSize:'var(--fs-sm)', color:'var(--blue)', display:'flex', alignItems:'center', gap:'var(--sp-1)', marginTop:'var(--sp-1)' }}>
            <Plus size={12}/> Add item
          </button>
        </div>
      </Section>

      {/* Sign-off */}
      <Section title="Sign-Off" open={open.signoff} onToggle={()=>toggle('signoff')}>
        {[{role:'Supervisor',nk:'supervisor_name',sk:'supervisor_sig'},{role:'Customer',nk:'customer_name',sk:'customer_sig'}].map(({role,nk,sk}) => (
          <div key={role}>
            <FieldLabel label={`${role} Sign-Off`} />
            <input value={values[nk]||''} onChange={e=>set(nk,e.target.value)} placeholder={`${role} full name`}
              style={{ width:'100%', fontSize:'var(--fs-md)', marginBottom:'var(--sp-2)' }} />
            {values[nk] && <SigPad value={values[sk]||null} onChange={v=>set(sk,v)} />}
          </div>
        ))}
      </Section>

      {error && <div style={{ padding:'var(--sp-3) var(--sp-4)', marginBottom:'var(--sp-3)', background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-sm)', color:'var(--red)' }}>{error}</div>}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', padding:'var(--sp-3)', borderRadius:'var(--r-md)', marginBottom:'var(--sp-8)',
        background: submitting?'var(--hover)':'var(--red)',
        color: submitting?'var(--text-3)':'#fff',
        fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase',
        border:`1px solid ${submitting?'var(--border)':'var(--red)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--sp-2)',
        transition:'all var(--ease-fast)',
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
    <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--sp-10) var(--sp-6)' }}>
      <CheckCircle size={52} style={{ color:'var(--green)', marginBottom:'var(--sp-3)' }} />
      <div style={{ fontFamily:'var(--font)', fontSize:'var(--fs-xl)', fontWeight:700, marginBottom:'var(--sp-2)' }}>Form Completed</div>
      <div style={{ color:'var(--text-2)', fontSize:'var(--fs-md)', marginBottom:'var(--sp-6)', textAlign:'center' }}>
        {COMPLETION_TYPES[result.formType]?.label} for {result.siteName} has been saved.
      </div>
      <div style={{ display:'flex', gap:'var(--sp-3)' }}>
        {result.pdfUrl && (
          <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', gap:'var(--sp-2)',
            padding:'var(--sp-2) var(--sp-5)', borderRadius:'var(--r-md)',
            background:'var(--blue-soft)', color:'var(--blue)',
            fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.06em', textDecoration:'none',
          }}>
            <Eye size={13}/> View PDF
          </a>
        )}
        <button onClick={onBack} style={{
          padding:'var(--sp-2) var(--sp-5)', borderRadius:'var(--r-md)',
          background:'var(--surface)', fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)',
        }}>
          Back to Forms
        </button>
      </div>
    </div>
  )
}

// ─── Completion row in submissions list ────────────────────────────────────────
function CompletionRow({ form }) {
  const cfg = COMPLETION_TYPES[form.form_type]||{}
  const Icon = cfg.icon||ClipboardText
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', padding:'0.875rem var(--sp-4)', borderBottom:'1px solid var(--border-l)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="project-name">{form.site_name||'Unnamed Site'}</div>
        <div className="project-meta">{cfg.short} · {form.tech_name} · {form.date_completed}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--sp-1)', flexShrink:0 }}>
        <span className="badge badge-complete">Complete</span>
        {form.pdf_url && (
          <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'0.1875rem 0.5rem', borderRadius:'var(--r-xs)', background:'var(--blue-soft)', color:'var(--blue)', fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600, textTransform:'uppercase', textDecoration:'none' }}>
            <Eye size={10}/> PDF
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main Forms page ───────────────────────────────────────────────────────────
export default function Forms() {
  const [view,        setView]        = useState('list')   // 'list' | 'form' | 'success'
  const [activeType,  setActiveType]  = useState(null)
  const [result,      setResult]      = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [completions, setCompletions] = useState([])
  const [branch,      setBranch]      = useState('lm')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    // Load legacy form submissions
    db.from('form_submissions').select('*, projects(name)').order('created_at',{ascending:false})
      .then(({data}) => { setSubmissions(data?.length>0 ? data : MOCK_SUBMISSIONS); setLoading(false) })
      .catch(() => { setSubmissions(MOCK_SUBMISSIONS); setLoading(false) })

    // Load completion forms
    db.from('completion_forms').select('*').order('created_at',{ascending:false})
      .then(({data}) => { if (data) setCompletions(data) })
  }, [])

  const handleStart  = (type) => { setActiveType(type); setView('form') }
  const handleSave   = (res)  => { setResult(res); setView('success');
    // Refresh completions
    db.from('completion_forms').select('*').order('created_at',{ascending:false})
      .then(({data}) => { if (data) setCompletions(data) })
  }
  const handleBack   = ()     => { setView('list'); setResult(null); setActiveType(null) }

  // Sub-views
  if (view === 'form')    return <CompletionFormView formType={activeType} onSave={handleSave} onCancel={handleBack} />
  if (view === 'success') return <SuccessView result={result} onBack={handleBack} />

  // ── List view ──────────────────────────────────────────────────────────────
  const branchCompletions = completions.filter(f=>f.branch===branch)

  return (
    <div className="page-content fade-in">

      {/* Completion forms tiles */}
      <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', marginBottom:'var(--gap-md)', overflow:'hidden' }}>
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background:'var(--red)' }} />Completion Forms</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap:'var(--gap-md)', padding:'var(--gap-md) 0' }}>
          {Object.entries(COMPLETION_TYPES).map(([type, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={type} onClick={()=>handleStart(type)} style={{
                display:'flex', alignItems:'center', gap:'var(--sp-3)',
                padding:'var(--sp-3)', background:'var(--surface-raised)',
                borderRadius:'var(--r-lg)',
                textAlign:'left', transition:'background var(--ease-fast)',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--surface-raised)'}
              >
                <Icon size={18} weight="regular" style={{ color:'var(--text-1)', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="project-name">{cfg.short}</div>
                  <div className="project-meta" style={{ fontFamily:'var(--mono)', textTransform:'uppercase' }}>{cfg.ref}</div>
                </div>
                <CaretRight size={11} style={{ color:'var(--text-3)', flexShrink:0 }} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Branch selector + branch-filtered stats */}
      <BranchTabs active={branch} onChange={setBranch} />

      {/* 3 stats filtered by active branch — single row, branch-colored */}
      {(() => {
        const bc = BRANCH_COLORS[branch]
        const stats = [
          { label: 'Needs Review',  value: branchCompletions.filter(f => f.status === 'submitted').length },
          { label: 'With Customer', value: branchCompletions.filter(f => f.status === 'pending_customer').length },
          { label: 'Complete',      value: branchCompletions.filter(f => f.status === 'complete').length },
        ]
        return (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--gap-md)', marginBottom:'var(--gap-lg)' }}>
            {stats.map(({ label, value }) => (
              <div key={label} style={{
                background: bc.bgInactive,
                borderRadius: 'var(--r-xl)',
                padding: '1.25rem 1rem 1.5rem',
                minHeight: '7rem',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)',
                  color: bc.bgActive, textTransform: 'uppercase',
                  letterSpacing: '0.04em', marginBottom: 'var(--sp-2)',
                  fontWeight: 500,
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
                  fontWeight: 700, lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: bc.bgActive,
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )
      })()}
      <div className="card" style={{ marginBottom:'var(--sp-3)' }}>
        <div className="card-header" style={{ background: BRANCH_COLORS[branch].bgActive }}>
          <span className="card-title"><span className="card-dot" style={{ background:'rgba(255,255,255,0.6)' }} />Completed Forms</span>
        </div>
        {branchCompletions.length === 0
          ? <div className="empty"><div className="empty-desc">No completions for this branch yet.</div></div>
          : branchCompletions.map(f => <CompletionRow key={f.id} form={f} />)
        }
      </div>

      {/* Legacy submissions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background:'var(--red)' }} />All Submissions</span>
        </div>
        {loading
          ? <div className="loading"><div className="spinner" /></div>
          : submissions.length===0
            ? <div className="empty"><div className="empty-icon">📝</div><div className="empty-title">No forms yet</div><div className="empty-desc">Start a completion form above.</div></div>
            : submissions.map(s => (
              <div key={s.id} className="project-item">
                <div style={{ flex:1 }}>
                  <div className="project-name">{s.projects?.name||'Unknown Project'}</div>
                  <div className="project-meta">{s.submitted_by} · {new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${STATUS_BADGE[s.status]||'badge-hold'}`}>{s.status}</span>
              </div>
            ))
        }
      </div>
    </div>
  )
}
