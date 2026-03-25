import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightning, Plus, MapPin, Buildings, X, CheckCircle,
  Warning, CaretRight, ArrowLeft, Crosshair, SpinnerGap,
  ChartBar, FileText, Calendar,
} from '@phosphor-icons/react'

// ─── NFPA 780 Annex L Scoring Tables ──────────────────────────────────────────
// Location factor (C1) based on surroundings
const C1_OPTIONS = [
  { label: 'On hilltop — no other structures or trees', value: 2.0 },
  { label: 'No other structures or trees within collection area', value: 1.0 },
  { label: 'Structures/trees of equal or lesser height nearby', value: 0.5 },
  { label: 'Structures/trees of greater height within collection area', value: 0.25 },
]

// Structure material factor (C2)
const C2_OPTIONS = [
  { label: 'Metal', value: 0.5 },
  { label: 'Nonmetallic', value: 1.0 },
  { label: 'Combustible', value: 2.0 },
]

// Roof material factor (C3)
const C3_OPTIONS = [
  { label: 'Metal', value: 0.5 },
  { label: 'Nonmetallic', value: 1.0 },
  { label: 'Combustible', value: 2.0 },
]

// Contents factor (C4)
const C4_OPTIONS = [
  { label: 'Low value and noncombustible', value: 0.5 },
  { label: 'Standard value and noncombustible', value: 1.0 },
  { label: 'High value, moderate combustibility', value: 2.0 },
  { label: 'Exceptional value — flammable liquids / electronics', value: 3.0 },
  { label: 'Exceptional value — irreplaceable cultural items', value: 4.0 },
]

// Occupancy factor (C5)
const C5_OPTIONS = [
  { label: 'Unoccupied', value: 0.5 },
  { label: 'Normally occupied', value: 1.0 },
  { label: 'Difficult to evacuate or risk of panic', value: 3.0 },
]

// Lightning consequence factor (C6)
const C6_OPTIONS = [
  { label: 'Continuity not required, no environmental impact', value: 1.0 },
  { label: 'Continuity of services required, no environmental impact', value: 1.5 },
  { label: 'Consequences to the environment', value: 2.0 },
]

// ─── Calculation ───────────────────────────────────────────────────────────────
// Collection area Ae (m²) for a flat-roof structure
function calcAe(lengthFt, widthFt, heightFt) {
  const L = lengthFt * 0.3048
  const W = widthFt  * 0.3048
  const H = heightFt * 0.3048
  return (L * W) + (2 * L * 3 * H) + (2 * W * 3 * H) + Math.PI * (3 * H) ** 2
}

// Expected strikes per year: Nd = Ng * Ae * 10^-6
function calcNd(Ng, Ae) {
  return Ng * Ae * 1e-6
}

// Tolerable risk factor: Nc = 1.5e-3 / (C1*C2*C3*C4*C5*C6)
function calcNc(c1, c2, c3, c4, c5, c6) {
  return 1.5e-3 / (c1 * c2 * c3 * c4 * c5 * c6)
}

// ─── Mock saved assessments ────────────────────────────────────────────────────
const MOCK_ASSESSMENTS = [
  {
    id: 'ra-001', siteName: 'Ritz-Carlton Amelia Island', address: '4750 Amelia Island Pkwy',
    date: '2026-03-20', tech: 'Marcus Webb', nd: 0.0042, nc: 0.0030, ratio: 1.40,
    result: 'required', branch: 'bolt',
  },
  {
    id: 'ra-002', siteName: 'Nassau County Courthouse', address: '76 S 4th St, Fernandina Beach',
    date: '2026-03-18', tech: 'Tamika Russell', nd: 0.0018, nc: 0.0030, ratio: 0.60,
    result: 'not-required', branch: 'bolt',
  },
  {
    id: 'ra-003', siteName: 'WestRock Paper Mill', address: '1500 N 8th St, Fernandina Beach',
    date: '2026-03-15', tech: 'Priya Nair', nd: 0.0091, nc: 0.0019, ratio: 4.79,
    result: 'required', branch: 'lm',
  },
]

// ─── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  siteName: '', address: '', techName: '', branch: 'bolt',
  lengthFt: '', widthFt: '', heightFt: '',
  flashDensity: '',
  c1: '', c2: '', c3: '', c4: '', c5: '', c6: '',
}

// ─── Result badge ──────────────────────────────────────────────────────────────
function ResultBadge({ result, ratio }) {
  const required = result === 'required'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 3,
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      background: required ? 'var(--red-dim)' : 'var(--green-dim)',
      color: required ? 'var(--red)' : 'var(--green)',
    }}>
      {required ? <Warning size={11} /> : <CheckCircle size={11} />}
      {required ? 'LPS Required' : 'LPS Optional'}
      {ratio != null && ` · ${ratio.toFixed(2)}`}
    </span>
  )
}

// ─── Field components ──────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%' }}>
      <option value="">{placeholder || 'Select…'}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── New Assessment Form ───────────────────────────────────────────────────────
function NewAssessmentForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [locating, setLocating] = useState(false)
  const [result, setResult] = useState(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // GPS → approximate flash density suggestion
  const handleGPS = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        // Rough US flash density by latitude band (flashes/km²/yr)
        // Florida ~8, Gulf Coast ~6, Southeast ~4, Mid-Atlantic ~3, Northeast ~2, Plains ~4
        let density = 4
        if (lat < 28) density = 8
        else if (lat < 32) density = 6
        else if (lat < 36) density = 4
        else if (lat < 40) density = 3
        else density = 2
        set('flashDensity', density)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const canCalculate = () => {
    const { lengthFt, widthFt, heightFt, flashDensity, c1, c2, c3, c4, c5, c6 } = form
    return [lengthFt, widthFt, heightFt, flashDensity, c1, c2, c3, c4, c5, c6].every(v => v !== '' && v !== null)
  }

  const calculate = () => {
    const { lengthFt, widthFt, heightFt, flashDensity, c1, c2, c3, c4, c5, c6 } = form
    const Ae  = calcAe(+lengthFt, +widthFt, +heightFt)
    const Nd  = calcNd(+flashDensity, Ae)
    const Nc  = calcNc(+c1, +c2, +c3, +c4, +c5, +c6)
    const ratio = Nd / Nc
    setResult({ Nd, Nc, ratio, Ae, required: ratio >= 1.0 })
  }

  const handleSave = () => {
    if (!result) return
    onSave({
      id: `ra-${Date.now()}`,
      siteName: form.siteName || 'Unnamed Site',
      address: form.address,
      date: new Date().toISOString().slice(0, 10),
      tech: form.techName,
      branch: form.branch,
      nd: result.Nd,
      nc: result.Nc,
      ratio: result.ratio,
      result: result.required ? 'required' : 'not-required',
    })
  }

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          NFPA 780 Annex L
        </span>
      </div>

      {/* Site Info */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Site Information
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Site Name">
            <input value={form.siteName} onChange={e => set('siteName', e.target.value)} placeholder="e.g. Ritz-Carlton Amelia Island" style={{ width: '100%' }} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" style={{ width: '100%' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Technician">
              <input value={form.techName} onChange={e => set('techName', e.target.value)} placeholder="Your name" style={{ width: '100%' }} />
            </Field>
            <Field label="Branch">
              <select value={form.branch} onChange={e => set('branch', e.target.value)} style={{ width: '100%' }}>
                <option value="lm">Lightning Master</option>
                <option value="bolt">Bolt Florida</option>
                <option value="bolt-dallas">Bolt Dallas</option>
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Structure Dimensions */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Structure Dimensions
        </div>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Length (ft)">
            <input type="number" value={form.lengthFt} onChange={e => set('lengthFt', e.target.value)} placeholder="ft" style={{ width: '100%' }} />
          </Field>
          <Field label="Width (ft)">
            <input type="number" value={form.widthFt} onChange={e => set('widthFt', e.target.value)} placeholder="ft" style={{ width: '100%' }} />
          </Field>
          <Field label="Height (ft)">
            <input type="number" value={form.heightFt} onChange={e => set('heightFt', e.target.value)} placeholder="ft" style={{ width: '100%' }} />
          </Field>
        </div>
      </div>

      {/* Flash Density */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Lightning Ground Flash Density (Ng)
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Field label="Flashes / km² / year" hint="From NOAA Keraunic map">
              <input
                type="number"
                step="0.1"
                value={form.flashDensity}
                onChange={e => set('flashDensity', e.target.value)}
                placeholder="e.g. 6"
                style={{ width: '100%' }}
              />
            </Field>
            <button
              onClick={handleGPS}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4,
                fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0,
                marginBottom: 1,
              }}
            >
              {locating ? <SpinnerGap size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Crosshair size={13} />}
              {locating ? 'Locating…' : 'Suggest by GPS'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Typical values: Florida 6–9 · Gulf Coast 4–7 · Southeast 3–5 · Northeast 1–3 · Texas 3–6
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Risk Factors — Annex L Table L.1
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="C1 — Location / Surroundings">
            <SelectField value={form.c1} onChange={v => set('c1', v)} options={C1_OPTIONS} />
          </Field>
          <Field label="C2 — Structure Construction Material">
            <SelectField value={form.c2} onChange={v => set('c2', v)} options={C2_OPTIONS} />
          </Field>
          <Field label="C3 — Roof Material">
            <SelectField value={form.c3} onChange={v => set('c3', v)} options={C3_OPTIONS} />
          </Field>
          <Field label="C4 — Structure Contents">
            <SelectField value={form.c4} onChange={v => set('c4', v)} options={C4_OPTIONS} />
          </Field>
          <Field label="C5 — Occupancy">
            <SelectField value={form.c5} onChange={v => set('c5', v)} options={C5_OPTIONS} />
          </Field>
          <Field label="C6 — Lightning Consequence">
            <SelectField value={form.c6} onChange={v => set('c6', v)} options={C6_OPTIONS} />
          </Field>
        </div>
      </div>

      {/* Calculate button */}
      {!result && (
        <button
          onClick={calculate}
          disabled={!canCalculate()}
          style={{
            width: '100%', padding: '12px', borderRadius: 5, marginBottom: 10,
            background: canCalculate() ? 'var(--accent)' : 'var(--bg-4)',
            color: canCalculate() ? '#000' : 'var(--text-muted)',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            border: `1px solid ${canCalculate() ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}
        >
          <ChartBar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Calculate Risk Score
        </button>
      )}

      {/* Result card */}
      {result && (
        <div style={{
          background: result.required ? 'var(--red-dim)' : 'var(--green-dim)',
          border: `1px solid ${result.required ? 'var(--red)' : 'var(--green)'}`,
          borderRadius: 6, padding: 16, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {result.required
                ? <Warning size={20} style={{ color: 'var(--red)' }} />
                : <CheckCircle size={20} style={{ color: 'var(--green)' }} />
              }
              <span style={{ fontFamily: 'var(--head)', fontSize: 18, fontWeight: 700, color: result.required ? 'var(--red)' : 'var(--green)' }}>
                {result.required ? 'LPS Required' : 'LPS Not Required'}
              </span>
            </div>
            <button onClick={() => setResult(null)} style={{ color: 'var(--text-dim)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Score breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Nd (Expected Strikes/yr)', val: result.Nd.toExponential(2) },
              { label: 'Nc (Tolerable Risk)', val: result.Nc.toExponential(2) },
              { label: 'Nd / Nc Ratio', val: result.ratio.toFixed(3) },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>
            {result.required
              ? `Nd/Nc = ${result.ratio.toFixed(3)} ≥ 1.0 — Expected strikes exceed tolerable risk. A lightning protection system should be installed per NFPA 780.`
              : `Nd/Nc = ${result.ratio.toFixed(3)} < 1.0 — Expected strikes are within tolerable risk. Lightning protection is optional but may still be advisable.`
            }
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: '10px', borderRadius: 4,
                background: 'var(--accent)', color: '#000',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              Save Assessment
            </button>
            <button
              onClick={() => setResult(null)}
              style={{
                padding: '10px 14px', borderRadius: 4,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
              }}
            >
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Assessment Row ────────────────────────────────────────────────────────────
function AssessmentRow({ a }) {
  const required = a.result === 'required'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderBottom: '1px solid var(--border)',
      cursor: 'default',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 4, flexShrink: 0,
        background: required ? 'var(--red-dim)' : 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {required
          ? <Warning size={16} style={{ color: 'var(--red)' }} />
          : <CheckCircle size={16} style={{ color: 'var(--green)' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.siteName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} />{a.address}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <ResultBadge result={a.result} ratio={a.ratio} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>
          {a.date} · {a.tech}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const [view, setView] = useState('list') // 'list' | 'new'
  const [assessments, setAssessments] = useState(MOCK_ASSESSMENTS)

  const handleSave = (newAssessment) => {
    setAssessments(prev => [newAssessment, ...prev])
    setView('list')
  }

  if (view === 'new') {
    return <NewAssessmentForm onSave={handleSave} onCancel={() => setView('list')} />
  }

  const required = assessments.filter(a => a.result === 'required').length
  const optional = assessments.filter(a => a.result === 'not-required').length

  return (
    <div className="page-content fade-in">

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total Assessments', val: assessments.length, color: 'var(--text)' },
          { label: 'LPS Required',      val: required,            color: 'var(--red)'  },
          { label: 'LPS Optional',      val: optional,            color: 'var(--green)'},
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--head)', fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* List card */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6 }}>
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Site Assessments
          </span>
          <button
            onClick={() => setView('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 4,
              background: 'var(--accent)', color: '#000',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            <Plus size={11} /> New Assessment
          </button>
        </div>

        {assessments.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No assessments yet — tap New Assessment to begin
          </div>
        ) : (
          assessments.map(a => <AssessmentRow key={a.id} a={a} />)
        )}
      </div>

      {/* Standard note */}
      <div style={{
        marginTop: 10, padding: '10px 14px',
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>NFPA 780 Annex L · </span>
        Simplified risk assessment. Nd/Nc ≥ 1.0 indicates LPS is recommended. Statutory, regulatory, and insurance requirements take precedence over risk assessment results.
      </div>

    </div>
  )
}
