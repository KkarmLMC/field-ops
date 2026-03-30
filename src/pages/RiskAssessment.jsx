import { useState, useEffect } from 'react'
import {
  Plus, MapPin, X, CheckCircle,
  Warning, ArrowLeft, Crosshair, SpinnerGap, ChartBar,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Shared section styles using CSS tokens ────────────────────────────────────
const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-l)', marginBottom: '0.75rem', overflow: 'hidden',
  },
  cardHead: {
    padding: '0.625rem 0.875rem', background: 'var(--navy)',
    fontFamily: 'var(--mono)', fontSize: 'var(--text-xs)',
    color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  cardBody: { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: {
    fontFamily: 'var(--mono)', fontSize: 'var(--text-xs)',
    color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.1em',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--border)',
  },
}

// ─── NFPA 780 Annex L factor tables ───────────────────────────────────────────
const C1_OPTIONS = [
  { label: 'On hilltop — no other structures or trees',            value: 2.0  },
  { label: 'No other structures or trees within collection area',  value: 1.0  },
  { label: 'Structures/trees of equal or lesser height nearby',    value: 0.5  },
  { label: 'Structures/trees of greater height within area',       value: 0.25 },
]
const C2_OPTIONS = [
  { label: 'Metal',       value: 0.5 },
  { label: 'Nonmetallic', value: 1.0 },
  { label: 'Combustible', value: 2.0 },
]
const C3_OPTIONS = [
  { label: 'Metal',       value: 0.5 },
  { label: 'Nonmetallic', value: 1.0 },
  { label: 'Combustible', value: 2.0 },
]
const C4_OPTIONS = [
  { label: 'Low value and noncombustible',                          value: 0.5 },
  { label: 'Standard value and noncombustible',                     value: 1.0 },
  { label: 'High value, moderate combustibility',                   value: 2.0 },
  { label: 'Exceptional value — flammable liquids / electronics',   value: 3.0 },
  { label: 'Exceptional value — irreplaceable cultural items',      value: 4.0 },
]
const C5_OPTIONS = [
  { label: 'Unoccupied',                          value: 0.5 },
  { label: 'Normally occupied',                   value: 1.0 },
  { label: 'Difficult to evacuate / risk of panic', value: 3.0 },
]
const C6_OPTIONS = [
  { label: 'Continuity not required, no environmental impact',        value: 1.0 },
  { label: 'Continuity of services required, no environmental impact', value: 1.5 },
  { label: 'Consequences to the environment',                          value: 2.0 },
]

// ─── Calculations ─────────────────────────────────────────────────────────────
function calcAe(lFt, wFt, hFt) {
  const L = lFt * 0.3048, W = wFt * 0.3048, H = hFt * 0.3048
  return (L * W) + (2 * L * 3 * H) + (2 * W * 3 * H) + Math.PI * (3 * H) ** 2
}
const calcNd = (Ng, Ae) => Ng * Ae * 1e-6
const calcNc = (c1,c2,c3,c4,c5,c6) => 1.5e-3 / (c1*c2*c3*c4*c5*c6)

// ─── Shared sub-components ────────────────────────────────────────────────────
function FieldLabel({ label, hint }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'var(--mar-xs)' }}>
      <label style={S.label}>{label}</label>
      {hint && <span style={{ fontSize:'var(--text-xs)', color:'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

function CardSection({ title, children }) {
  return (
    <div style={S.card}>
      <div style={S.cardHead}>{title}</div>
      <div style={S.cardBody}>{children}</div>
    </div>
  )
}

function ResultBadge({ result, ratio }) {
  const req = result === 'required'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'0.25rem',
      padding:'0.1875rem 0.625rem', borderRadius:'var(--r-s)',
      fontFamily:'var(--mono)', fontSize:'var(--text-xs)', fontWeight:600,
      letterSpacing:'0.05em', textTransform:'uppercase',
      background: req ? 'var(--red-soft)' : 'var(--success-soft)',
      color:       req ? 'var(--red)'     : 'var(--success)',
    }}>
      {req ? <Warning size={11} /> : <CheckCircle size={11} />}
      {req ? 'LPS Required' : 'LPS Optional'}
      {ratio != null && ` · ${ratio.toFixed(2)}`}
    </span>
  )
}

// ─── New Assessment Form ───────────────────────────────────────────────────────
const EMPTY = {
  siteName:'', address:'', techName:'', branch:'bolt',
  lengthFt:'', widthFt:'', heightFt:'', flashDensity:'',
  c1:'', c2:'', c3:'', c4:'', c5:'', c6:'',
}

function NewAssessmentForm({ onSave, onCancel }) {
  const [form,     setForm]     = useState(EMPTY)
  const [locating, setLocating] = useState(false)
  const [result,   setResult]   = useState(null)
  const [saving,   setSaving]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleGPS = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: lat } }) => {
        let d = 4
        if (lat < 28) d = 8
        else if (lat < 32) d = 6
        else if (lat < 36) d = 4
        else if (lat < 40) d = 3
        else d = 2
        set('flashDensity', d)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const allFilled = ['lengthFt','widthFt','heightFt','flashDensity','c1','c2','c3','c4','c5','c6']
    .every(k => form[k] !== '' && form[k] != null)

  const calculate = () => {
    const { lengthFt: l, widthFt: w, heightFt: h, flashDensity: ng, c1,c2,c3,c4,c5,c6 } = form
    const Ae    = calcAe(+l, +w, +h)
    const Nd    = calcNd(+ng, Ae)
    const Nc    = calcNc(+c1, +c2, +c3, +c4, +c5, +c6)
    const ratio = Nd / Nc
    setResult({ Nd, Nc, ratio, required: ratio >= 1.0 })
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    const row = {
      branch:        form.branch,
      site_name:     form.siteName || 'Unnamed Site',
      address:       form.address,
      tech_name:     form.techName,
      assessed_date: new Date().toISOString().slice(0,10),
      nd:            result.Nd,
      nc:            result.Nc,
      ratio:         result.ratio,
      result:        result.required ? 'required' : 'not-required',
      form_data:     form,
    }
    const { data, error } = await db.from('risk_assessments').insert(row).select().single()
    setSaving(false)
    onSave({
      id:       data?.id || `ra-${Date.now()}`,
      siteName: form.siteName || 'Unnamed Site',
      address:  form.address,
      date:     row.assessed_date,
      tech:     form.techName,
      branch:   form.branch,
      nd:       result.Nd,
      nc:       result.Nc,
      ratio:    result.ratio,
      result:   row.result,
    })
  }

  return (
    <div className="page-content fade-in">
      {/* Back header */}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--gap-m)', marginBottom: 'var(--mar-l)' }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:'var(--gap-xs)', color:'var(--black)', fontSize:'var(--text-md)' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width:'1px', height:'1rem', background:'var(--border)' }} />
        <span style={{ ...S.label }}>NFPA 780 Annex L</span>
      </div>

      {/* Site info */}
      <CardSection title="Site Information">
        <div>
          <FieldLabel label="Site Name" />
          <input value={form.siteName} onChange={e=>set('siteName',e.target.value)} placeholder="e.g. Ritz-Carlton Amelia Island" style={{ width:'100%' }} />
        </div>
        <div>
          <FieldLabel label="Address" />
          <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Street address" style={{ width:'100%' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--gap-m)' }}>
          <div>
            <FieldLabel label="Technician" />
            <input value={form.techName} onChange={e=>set('techName',e.target.value)} placeholder="Your name" style={{ width:'100%' }} />
          </div>
          <div>
            <FieldLabel label="Branch" />
            <select value={form.branch} onChange={e=>set('branch',e.target.value)} style={{ width:'100%' }}>
              <option value="lm">Lightning Master</option>
              <option value="bolt">Bolt Lightning</option>
            </select>
          </div>
        </div>
      </CardSection>

      {/* Dimensions */}
      <CardSection title="Structure Dimensions">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--gap-m)' }}>
          {[['lengthFt','Length (ft)'],['widthFt','Width (ft)'],['heightFt','Height (ft)']].map(([k,l]) => (
            <div key={k}>
              <FieldLabel label={l} />
              <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="0" style={{ width:'100%' }} />
            </div>
          ))}
        </div>
      </CardSection>

      {/* Flash density */}
      <CardSection title="Lightning Ground Flash Density (Ng)">
        <div style={{ display:'flex', gap:'var(--gap-s)', alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <FieldLabel label="Flashes / km² / year" hint="From NOAA Keraunic map" />
            <input type="number" step="0.1" value={form.flashDensity} onChange={e=>set('flashDensity',e.target.value)} placeholder="e.g. 6" style={{ width:'100%' }} />
          </div>
          <button onClick={handleGPS} disabled={locating} style={{
            display:'flex', alignItems:'center', gap:'0.5rem',
            padding:'0.5rem 0.75rem', borderRadius:'var(--r-s)',
            background:'var(--bg)', fontSize:'var(--text-sm)', color:'var(--blue)', whiteSpace:'nowrap',
            flexShrink:0, marginBottom:'1px', transition:'all var(--ease-fast)',
          }}>
            {locating ? <SpinnerGap size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Crosshair size={13} />}
            {locating ? 'Locating…' : 'Suggest by GPS'}
          </button>
        </div>
        <p style={{ fontSize:'var(--text-sm)', color:'var(--text-3)', lineHeight:1.5, margin:0 }}>
          Typical: Florida 6–9 · Gulf Coast 4–7 · Southeast 3–5 · Northeast 1–3 · Texas 3–6
        </p>
      </CardSection>

      {/* Risk factors */}
      <CardSection title="Risk Factors — Annex L Table L.1">
        {[
          ['c1','C1 — Location / Surroundings',         C1_OPTIONS],
          ['c2','C2 — Structure Construction Material',  C2_OPTIONS],
          ['c3','C3 — Roof Material',                    C3_OPTIONS],
          ['c4','C4 — Structure Contents',               C4_OPTIONS],
          ['c5','C5 — Occupancy',                        C5_OPTIONS],
          ['c6','C6 — Lightning Consequence',            C6_OPTIONS],
        ].map(([k, l, opts]) => (
          <div key={k}>
            <FieldLabel label={l} />
            <select value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:'100%' }}>
              <option value="">Select…</option>
              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </CardSection>

      {/* Calculate */}
      {!result && (
        <button onClick={calculate} disabled={!allFilled} style={{
          width:'100%', padding:'0.75rem', borderRadius:'var(--r-m)',
          marginBottom: 'var(--mar-m)',
          background: allFilled ? 'var(--red)' : 'var(--bg)',
          color:       allFilled ? '#fff'       : 'var(--text-3)',
          fontFamily:'var(--mono)', fontSize:'var(--text-sm)', fontWeight:600,
          letterSpacing:'0.06em', textTransform:'uppercase',
          border:`1px solid ${allFilled ? 'var(--red)' : 'var(--border)'}`,
          transition:'all var(--ease-fast)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
        }}>
          <ChartBar size={14} /> Calculate Risk Score
        </button>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: result.required ? 'var(--red-soft)'  : 'var(--success-soft)',
          border:`1px solid ${result.required ? 'var(--red)' : 'var(--success)'}`,
          borderRadius:'var(--r-l)', padding:'1rem', marginBottom: 'var(--mar-m)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--mar-m)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--gap-s)' }}>
              {result.required
                ? <Warning size={20} style={{ color:'var(--red)' }} />
                : <CheckCircle size={20} style={{ color:'var(--success)' }} />
              }
              <span style={{ fontFamily:'var(--font)', fontSize:'var(--text-xl)', fontWeight:700, color: result.required ? 'var(--red)' : 'var(--success)' }}>
                {result.required ? 'LPS Required' : 'LPS Not Required'}
              </span>
            </div>
            <button onClick={()=>setResult(null)} style={{ color:'var(--text-3)' }}><X size={16} /></button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--gap-s)', marginBottom: 'var(--mar-m)' }}>
            {[
              { label:'Nd (Strikes/yr)',    val: result.Nd.toExponential(2)    },
              { label:'Nc (Tolerable)',     val: result.Nc.toExponential(2)    },
              { label:'Nd / Nc Ratio',      val: result.ratio.toFixed(3)       },
            ].map(({ label, val }) => (
              <div key={label} style={{ background:'rgba(0,0,0,0.06)', borderRadius:'var(--r-s)', padding:'0.5rem 0.625rem' }}>
                <div style={{ ...S.label, fontSize:'var(--blackxs)', marginBottom:'var(--mar-xs)' }}>{label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'var(--text-md)', fontWeight:600, color:'var(--black)' }}>{val}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize:'var(--text-sm)', color:'var(--black)', marginBottom:'var(--mar-m)', lineHeight:1.5 }}>
            {result.required
              ? `Nd/Nc = ${result.ratio.toFixed(3)} ≥ 1.0 — Expected strikes exceed tolerable risk. LPS recommended per NFPA 780.`
              : `Nd/Nc = ${result.ratio.toFixed(3)} < 1.0 — Within tolerable risk. LPS is optional but may still be advisable.`
            }
          </p>

          <div style={{ display:'flex', gap:'var(--gap-s)' }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex:1, padding:'0.625rem', borderRadius:'var(--r-s)',
              background:'var(--red)', color:'#fff',
              fontFamily:'var(--mono)', fontSize:'var(--text-xs)', fontWeight:600,
              letterSpacing:'0.06em', textTransform:'uppercase',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
            }}>
              {saving ? <SpinnerGap size={13} style={{ animation:'spin 1s linear infinite' }} /> : null}
              {saving ? 'Saving…' : 'Save Assessment'}
            </button>
            <button onClick={()=>setResult(null)} style={{
              padding:'0.625rem 0.875rem', borderRadius:'var(--r-s)',
              background:'var(--white)', fontFamily:'var(--mono)', fontSize:'var(--text-xs)', color:'var(--text-3)',
            }}>
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Assessment row ────────────────────────────────────────────────────────────
function AssessmentRow({ a }) {
  const req = a.result === 'required'
  return (
    <div style={{ ...S.row, cursor:'default' }}>
      <div style={{
        width:'2.25rem', height:'2.25rem', borderRadius:'var(--r-m)', flexShrink:0,
        background: req ? 'var(--red-soft)' : 'var(--success-soft)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {req ? <Warning size={16} style={{ color:'var(--red)' }} /> : <CheckCircle size={16} style={{ color:'var(--success)' }} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'var(--text-md)', marginBottom:'0.125rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {a.siteName}
        </div>
        <div style={{ fontSize:'var(--text-sm)', color:'var(--text-3)', display:'flex', alignItems:'center', gap:'var(--gap-xs)' }}>
          <MapPin size={10} />{a.address}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <ResultBadge result={a.result} ratio={a.ratio} />
        <div style={{ fontSize:'var(--text-xs)', color:'var(--text-3)', marginTop:'var(--mar-xs)', fontFamily:'var(--mono)' }}>
          {a.date} · {a.tech}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const [view,        setView]        = useState('list')
  const [branch,      setBranch]      = useState('lm')
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    db.from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setAssessments(data.map(r => ({
            id:       r.id,
            siteName: r.site_name,
            address:  r.address,
            date:     r.assessed_date,
            tech:     r.tech_name,
            branch:   r.branch,
            nd:       r.nd,
            nc:       r.nc,
            ratio:    r.ratio,
            result:   r.result,
          })))
        }
        setLoading(false)
      })
  }, [])

  const handleSave = (a) => {
    setAssessments(prev => [a, ...prev])
    setView('list')
  }

  if (view === 'new') return <NewAssessmentForm onSave={handleSave} onCancel={()=>setView('list')} />

  const bc             = BRANCH_COLORS[branch] || BRANCH_COLORS.lm
  const branchAssess   = assessments.filter(a => a.branch === branch)
  const required       = branchAssess.filter(a => a.result === 'required').length
  const optional       = branchAssess.filter(a => a.result === 'not-required').length

  const lmCount         = assessments.filter(a => a.branch === 'lm').length
  const boltCount       = assessments.filter(a => a.branch === 'bolt').length

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════ */}
        <SectionDivider title="Risk Assessment" label="Management Overview" accent="var(--navy)" />

        <BranchTabs
          active={branch}
          onChange={setBranch}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Total',        value: branchAssess.length, icon: <ChartBar size={15} weight="bold" /> },
            { label: 'LPS Required', value: required,            icon: <Warning size={15} weight="bold" />,    alert: required > 0 },
            { label: 'LPS Optional', value: optional,            icon: <CheckCircle size={15} weight="bold" /> },
          ].map(s => (
            <div
              key={s.label}
              className="dfl-summary-card"
              style={s.alert && s.value > 0 ? { borderColor: 'var(--warning-border)' } : {}}
            >
              <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : bc.bgActive }}>
                {s.icon}
              </div>
              <div>
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : 'var(--black)' }}>
                  {s.value}
                </div>
                <div className="dfl-summary-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assessments list */}
        <div className="dash-card">
          <div
            className="dash-card-head"
            style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
          >
            <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ChartBar size={14} />
              Site Assessments
            </span>
            <span className="dash-card-meta">{branchAssess.length} record{branchAssess.length !== 1 ? 's' : ''}</span>
          </div>
          {loading
            ? <div className="dfl-empty-state">Loading…</div>
            : branchAssess.length === 0
              ? <div className="dfl-empty-state">
                  <ChartBar size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>No assessments for this branch yet</div>
                </div>
              : branchAssess.map(a => <AssessmentRow key={a.id} a={a} />)
          }
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 1.6, padding: '0.625rem 0.875rem', background: 'var(--white)', borderRadius: 'var(--r-m)', margin: 0 }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--black)' }}>NFPA 780 Annex L · </span>
          Simplified assessment. Nd/Nc ≥ 1.0 indicates LPS is recommended. Statutory and insurance requirements take precedence.
        </p>

        {/* ══ FIELD ══════════════════════════════════════════════════════════ */}
        <SectionDivider title="Risk Assessment" label="Field Overview" accent="var(--navy)" />

        <div style={{ display: 'flex', gap: 'var(--gap-s)' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => setView('new')}
          >
            <Plus size={14} weight="bold" />
            New Assessment
          </button>
        </div>

      </div>
    </div>
  )
}
