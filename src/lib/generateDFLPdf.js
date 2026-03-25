import { jsPDF } from 'jspdf'
import { db } from './supabase'

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`
}

function fmtHours(val) {
  if (!val) return '—'
  const h = Math.floor(val)
  const m = Math.round((val - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function check(bool) { return bool ? '✓' : '✗' }

// ─── PDF Builder ───────────────────────────────────────────────────────────────
export async function generateAndUploadDFLPdf(report) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const margin = 48
  const col = W - margin * 2
  let y = margin

  const navy  = [26, 35, 95]
  const white = [255, 255, 255]
  const light = [245, 246, 250]
  const gray  = [100, 110, 130]
  const green = [22, 163, 74]
  const red   = [220, 38, 38]
  const border = [210, 214, 220]

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...navy)
  doc.rect(0, 0, W, 72, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('LMC Field Operations', margin, 28)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Daily Field Log', margin, 44)
  doc.text(`Submitted: ${new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`, margin, 58)

  // Status badge top-right
  doc.setFillColor(...green)
  doc.roundedRect(W - margin - 72, 20, 72, 20, 4, 4, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SUBMITTED', W - margin - 36, 33, { align: 'center' })

  y = 90

  // ── Section helper ──────────────────────────────────────────────────────────
  function sectionHeader(title) {
    doc.setFillColor(...light)
    doc.rect(margin, y, col, 22, 'F')
    doc.setDrawColor(...border)
    doc.rect(margin, y, col, 22, 'S')
    doc.setTextColor(...navy)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(title.toUpperCase(), margin + 10, y + 14)
    y += 22
  }

  function row(label, value, opts = {}) {
    const labelW = opts.labelW || 150
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...gray)
    doc.text(label, margin + 10, y + 13)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 35, 50)
    const lines = doc.splitTextToSize(String(value || '—'), col - labelW - 20)
    doc.text(lines, margin + labelW, y + 13)
    const rowH = Math.max(22, lines.length * 14)
    doc.setDrawColor(...border)
    doc.line(margin, y + rowH, margin + col, y + rowH)
    y += rowH
  }

  function twoCol(pairs) {
    const half = col / 2
    doc.setFontSize(9)
    pairs.forEach(([label, value], i) => {
      const x = margin + (i % 2) * half
      if (i % 2 === 0 && i > 0) y += 22
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...gray)
      doc.text(label, x + 10, y + 13)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 35, 50)
      doc.text(String(value || '—'), x + 110, y + 13)
    })
    y += 22
    doc.setDrawColor(...border)
    doc.line(margin, y, margin + col, y)
  }

  // ── Job Information ─────────────────────────────────────────────────────────
  sectionHeader('Job Information')
  row('Customer',    report.customer)
  row('Jobsite',     report.customer_site)
  row('Job ID',      report.jobsite_id)
  row('Date',        fmtDate(report.report_date))
  row('Branch',      report.branch?.toUpperCase())
  row('GPS',         report.gps_location)
  y += 8

  // ── Crew ────────────────────────────────────────────────────────────────────
  sectionHeader('Crew Onsite')
  row('Supervisor',  report.supervisor_name || report.submitted_by)
  row('Installers',  (report.crew_on_site || []).join(', ') || 'None listed')
  y += 8

  // ── Safety Documentation ───────────────────────────────────────────────────
  sectionHeader('Safety Documentation')
  twoCol([
    ['JSA',          check(report.jsa_uploaded)   + (report.jsa_uploaded   ? '  Completed' : '  Not completed')],
    ['Man Lift',     check(report.manlift_checklist) + (report.manlift_checklist ? '  Completed' : '  Not completed')],
  ])
  twoCol([
    ['Fall Protection', check(report.fall_protection) + (report.fall_protection ? '  Completed' : '  Not completed')],
    ['', ''],
  ])
  y += 8

  // ── Work Summary ────────────────────────────────────────────────────────────
  sectionHeader('Work Summary')
  row('Time Onsite',  fmtHours(report.hours_worked))
  row('Work Types',   (report.work_types || []).join(', '))
  if (report.work_other) row('Other Work', report.work_other)
  row('Notes / Tasks', report.other_tasks)
  y += 8

  // ── Travel ──────────────────────────────────────────────────────────────────
  sectionHeader('Travel')
  twoCol([
    ['Miles Driven', report.miles_driven ? `${report.miles_driven} mi` : '—'],
    ['Drive Time',   fmtHours(report.drive_time)],
  ])
  y += 8

  // ── Sign-Off ─────────────────────────────────────────────────────────────────
  sectionHeader('Sign-Off')
  row('Supervisor',  report.supervisor_name || report.submitted_by)
  row('Signed',      report.signed ? `✓ Signed digitally` : '✗ Not signed')
  row('Submitted',   report.submitted_at ? new Date(report.submitted_at).toLocaleString() : '—')
  y += 16

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...light)
  doc.rect(0, doc.internal.pageSize.getHeight() - 36, W, 36, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text('LMC Field Operations  ·  Daily Field Log  ·  Confidential', margin, doc.internal.pageSize.getHeight() - 18)
  doc.text(`Report ID: ${report.id || 'pending'}`, W - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' })

  // ── Upload to Supabase Storage ───────────────────────────────────────────────
  const pdfBlob = doc.output('blob')
  const fileName = `dfl_${report.report_date}_${report.id || Date.now()}.pdf`
  const filePath = `reports/${fileName}`

  const { error: uploadError } = await db.storage
    .from('field-log-pdfs')
    .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true })

  if (uploadError) throw uploadError

  const { data: urlData } = db.storage
    .from('field-log-pdfs')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
