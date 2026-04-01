import { useState, useEffect } from 'react'
import {
  Plus, MapPin, X, CheckCircle,
  Warning, ArrowLeft, Crosshair, SpinnerGap, ChartBar } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.jsx'
import { logActivity } from '../lib/logActivity.js'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

const APP_SOURCE = (import.meta.env.VITE_APP_NAME || 'lmc_platform').toLowerCase().replace(/ /g, '_')

// ─── Shared section styles using CSS tokens ────────────────────────────────────
const S = {
  card: {
    background: 'var(--surface-base)',
    borderRadius: 'var(--radius-l)', marginBottom: '0.75rem', overflow: 'hidden' },
  cardHead: {
    padding: '0.625rem 0.875rem', background: 'var(--brand-primary)',
    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
    color: 'var(--surface-base)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardBody: { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: {
    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
    color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  row: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--border)' } }

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
    <div className="risk-assessment-8cd6">
      <label style={S.label}>{label}</label>
      {hint && <span className="risk-assessment-cf8d">{hint}</span>}
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
      display:'inline-flex', alignItems:'center', gap: 'var(--space-2xs)',
      padding:'0.1875rem 0.625rem', borderRadius:'var(--radius-s)',
      fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--tracking-wide)', textTransform:'uppercase',
      background: req ? 'var(--red-soft)' : 'var(--state-success-soft)',
      color:       req ? 'var(--state-error)'     : 'var(--state-success)' }}>
      {req ? <Warning size="0.6875rem" /> : <CheckCircle size="0.6875rem" />}
      {req ? 'LPS Required' : 'LPS Optional'}
      {ratio != null && ` · ${ratio.toFixed(2)}`}
    </span>
  )
}

// ─── New Assessment Form ───────────────────────────────────────────────────────
const EMPTY = {
  siteName:'', address:'', techName:'', branch:'bolt',
  lengthFt:'', widthFt:'', heightFt:'', flashDensity:'',
  c1:'', c2:'', c3:'', c4:'', c5:'', c6:'' }

function NewAssessmentForm({ onSave, onCancel }) {
  const { user } = useAuth()
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
      form_data:     form }
    const { data, error } = await db.from('risk_assessments').insert(row).select().single()
    if (!error && data) {
      logActivity(db, user?.id, APP_SOURCE, {
        category: 'risk_assessment', action: 'created',
        label: `Risk Assessment: ${form.siteName || 'Unnamed'} — ${result.required ? 'LP Required' : 'Not Required'}`,
        entity_type: 'risk_assessment', entity_id: data.id,
        meta: { site: form.siteName, result: row.result, ratio: result.ratio, nd: result.Nd, nc: result.Nc } })
    }
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
      result:   row.result })
  }

  return (
    <div className="page-content fade-in">
      {/* Back header */}
      <div className="risk-assessment-bd25">
        <button onClick={onCancel} className="risk-assessment-907c">
          <ArrowLeft size="0.875rem" /> Back
        </button>
        <div className="risk-assessment-0b8f" />
        <span style={{ ...S.label }}>NFPA 780 Annex L</span>
      </div>

      {/* Site info */}
      <CardSection title="Site Information">
        <div>
          <FieldLabel label="Site Name" />
          <input value={form.siteName} onChange={e=>set('siteName',e.target.value)} placeholder="e.g. Ritz-Carlton Amelia Island" />
        </div>
        <div>
          <FieldLabel label="Address" />
          <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Street address" />
        </div>
        <div className="risk-assessment-1741">
          <div>
            <FieldLabel label="Technician" />
            <input value={form.techName} onChange={e=>set('techName',e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <FieldLabel label="Branch" />
            <select value={form.branch} onChange={e=>set('branch',e.target.value)}>
              <option value="lm">Lightning Master</option>
              <option value="bolt">Bolt Lightning</option>
            </select>
          </div>
        </div>
      </CardSection>

      {/* Dimensions */}
      <CardSection title="Structure Dimensions">
        <div className="risk-assessment-0191">
          {[['lengthFt','Length (ft)'],['widthFt','Width (ft)'],['heightFt','Height (ft)']].map(([k,l]) => (
            <div key={k}>
              <FieldLabel label={l} />
              <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="0" />
            </div>
          ))}
        </div>
      </CardSection>

      {/* Flash density */}
      <CardSection title="Lightning Ground Flash Density (Ng)">
        <div className="risk-assessment-0e95">
          <div style={{ flex:1 }}>
            <FieldLabel label="Flashes / km² / year" hint="From NOAA Keraunic map" />
            <input type="number" step="0.1" value={form.flashDensity} onChange={e=>set('flashDensity',e.target.value)} placeholder="e.g. 6" />
          </div>
          <button onClick={handleGPS} disabled={locating} style={{
            display:'flex', alignItems:'center', gap: 'var(--space-s)',
            padding: 'var(--space-s) var(--space-m)', borderRadius:'var(--radius-s)',
            background:'var(--bg)', fontSize:'var(--text-sm)', color:'var(--state-info)', whiteSpace:'nowrap',
            flexShrink:0, marginBottom: 'var(--border-width-1)', transition:'all var(--ease-fast)' }}>
            {locating ? <SpinnerGap size="0.8125rem" className="anim-spin" /> : <Crosshair size="0.8125rem" />}
            {locating ? 'Locating…' : 'Suggest by GPS'}
          </button>
        </div>
        <p style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', lineHeight: 'var(--leading-relaxed)', margin:0 }}>
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
            <select value={form[k]} onChange={e=>set(k,e.target.value)}>
              <option value="">Select…</option>
              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </CardSection>

      {/* Calculate */}
      {!result && (
        <button onClick={calculate} disabled={!allFilled} style={{
          width:'100%', padding:'0.75rem', borderRadius:'var(--radius-m)',
          marginBottom: 'var(--space-m)',
          background: allFilled ? 'var(--state-error)' : 'var(--bg)',
          color:       allFilled ? '#fff'       : 'var(--text-muted)',
          fontFamily:'var(--font-mono)', fontSize:'var(--text-sm)', fontWeight:600,
          letterSpacing:'0.06em', textTransform:'uppercase',
          border:`1px solid ${allFilled ? 'var(--state-error)' : 'var(--border)'}`,
          transition:'all var(--ease-fast)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
          <ChartBar size="0.875rem" /> Calculate Risk Score
        </button>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: result.required ? 'var(--red-soft)'  : 'var(--state-success-soft)',
          border:`1px solid ${result.required ? 'var(--state-error)' : 'var(--state-success)'}`,
          borderRadius:'var(--radius-l)', padding:'1rem', marginBottom: 'var(--space-m)' }}>
          <div className="risk-assessment-e5f1">
            <div className="flex-gap-s">
              {result.required
                ? <Warning size="1.25rem" style={{ color:'var(--state-error)' }} />
                : <CheckCircle size="1.25rem" style={{ color:'var(--state-success)' }} />
              }
              <span style={{ fontFamily:'var(--font-body)', fontSize:'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: result.required ? 'var(--state-error)' : 'var(--state-success)' }}>
                {result.required ? 'LPS Required' : 'LPS Not Required'}
              </span>
            </div>
            <button onClick={()=>setResult(null)} style={{ color:'var(--text-muted)' }}><X size="1rem" /></button>
          </div>

          <div className="risk-assessment-b2b5">
            {[
              { label:'Nd (Strikes/yr)',    val: result.Nd.toExponential(2)    },
              { label:'Nc (Tolerable)',     val: result.Nc.toExponential(2)    },
              { label:'Nd / Nc Ratio',      val: result.ratio.toFixed(3)       },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: 'var(--overlay-bg-subtle)', borderRadius:'var(--radius-s)', padding: 'var(--space-s) var(--space-xs)' }}>
                <div style={{ ...S.label, fontSize:'var(--text-2xs)', marginBottom:'var(--space-xs)' }}>{label}</div>
                <div className="risk-assessment-af70">{val}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize:'var(--text-sm)', color:'var(--text-primary)', marginBottom:'var(--space-m)', lineHeight: 'var(--leading-relaxed)' }}>
            {result.required
              ? `Nd/Nc = ${result.ratio.toFixed(3)} ≥ 1.0 — Expected strikes exceed tolerable risk. LPS recommended per NFPA 780.`
              : `Nd/Nc = ${result.ratio.toFixed(3)} < 1.0 — Within tolerable risk. LPS is optional but may still be advisable.`
            }
          </p>

          <div className="flex-gap-s">
            <button onClick={handleSave} disabled={saving} style={{
              flex:1, padding: 'var(--space-m)', borderRadius:'var(--radius-s)',
              background:'var(--state-error)', color: 'var(--color-white)',
              fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--tracking-wide)', textTransform:'uppercase',
              display:'flex', alignItems:'center', justifyContent:'center', gap: 'var(--space-s)' }}>
              {saving ? <SpinnerGap size="0.8125rem" className="anim-spin" /> : null}
              {saving ? 'Saving…' : 'Save Assessment'}
            </button>
            <button onClick={()=>setResult(null)} style={{
              padding: 'var(--space-xs) var(--space-m)', borderRadius:'var(--radius-s)',
              background:'var(--surface-base)', fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
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
        width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', borderRadius:'var(--radius-m)', flexShrink:0,
        background: req ? 'var(--red-soft)' : 'var(--state-success-soft)',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        {req ? <Warning size="1rem" style={{ color:'var(--state-error)' }} /> : <CheckCircle size="1rem" style={{ color:'var(--state-success)' }} />}
      </div>
      <div className="content-body">
        <div style={{ fontWeight: 'var(--fw-semibold)', fontSize:'var(--text-md)', marginBottom: 'var(--space-3xs)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {a.siteName}
        </div>
        <div className="risk-assessment-34d3">
          <MapPin size="0.625rem" />{a.address}
        </div>
      </div>
      <div className="risk-assessment-b040">
        <ResultBadge result={a.result} ratio={a.ratio} />
        <div className="risk-assessment-c1e3">
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
            result:   r.result })))
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
        <SectionDivider title="Risk Assessment" label="Management Overview" accent="var(--brand-primary)" />

        <BranchTabs
          active={branch}
          onChange={setBranch}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Total',        value: branchAssess.length, icon: <ChartBar size="0.9375rem" weight="bold" /> },
            { label: 'LPS Required', value: required,            icon: <Warning size="0.9375rem" weight="bold" />,    alert: required > 0 },
            { label: 'LPS Optional', value: optional,            icon: <CheckCircle size="0.9375rem" weight="bold" /> },
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
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
                  {s.value}
                </div>
                <div className="dfl-summary-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assessments list */}
        <div className="card list-card">
          <div
            className="list-card__header"
            style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
          >
            <span className="list-card__title">
              <ChartBar size="0.875rem" />
              Site Assessments
            </span>
            <span className="list-card__meta">{branchAssess.length} record{branchAssess.length !== 1 ? 's' : ''}</span>
          </div>
          {loading
            ? <div className="dfl-empty-state">Loading…</div>
            : branchAssess.length === 0
              ? <div className="dfl-empty-state">
                  <ChartBar size="1.75rem" weight="thin" className="mb-s" />
                  <div>No assessments for this branch yet</div>
                </div>
              : branchAssess.map(a => <AssessmentRow key={a.id} a={a} />)
          }
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-loose)', padding: 'var(--space-xs) var(--space-m)', background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', margin: 0 }}>
          <span className="risk-assessment-81f3">NFPA 780 Annex L · </span>
          Simplified assessment. Nd/Nc ≥ 1.0 indicates LPS is recommended. Statutory and insurance requirements take precedence.
        </p>

        {/* ══ FIELD ══════════════════════════════════════════════════════════ */}
        <SectionDivider title="Risk Assessment" label="Field Overview" accent="var(--brand-primary)" />

        <div className="flex-gap-s">
          <button
            className="btn btn-primary"
            className="content-body flex-gap-s"
            onClick={() => setView('new')}
          >
            <Plus size="0.875rem" weight="bold" />
            New Assessment
          </button>
        </div>

      </div>
    </div>
  )
}
