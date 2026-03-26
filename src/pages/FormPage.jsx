import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CompletionFormView, SuccessView } from './Forms'

// ─── Full-page wrapper for /forms/:formType ────────────────────────────────────
// Renders the completion form as its own route so the DesktopTopBar shows the
// form title + back button automatically via getPageMeta in App.jsx.
export default function FormPage() {
  const { formType } = useParams()
  const navigate     = useNavigate()
  const [result, setResult] = useState(null)

  const handleSave   = (res) => setResult(res)
  const handleCancel = ()    => navigate('/forms')
  const handleBack   = ()    => navigate('/forms')

  if (result) return <SuccessView result={result} onBack={handleBack} />
  return <CompletionFormView formType={formType} onSave={handleSave} onCancel={handleCancel} />
}
