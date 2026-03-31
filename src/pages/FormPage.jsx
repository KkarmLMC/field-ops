import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, SpinnerGap, PencilSimple } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import FormEngine, { validateSchema } from '../components/FormEngine.jsx'
import MultiPageForm from '../components/MultiPageForm.jsx'
import TabbedForm from '../components/TabbedForm.jsx'
import { queueSubmission, getCachedForm, cacheFormSchemas } from '../lib/offline.js'

export default function FormPage() {
  const { formType } = useParams()
  const navigate     = useNavigate()

  const [schema,     setSchema]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [values,     setValues]     = useState({ date_completed: new Date().toISOString().slice(0,10) })
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState(null)
  const [success,    setSuccess]    = useState(null)
  const [savedOffline, setSavedOffline] = useState(false)

  // Fetch schema from Supabase, fall back to IndexedDB cache if offline
  useEffect(() => {
    db.from('form_definitions')
      .select('*')
      .eq('slug', formType)
      .eq('active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Try cached version
          getCachedForm(formType).then(cached => {
            if (cached) setSchema(cached)
            setLoading(false)
          })
          return
        }
        setSchema(data)
        cacheFormSchemas([data]) // Cache for offline use
        setLoading(false)
      })
      .catch(async () => {
        const cached = await getCachedForm(formType)
        if (cached) setSchema(cached)
        setLoading(false)
      })
  }, [formType])

  const handleChange = (fieldId, value) => {
    setValues(v => ({ ...v, [fieldId]: value }))
    if (errors[fieldId]) setErrors(e => { const n={...e}; delete n[fieldId]; return n })
  }

  const handleSubmit = async () => {
    const validationErrors = validateSchema(schema, values)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      const firstErrId = Object.keys(validationErrors)[0]
      document.getElementById(`field-${firstErrId}`)?.scrollIntoView({ behavior:'smooth', block:'center' })
      return
    }

    setSubmitting(true)
    setSubmitErr(null)

    const payload = {
      form_slug:    formType,
      branch:       values.branch || 'lm',
      job_number:   values.job_number || null,
      site_name:    values.site_name || null,
      submitted_by: values.tech_name || null,
      status:       'submitted',
      form_data:    values }

    try {
      const { data, error } = await db.from('form_submissions_v2').insert(payload).select().single()
      if (error) throw error
      setSuccess({ siteName: values.site_name || 'Site', formTitle: schema.title })
    } catch {
      // If offline or network error — queue locally
      if (!navigator.onLine) {
        await queueSubmission(payload)
        setSavedOffline(true)
        setSuccess({ siteName: values.site_name || 'Site', formTitle: schema.title, offline: true })
      } else {
        setSubmitErr('Submission failed. Check your connection and try again.')
      }
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-content fade-in" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'12rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!schema) {
    return (
      <div className="page-content fade-in">
        <div className="empty">
          <div className="empty-title">Form not found</div>
          <div className="empty-desc">The form "{formType}" could not be loaded.</div>
          <button className="btn btn-primary" style={{ marginTop: 'var(--mar-l)' }} onClick={()=>navigate('/forms')}>Back to Forms</button>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--pad-xxl) var(--pad-xxl)', textAlign:'center' }}>
        <CheckCircle size="3.25rem" style={{ color: success.offline ? 'var(--warning)' : 'var(--success)', marginBottom:'var(--mar-m)' }} />
        <div style={{ fontSize:'var(--text-xl)', fontWeight:700, marginBottom:'var(--mar-s)' }}>
          {success.offline ? 'Saved Locally' : 'Form Submitted'}
        </div>
        <div style={{ color:'var(--black)', fontSize:'var(--text-md)', marginBottom:'var(--mar-xxl)' }}>
          {success.offline
            ? `${success.formTitle} for ${success.siteName} has been queued and will sync when you're back online.`
            : `${success.formTitle} for ${success.siteName} has been saved.`
          }</div>
        <div style={{ display:'flex', gap:'var(--gap-m)' }}>
          <button onClick={()=>navigate('/forms')}
            style={{ padding: 'var(--pad-s) var(--pad-xl)', borderRadius:'var(--r-m)', background: 'var(--white)', fontSize:'var(--text-sm)', color:'var(--black)' }}>
            Back to Forms
          </button>
          <button className="btn btn-primary" onClick={()=>{ setSuccess(null); setValues({ date_completed: new Date().toISOString().slice(0,10) }) }}>
            New Submission
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-content fade-in">
      {/* Action bar — ref tag + Edit Form button */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--mar-l)' }}>
        {schema.ref
          ? <div style={{ fontFamily:'var(--mono)', fontSize:'var(--text-xs)', color:'var(--black)' }}>{schema.ref}</div>
          : <div />
        }
        <button
          onClick={() => navigate(`/forms/builder?slug=${formType}`)}
          style={{ display:'flex', alignItems:'center', gap:'var(--gap-xs)', padding: 'var(--pad-xs) var(--pad-m)', borderRadius:'var(--r-s)', fontSize:'var(--text-xs)', color:'var(--black)', background: 'var(--white)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          <PencilSimple size="0.75rem" /> Edit Form
        </button>
      </div>

      {schema.form_mode === 'index' ? (
        <MultiPageForm
          schema={schema}
          values={values}
          onChange={handleChange}
          errors={errors}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitErr={submitErr}
        />
      ) : schema.form_mode === 'tabbed' ? (
        <TabbedForm
          schema={schema}
          values={values}
          onChange={handleChange}
          errors={errors}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitErr={submitErr}
        />
      ) : (
        /* ── Single-scroll mode (existing behaviour) ──────────────────── */
        <>
          <FormEngine
            schema={schema}
            values={values}
            onChange={handleChange}
            errors={errors}
          />

          {submitErr && (
            <div style={{ padding: 'var(--pad-m) var(--pad-l)', marginBottom: 'var(--mar-m)', background:'var(--red-soft)', borderRadius:'var(--r-m)', fontSize:'var(--text-sm)', color:'var(--red)' }}>
              {submitErr}
            </div>
          )}
          {Object.keys(errors).length > 0 && (
            <div style={{ padding: 'var(--pad-m) var(--pad-l)', marginBottom: 'var(--mar-m)', background:'var(--red-soft)', borderRadius:'var(--r-m)', fontSize:'var(--text-sm)', color:'var(--red)' }}>
              Please fill in all required fields before submitting.
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width:'100%', padding:'0.75rem', borderRadius:'var(--r-m)', marginBottom:'2rem',
            background: submitting?'var(--hover)':'var(--red)',
            color: submitting?'var(--text-3)':'#fff',
            fontFamily:'var(--mono)', fontSize:'var(--text-xs)', fontWeight:600,
            letterSpacing:'0.06em', textTransform:'uppercase',
            border:`1px solid ${submitting?'var(--border-l)':'var(--red)'}`,
            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
            transition:'all var(--ease-fast)' }}>
            {submitting
              ? <><SpinnerGap size="0.875rem" style={{ animation:'spin 1s linear infinite' }} /> Submitting…</>
              : <><CheckCircle size="0.875rem" /> Submit Form</>
            }
          </button>
        </>
      )}
    </div>
  )
}
