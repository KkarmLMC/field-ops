import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, SpinnerGap, PencilSimple } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import FormEngine, { validateSchema } from '../components/FormEngine.jsx'
import useRole from '../lib/useRole.js'

export default function FormPage() {
  const { formType } = useParams()
  const navigate     = useNavigate()

  const { role, isManagement } = useRole()
  const [schema,     setSchema]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [values,     setValues]     = useState({ date_completed: new Date().toISOString().slice(0,10) })
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState(null)
  const [success,    setSuccess]    = useState(null)

  // Fetch schema from Supabase
  useEffect(() => {
    db.from('form_definitions')
      .select('*')
      .eq('slug', formType)
      .eq('active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false)
          return
        }
        setSchema(data)
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
      // Scroll to first error
      const firstErrId = Object.keys(validationErrors)[0]
      document.getElementById(`field-${firstErrId}`)?.scrollIntoView({ behavior:'smooth', block:'center' })
      return
    }

    setSubmitting(true)
    setSubmitErr(null)

    try {
      const { data, error } = await db.from('form_submissions_v2').insert({
        form_slug:    formType,
        branch:       values.branch || 'lm',
        job_number:   values.job_number || null,
        site_name:    values.site_name || null,
        submitted_by: values.tech_name || null,
        status:       'submitted',
        form_data:    values,
      }).select().single()

      if (error) throw error
      setSuccess({ siteName: values.site_name || 'Site', formTitle: schema.title })
    } catch (err) {
      setSubmitErr('Submission failed. Check your connection and try again.')
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
          <button className="btn btn-primary" style={{ marginTop:'var(--sp-4)' }} onClick={()=>navigate('/forms')}>Back to Forms</button>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--sp-10) var(--sp-6)', textAlign:'center' }}>
        <CheckCircle size={52} style={{ color:'var(--green)', marginBottom:'var(--sp-3)' }} />
        <div style={{ fontSize:'var(--fs-xl)', fontWeight:700, marginBottom:'var(--sp-2)' }}>Form Submitted</div>
        <div style={{ color:'var(--text-2)', fontSize:'var(--fs-md)', marginBottom:'var(--sp-6)' }}>
          {success.formTitle} for {success.siteName} has been saved.
        </div>
        <div style={{ display:'flex', gap:'var(--sp-3)' }}>
          <button onClick={()=>navigate('/forms')}
            style={{ padding:'var(--sp-2) var(--sp-5)', borderRadius:'var(--r-md)', background:'var(--surface-raised)', border:'1px solid var(--border-l)', fontSize:'var(--fs-sm)', color:'var(--text-2)' }}>
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
        {schema.ref
          ? <div style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{schema.ref}</div>
          : <div />
        }
        {isManagement
          ? <button
              onClick={() => navigate(`/forms/builder?slug=${formType}`)}
              style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'var(--sp-1) var(--sp-3)', borderRadius:'var(--r-sm)', border:'1px solid var(--border-l)', fontSize:'var(--fs-xs)', color:'var(--text-2)', background:'var(--surface-raised)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              <PencilSimple size={12} /> Edit Form
            </button>
          : <div />
        }
      </div>

      {/* Engine renders all sections */}
      <FormEngine
        schema={schema}
        values={values}
        onChange={handleChange}
        errors={errors}
      />

      {/* Error message */}
      {submitErr && (
        <div style={{ padding:'var(--sp-3) var(--sp-4)', marginBottom:'var(--sp-3)', background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-sm)', color:'var(--red)' }}>
          {submitErr}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div style={{ padding:'var(--sp-3) var(--sp-4)', marginBottom:'var(--sp-3)', background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-sm)', color:'var(--red)' }}>
          Please fill in all required fields before submitting.
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', padding:'var(--sp-3)', borderRadius:'var(--r-md)', marginBottom:'var(--sp-8)',
        background: submitting?'var(--hover)':'var(--red)',
        color: submitting?'var(--text-3)':'#fff',
        fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase',
        border:`1px solid ${submitting?'var(--border-l)':'var(--red)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--sp-2)',
        transition:'all var(--ease-fast)',
      }}>
        {submitting
          ? <><SpinnerGap size={14} style={{ animation:'spin 1s linear infinite' }} /> Submitting…</>
          : <><CheckCircle size={14} /> Submit Form</>
        }
      </button>
    </div>
  )
}
