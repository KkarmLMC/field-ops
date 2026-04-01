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
      <div className="page-content fade-in form-page-c1db">
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
          <button className="btn btn-primary mt-l" onClick={()=>navigate('/forms')}>Back to Forms</button>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-content fade-in form-page-be03">
        <CheckCircle size="3.25rem" style={{ color: success.offline ? 'var(--warning)' : 'var(--state-success)', marginBottom:'var(--space-m)' }} />
        <div className="form-page-1c4d">
          {success.offline ? 'Saved Locally' : 'Form Submitted'}
        </div>
        <div className="form-page-b120">
          {success.offline
            ? `${success.formTitle} for ${success.siteName} has been queued and will sync when you're back online.`
            : `${success.formTitle} for ${success.siteName} has been saved.`
          }</div>
        <div className="form-page-41bf">
          <button onClick={()=>navigate('/forms')}
            className="form-page-cf01">
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
      <div className="form-page-fae0">
        {schema.ref
          ? <div className="form-page-e7af">{schema.ref}</div>
          : <div />
        }
        <button
          onClick={() => navigate(`/forms/builder?slug=${formType}`)}
          className="form-edit-btn">
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
            <div className="form-page-9566">
              {submitErr}
            </div>
          )}
          {Object.keys(errors).length > 0 && (
            <div className="form-page-9566">
              Please fill in all required fields before submitting.
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width:'100%', padding:'0.75rem', borderRadius:'var(--radius-m)', marginBottom:'2rem',
            background: submitting?'var(--surface-hover)':'var(--state-error)',
            color: submitting?'var(--text-muted)':'#fff',
            fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)', fontWeight:600,
            letterSpacing:'0.06em', textTransform:'uppercase',
            border:`1px solid ${submitting?'var(--border-subtle)':'var(--state-error)'}`,
            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
            transition:'all var(--ease-fast)' }}>
            {submitting
              ? <><SpinnerGap size="0.875rem" className="anim-spin" /> Submitting…</>
              : <><CheckCircle size="0.875rem" /> Submit Form</>
            }
          </button>
        </>
      )}
    </div>
  )
}
