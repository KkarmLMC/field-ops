import { useState, useRef, useEffect } from 'react'
import {
  Plus, CheckCircle, X, CaretDown,
  ClipboardText, ArrowLeft, Eye,
  Trash, SpinnerGap, HardHat, FileText,
} from '@phosphor-icons/react'
import { jsPDF } from 'jspdf'
import { db } from '../lib/supabase.js'
import { FORM_TEMPLATES } from '../data/mockData.js'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

const TEMPLATE = FORM_TEMPLATES['jsa']

// ─── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }) {
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
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    canvas.getContext('2d').beginPath()
    canvas.getContext('2d').moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.strokeStyle = '#c8d4e0'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const endDraw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={480} height={80}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        style={{
          width: '100%', height: 80, borderRadius: 4, display: 'block',
          border: '1px solid var(--border)', background: 'var(--bg-3)',
          cursor: 'crosshair', touchAction: 'none',
        }}
      />
      {!value && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'var(--text-muted)', fontSize: 12, pointerEvents: 'none',
          fontFamily: 'var(--mono)',
        }}>Sign here</div>
      )}
      {value && (
        <button type="button" onClick={clear} style={{
          position: 'absolute', top: 4, right: 4,
          background: 'var(--bg-4)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '2px 6px', fontSize: 'var(--fs-xs)',
          color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <Trash size={10} /> Clear
        </button>
      )}
    </div>
  )
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────
async function generateAndUploadJSAPdf(formData) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = 612, ML = 40, CW = 532

  const NAVY=[26,35,95], NAVY2=[42,55,120], NAVY_LT=[235,240,255]
  const WHITE=[255,255,255], BG=[248,249,252], BORDER=[218,222,232]
  const LABEL=[107,114,128], TEXT=[17,24,39]
  const GREEN=[22,163,74], GREEN_BG=[240,253,244], GREEN_BD=[134,239,172]

  let y = 0

  const checkPage = (n=28) => {
    if (y + n > 750) { drawFooter(); doc.addPage(); y = 40 }
  }

  const drawFooter = () => {
    const ph = doc.internal.pageSize.getHeight()
    doc.setFillColor(...BG); doc.rect(0, ph-34, W, 34, 'F')
    doc.setDrawColor(...BORDER); doc.line(0, ph-34, W, ph-34)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text('LMC Field Operations  ·  Job Safety Analysis  ·  LMC-Form-000-008', ML, ph-14)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, W/2, ph-14, {align:'center'})
    doc.text(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), W-ML, ph-14, {align:'right'})
  }

  const sectionHead = (title) => {
    checkPage(28)
    doc.setFillColor(...NAVY); doc.rect(ML, y, 3, 18, 'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), ML+10, y+12)
    doc.setDrawColor(...NAVY_LT)
    doc.line(ML+10+doc.getTextWidth(title.toUpperCase())+6, y+8, ML+CW, y+8)
    y += 22
  }

  const fieldRow = (label, value, shade=false) => {
    const valStr = String(value||'—')
    const lines = doc.splitTextToSize(valStr, CW-140)
    const rowH = Math.max(20, lines.length*12+8)
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(lines, ML+140, y+13)
    doc.setDrawColor(...BORDER); doc.line(ML, y+rowH, ML+CW, y+rowH)
    y += rowH
  }

  const pillsRow = (label, items) => {
    if (!items?.length) return
    const rowH = 30
    checkPage(rowH)
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+17)
    let px = ML+140
    items.forEach(t => {
      const tw = doc.getTextWidth(t)+12
      if (px+tw > ML+CW-4) { px = ML+140; y += 18 }
      doc.setFillColor(...NAVY_LT); doc.setDrawColor(190,205,245)
      doc.roundedRect(px, y+7, tw, 15, 2, 2, 'FD')
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NAVY)
      doc.text(t, px+tw/2, y+17, {align:'center'})
      px += tw+4
    })
    doc.setDrawColor(...BORDER); doc.line(ML, y+rowH, ML+CW, y+rowH)
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
  doc.text('Job Safety Analysis  ·  LMC-Form-000-008', ML+52, 46)
  doc.setFillColor(...GREEN); doc.roundedRect(W-148,12,76,20,3,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('SIGNED', W-110, 25, {align:'center'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(170,185,220)
  doc.text(new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}), W-ML, 50, {align:'right'})
  y = 84

  // Summary strip
  doc.setFillColor(...NAVY_LT); doc.rect(0,y,W,32,'F')
  doc.setDrawColor(...BORDER); doc.line(0,y+32,W,y+32)
  const cw4 = W/4
  ;[
    {label:'DATE',     val: formData.jsa_date||'—'},
    {label:'COMPANY',  val: formData.company_name||'—'},
    {label:'SITE',     val: formData.site_name||'—'},
    {label:'ACTIVITY', val: formData.general_activity||'—'},
  ].forEach(({label,val},i) => {
    const cx = i*cw4
    if (i>0) { doc.setDrawColor(...BORDER); doc.line(cx,y+4,cx,y+28) }
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...LABEL)
    doc.text(label, cx+cw4/2, y+11, {align:'center'})
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...NAVY)
    let v = val
    while (doc.getTextWidth(v)>cw4-12 && v.length>4) v = v.slice(0,-2)+'…'
    doc.text(v, cx+cw4/2, y+24, {align:'center'})
  })
  y += 44

  sectionHead('Job Information')
  fieldRow('Company',          formData.company_name)
  fieldRow('Site Name',        formData.site_name,       true)
  fieldRow('General Activity', formData.general_activity)
  fieldRow('Date',             formData.jsa_date,        true)
  y += 6

  sectionHead('Permit Required Activity')
  pillsRow('Permits', formData.permit_required||[])
  y += 6

  sectionHead('Personal Protective Equipment')
  pillsRow('Required PPE', formData.ppe_required||[])
  y += 6

  sectionHead('Safety Equipment & Tools')
  pillsRow('Equipment', formData.safety_tools||[])
  y += 6

  sectionHead('Activities, Hazards & Risk Control Measures')
  const colW = CW/3
  checkPage(20)
  doc.setFillColor(...NAVY); doc.rect(ML,y,CW,18,'F')
  ;['Activity / Task','Potential Hazard','Risk Control Measure'].forEach((h,i) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
    doc.text(h, ML+colW*i+6, y+12)
  })
  y += 18
  ;[1,2,3,4,5].forEach((n,idx) => {
    const row = formData[`activity_${n}`]||{}
    const texts = [row[0]||'—', row[1]||'—', row[2]||'—']
    const maxL = Math.max(...texts.map(t => doc.splitTextToSize(t, colW-12).length))
    const rowH = Math.max(20, maxL*11+8)
    checkPage(rowH)
    if (idx%2===1) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    texts.forEach((t,i) => {
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT)
      doc.text(doc.splitTextToSize(t, colW-12), ML+colW*i+6, y+13)
      if (i<2) { doc.setDrawColor(...BORDER); doc.line(ML+colW*(i+1),y,ML+colW*(i+1),y+rowH) }
    })
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y += rowH
  })
  y += 6

  sectionHead('Personnel Sign-Off')
  for (let n=1; n<=6; n++) {
    const person = formData[`person_${n}`]
    if (!person?.name) continue
    const rowH = 56
    checkPage(rowH)
    if (n%2===0) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(person.name, ML+6, y+16)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text('LMC Personnel', ML+6, y+28)
    if (person.sig?.startsWith('data:image')) {
      try { doc.addImage(person.sig, 'PNG', ML+200, y+6, 120, 38) } catch(e) {}
    }
    doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
    doc.roundedRect(ML+CW-80, y+18, 68, 16, 3, 3, 'FD')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREEN)
    doc.text('SIGNED', ML+CW-46, y+29, {align:'center'})
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y += rowH
  }

  drawFooter()

  // Upload to Supabase
  const pdfBlob  = doc.output('blob')
  const date     = formData.jsa_date || new Date().toISOString().slice(0,10)
  const slug     = (formData.site_name||'site').toLowerCase().replace(/\s+/g,'-').slice(0,20)
  const filePath = `jsa-pdfs/jsa_${date}_${slug}_${Date.now().toString(36)}.pdf`

  const { error } = await db.storage.from('field-log-pdfs')
    .upload(filePath, pdfBlob, { contentType:'application/pdf', upsert:true })
  if (error) throw error

  const { data: urlData } = db.storage.from('field-log-pdfs').getPublicUrl(filePath)
  return urlData.publicUrl
}

// ─── Field Renderer ────────────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'checkbox-group') {
    const selected = value || []
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-2)' }}>
        {field.options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button key={opt} type="button"
              onClick={() => onChange(checked ? selected.filter(s=>s!==opt) : [...selected,opt])}
              style={{
                padding:'5px 10px', borderRadius:'var(--r-sm)', fontSize:'var(--fs-base)',
                border:`1px solid ${checked?'var(--accent)':'var(--border)'}`,
                background: checked?'var(--accent-glow)':'var(--bg-3)',
                color: checked?'var(--accent)':'var(--text-dim)',
                fontWeight: checked?600:400, transition:'all 0.12s',
              }}
            >{opt}</button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'activity-row') {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--sp-2)' }}>
        {['Activity / Task','Potential Hazard','Risk Control Measure'].map((ph,i) => (
          <input key={i} type="text" placeholder={ph}
            value={(value||{})[i]||''}
            onChange={e => onChange({...(value||{}),[i]:e.target.value})}
            style={{ width:'100%', fontSize:'var(--fs-base)' }}
          />
        ))}
      </div>
    )
  }

  if (field.type === 'personnel-sig') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
        <input type="text" placeholder="Full name"
          value={(value||{}).name||''}
          onChange={e => onChange({...(value||{}),name:e.target.value})}
          style={{ width:'100%', fontSize:'var(--fs-base)' }}
        />
        {value?.name && (
          <div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-2xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'var(--sp-1)' }}>
              Signature
            </div>
            <SignaturePad
              value={(value||{}).sig||null}
              onChange={sig => onChange({...(value||{}),sig})}
            />
          </div>
        )}
      </div>
    )
  }

  if (field.type === 'date') {
    return <input type="date" value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%'}} />
  }

  return <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={{width:'100%'}} />
}

// ─── New JSA Form ──────────────────────────────────────────────────────────────
function NewJSAForm({ onSave, onCancel, branch }) {
  const [values,      setValues]      = useState({ jsa_date: new Date().toISOString().slice(0,10) })
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)
  const [openSections,setOpenSections]= useState(Object.fromEntries(TEMPLATE.sections.map(s=>[s.id,true])))

  const set = (k,v) => setValues(f=>({...f,[k]:v}))

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    try {
      const pdfUrl = await generateAndUploadJSAPdf(values)
      onSave({ id:`jsa-${Date.now()}`, branch, siteName:values.site_name||'Unnamed Site',
        date:values.jsa_date||new Date().toISOString().slice(0,10),
        tech:values.person_1?.name||'—', status:'signed',
        permits:values.permit_required||[], formData:values, pdfUrl })
    } catch(err) {
      setError('PDF upload failed — saved without PDF link.')
      onSave({ id:`jsa-${Date.now()}`, branch, siteName:values.site_name||'Unnamed Site',
        date:values.jsa_date||new Date().toISOString().slice(0,10),
        tech:values.person_1?.name||'—', status:'signed',
        permits:values.permit_required||[], formData:values, pdfUrl:null })
    }
    setSubmitting(false)
  }

  return (
    <div className="page-content fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:16 }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', color:'var(--text-2)', fontSize:'var(--fs-md)' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width:1, height:16, background:'var(--border)' }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          LMC-Form-000-008
        </span>
      </div>

      {TEMPLATE.sections.map(section => (
        <div key={section.id} style={{ background:'var(--surface)', borderRadius:'var(--r-md)', marginBottom:'var(--sp-3)', overflow:'hidden' }}>
          <button type="button" onClick={()=>setOpenSections(s=>({...s,[section.id]:!s[section.id]}))}
            style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:openSections[section.id]?'1px solid var(--border)':'none' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {section.title}
            </span>
            <CaretDown size={12} style={{ color:'var(--text-dim)', transform:openSections[section.id]?'rotate(180deg)':'none', transition:'transform 0.15s' }} />
          </button>
          {openSections[section.id] && (
            <div style={{ padding:14, display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
              {section.fields.map(field => (
                <div key={field.id}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'var(--sp-2)' }}>
                    {field.label}{field.required && <span style={{ color:'var(--red)', marginLeft:3 }}>*</span>}
                  </div>
                  <FieldRenderer field={field} value={values[field.id]} onChange={v=>set(field.id,v)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div style={{ padding:'10px 14px', marginBottom:'var(--sp-3)', background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-base)', color:'var(--red)' }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', padding:'12px', borderRadius:'var(--r-md)', marginBottom:16,
        background: submitting?'var(--bg-4)':'var(--accent)',
        color: submitting?'var(--text-dim)':'#000',
        fontFamily:'var(--mono)', fontSize:'var(--fs-base)', fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase',
        border:`1px solid ${submitting?'var(--border)':'var(--accent)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--sp-2)',
      }}>
        {submitting
          ? <><SpinnerGap size={14} style={{ animation:'spin 1s linear infinite' }} /> Generating PDF…</>
          : <><CheckCircle size={14} /> Sign &amp; Submit JSA</>
        }
      </button>
    </div>
  )
}

// ─── JSA Row ───────────────────────────────────────────────────────────────────
function JSARow({ jsa }) {
  const signed = jsa.status === 'signed'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', padding:'12px 14px', borderBottom:'none' }}>
      <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', flexShrink:0, background:signed?'var(--green-dim)':'var(--bg-4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {signed ? <CheckCircle size={16} style={{ color:'var(--green)' }} /> : <ClipboardText size={16} style={{ color:'var(--text-dim)' }} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'var(--fs-md)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {jsa.siteName}
        </div>
        <div style={{ fontSize:'var(--fs-sm)', color:'var(--text-dim)' }}>
          {(jsa.permits||[]).slice(0,2).join(' · ')}{(jsa.permits||[]).length>2?` +${jsa.permits.length-2}`:''}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--sp-1)', flexShrink:0 }}>
        <span style={{ padding:'2px 8px', borderRadius:'var(--r-xs)', fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', background:signed?'var(--green-dim)':'var(--bg-4)', color:signed?'var(--green)':'var(--text-dim)' }}>
          {signed ? 'Signed' : 'Draft'}
        </span>
        <div style={{ fontSize:'var(--fs-xs)', color:'var(--text-muted)', fontFamily:'var(--mono)' }}>
          {jsa.date} · {jsa.tech}
        </div>
        {jsa.pdfUrl && (
          <a href={jsa.pdfUrl} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'3px 8px', borderRadius:'var(--r-xs)',
            background:'var(--blue-dim)', color:'var(--blue)',
            fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.04em', textDecoration:'none',
          }}>
            <Eye size={10} /> View PDF
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JSA() {
  const [view,    setView]    = useState('list')
  const [branch,  setBranch]  = useState('lm')
  const [jsas,    setJsas]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await db
        .from('jsa_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setJsas(data.map(r => ({
          id:       r.id,
          branch:   r.branch,
          siteName: r.site_name,
          date:     r.jsa_date,
          tech:     r.tech_name,
          status:   r.status,
          permits:  r.permits || [],
          pdfUrl:   r.pdf_url,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (j) => {
    await db.from('jsa_submissions').insert({
      id:        j.id,
      branch:    j.branch,
      site_name: j.siteName,
      jsa_date:  j.date,
      tech_name: j.tech,
      status:    j.status,
      permits:   j.permits,
      form_data: j.formData || {},
      pdf_url:   j.pdfUrl,
    })
    setJsas(p => [j, ...p])
    setView('list')
  }

  if (view === 'new') return <NewJSAForm onSave={handleSave} onCancel={()=>setView('list')} branch={branch} />

  const bc         = BRANCH_COLORS[branch] || BRANCH_COLORS.lm
  const branchJsas = jsas.filter(j=>j.branch===branch)

  const lmCount         = jsas.filter(j => j.branch === 'lm').length
  const boltCount       = jsas.filter(j => j.branch === 'bolt').length
  const boltDallasCount = jsas.filter(j => j.branch === 'bolt-dallas').length

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════ */}
        <SectionDivider title="JSA" label="Management Overview" accent="var(--navy)" />

        <BranchTabs
          active={branch}
          onChange={setBranch}
          lmCount={lmCount}
          boltCount={boltCount}
          boltDallasCount={boltDallasCount}
        />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Total JSAs', value: branchJsas.length,                                icon: <ClipboardText size={15} weight="bold" /> },
            { label: 'Signed',     value: branchJsas.filter(j=>j.status==='signed').length,  icon: <CheckCircle size={15} weight="bold" /> },
            { label: 'Draft',      value: branchJsas.filter(j=>j.status==='draft').length,   icon: <FileText size={15} weight="bold" />, alert: branchJsas.filter(j=>j.status==='draft').length > 0 },
          ].map(s => (
            <div
              key={s.label}
              className="dfl-summary-card"
              style={s.alert && s.value > 0 ? { borderColor: '#FCD34D' } : {}}
            >
              <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? '#B45309' : bc.bgActive }}>
                {s.icon}
              </div>
              <div>
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? '#B45309' : 'var(--text-1)' }}>
                  {s.value}
                </div>
                <div className="dfl-summary-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* JSA list */}
        <div className="dash-card">
          <div
            className="dash-card-head"
            style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
          >
            <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ClipboardText size={14} />
              Job Safety Analyses
            </span>
            <span className="dash-card-meta">{branchJsas.length} record{branchJsas.length !== 1 ? 's' : ''}</span>
          </div>
          {loading
            ? <div className="dfl-empty-state">Loading…</div>
            : branchJsas.length === 0
              ? <div className="dfl-empty-state">
                  <ClipboardText size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>No JSAs for this branch yet</div>
                </div>
              : branchJsas.map(j => <JSARow key={j.id} jsa={j} />)
          }
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--text-3)', lineHeight: 1.6 }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>LMC-Form-000-008 · </span>
          Job Safety Analysis — required before any field work begins. Submitted PDFs are stored in Supabase and accessible via View PDF.
        </div>

        {/* ══ FIELD ══════════════════════════════════════════════════════════ */}
        <SectionDivider title="JSA" label="Field Overview" accent="var(--navy)" />

        <div style={{ display: 'flex', gap: 'var(--gap-sm)' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => setView('new')}
          >
            <Plus size={14} weight="bold" />
            New JSA
          </button>
        </div>

      </div>
    </div>
  )
}
