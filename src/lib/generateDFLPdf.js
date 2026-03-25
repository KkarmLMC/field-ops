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

// ─── Main Generator ────────────────────────────────────────────────────────────
export async function generateAndUploadDFLPdf(report) {
  const doc   = new jsPDF({ unit: 'pt', format: 'letter' })
  const W     = 612
  const H     = 792
  const ML    = 40
  const CW    = W - ML * 2   // 532

  // ── Palette ──────────────────────────────────────────────────────────────────
  const NAVY     = [26,  35,  95 ]
  const NAVY2    = [42,  55, 120 ]   // slightly lighter for accents
  const NAVY_LT  = [235, 240, 255]
  const WHITE    = [255, 255, 255]
  const BG       = [248, 249, 252]
  const BORDER   = [218, 222, 232]
  const LABEL    = [107, 114, 128]
  const TEXT     = [17,  24,  39 ]
  const GREEN    = [22,  163, 74 ]
  const GREEN_BG = [240, 253, 244]
  const GREEN_BD = [134, 239, 172]
  const RED      = [220, 38,  38 ]
  const RED_BG   = [254, 242, 242]

  let y = 0

  // ── Draw a manual checkmark (jsPDF safe, no Unicode needed) ──────────────────
  function drawCheck(cx, cy, size, color) {
    doc.setDrawColor(...color)
    doc.setLineWidth(1.5)
    doc.line(cx,           cy + size * 0.5, cx + size * 0.38, cy + size * 0.85)
    doc.line(cx + size * 0.38, cy + size * 0.85, cx + size,   cy + size * 0.1)
    doc.setLineWidth(0.5)
  }
  function drawCross(cx, cy, size, color) {
    doc.setDrawColor(...color)
    doc.setLineWidth(1.5)
    doc.line(cx, cy, cx + size, cy + size)
    doc.line(cx + size, cy, cx, cy + size)
    doc.setLineWidth(0.5)
  }

  // ── Page overflow → new page with repeated footer ────────────────────────────
  function checkPage(needed = 32) {
    if (y + needed > H - 48) {
      drawPageFooter()
      doc.addPage()
      y = 40
    }
  }

  function drawPageFooter() {
    const ph = doc.internal.pageSize.getHeight()
    doc.setFillColor(...BG)
    doc.rect(0, ph - 34, W, 34, 'F')
    doc.setDrawColor(...BORDER)
    doc.line(0, ph - 34, W, ph - 34)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...LABEL)
    doc.text('LMC Field Operations  ·  Daily Field Log  ·  Confidential Internal Document', ML, ph - 14)
    const shortId = (report.id || 'pending').toString().substring(0, 8).toUpperCase()
    doc.text(`Report #${shortId}`, W - ML, ph - 14, { align: 'right' })
    const pg = doc.internal.getNumberOfPages()
    doc.text(`Page ${pg}`, W / 2, ph - 14, { align: 'center' })
  }

  // ── Section heading ───────────────────────────────────────────────────────────
  function sectionHead(title) {
    checkPage(28)
    // left accent bar
    doc.setFillColor(...NAVY)
    doc.rect(ML, y, 3, 20, 'F')
    // title text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    const letters = title.toUpperCase().split('').join(String.fromCharCode(0x200B))
    doc.text(title.toUpperCase(), ML + 10, y + 13)
    // rule
    doc.setDrawColor(...NAVY_LT)
    doc.setLineWidth(1)
    doc.line(ML + 10 + doc.getTextWidth(title.toUpperCase()) + 6, y + 9, ML + CW, y + 9)
    doc.setLineWidth(0.5)
    y += 22
  }

  // ── Basic field row ───────────────────────────────────────────────────────────
  function fieldRow(label, value, shade = false) {
    const valStr = String(value ?? '—')
    const lines  = doc.splitTextToSize(valStr, CW - 140)
    const rowH   = Math.max(22, lines.length * 13 + 8)
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML + 8, y + 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text(lines, ML + 140, y + 14)
    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ── Two-column field row ──────────────────────────────────────────────────────
  function twoCol(left, right, shade = false) {
    const half  = CW / 2
    const rowH  = 24
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }
    // left
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(left.label.toUpperCase(), ML + 8, y + 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text(String(left.value ?? '—'), ML + 120, y + 15)
    // divider
    doc.setDrawColor(...BORDER)
    doc.line(ML + half, y + 5, ML + half, y + rowH - 5)
    // right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(right.label.toUpperCase(), ML + half + 8, y + 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text(String(right.value ?? '—'), ML + half + 120, y + 15)
    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ── Safety checklist row ──────────────────────────────────────────────────────
  function safetyRow(label, desc, done) {
    const rowH = 32
    checkPage(rowH)
    const cbX = ML + 8
    const cbY = y + (rowH - 13) / 2
    // checkbox background
    if (done) {
      doc.setFillColor(...GREEN_BG)
      doc.setDrawColor(...GREEN)
    } else {
      doc.setFillColor(252, 252, 254)
      doc.setDrawColor(...BORDER)
    }
    doc.roundedRect(cbX, cbY, 13, 13, 2, 2, 'FD')
    if (done) {
      drawCheck(cbX + 1.5, cbY + 1.5, 10, GREEN)
    } else {
      drawCross(cbX + 3, cbY + 3, 7, [180, 188, 204])
    }
    // label + desc
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT)
    doc.text(label, ML + 30, y + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(desc, ML + 30, y + 24)
    // status pill (right side)
    const pillW = 72
    const pillX = ML + CW - pillW - 4
    const pillY = y + (rowH - 16) / 2
    if (done) {
      doc.setFillColor(...GREEN_BG)
      doc.setDrawColor(...GREEN_BD)
    } else {
      doc.setFillColor(...RED_BG)
      doc.setDrawColor(254, 202, 202)
    }
    doc.roundedRect(pillX, pillY, pillW, 16, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...(done ? GREEN : RED))
    doc.text(done ? 'COMPLETED' : 'NOT COMPLETED', pillX + pillW / 2, pillY + 10.5, { align: 'center' })
    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ── Work type pills row ───────────────────────────────────────────────────────
  function workTypePills(types) {
    if (!types || types.length === 0) { fieldRow('Work Completed', 'None specified'); return }
    const rowH = 30
    checkPage(rowH)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text('WORK COMPLETED', ML + 8, y + 17)
    let px = ML + 140
    types.forEach(t => {
      const tw   = doc.getTextWidth(t) + 14
      if (px + tw > ML + CW - 4) { px = ML + 140; y += 20 }
      doc.setFillColor(...NAVY_LT)
      doc.setDrawColor(190, 205, 245)
      doc.roundedRect(px, y + 7, tw, 17, 3, 3, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...NAVY)
      doc.text(t, px + tw / 2, y + 18.5, { align: 'center' })
      px += tw + 5
    })
    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════════
  // Main bar
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 88, 'F')
  // Right accent block
  doc.setFillColor(...NAVY2)
  doc.rect(W - 180, 0, 180, 88, 'F')
  // Bottom accent stripe
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 88, W, 3, 'F')

  // "LMC" wordmark
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...WHITE)
  doc.text('LMC', ML, 40)

  // Vertical divider after LMC
  doc.setDrawColor(80, 100, 160)
  doc.line(ML + 48, 14, ML + 48, 74)

  // Company & doc title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...WHITE)
  doc.text('Field Operations', ML + 58, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(170, 185, 220)
  doc.text('Daily Field Log  ·  Lightning Master Controls', ML + 58, 50)
  doc.text('End-of-Day Close-Out Report', ML + 58, 64)

  // Right area: status badge
  doc.setFillColor(...GREEN)
  doc.roundedRect(W - 164, 14, 82, 22, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  // Draw a manual check in the badge
  drawCheck(W - 164 + 8, 14 + 6, 10, WHITE)
  doc.text('SUBMITTED', W - 164 + 50, 28, { align: 'center' })

  // Right: date + report info
  const now = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(170, 185, 220)
  doc.text(now, W - ML, 52, { align: 'right' })
  doc.text(`Finalized ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`, W - ML, 66, { align: 'right' })

  y = 91

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUMMARY STRIP
  // ═══════════════════════════════════════════════════════════════════════════════
  const stripH = 38
  doc.setFillColor(...NAVY_LT)
  doc.rect(0, y, W, stripH, 'F')
  doc.setDrawColor(...BORDER)
  doc.line(0, y + stripH, W, y + stripH)

  const stripCols = [
    { label: 'REPORT DATE',  val: fmtDate(report.report_date)                              },
    { label: 'CUSTOMER',     val: report.customer || '—'                                    },
    { label: 'BRANCH',       val: (report.branch  || '—').toUpperCase()                    },
    { label: 'SUPERVISOR',   val: report.supervisor_name || report.submitted_by || '—'      },
  ]
  const cw4 = W / 4
  stripCols.forEach(({ label, val }, i) => {
    const cx = i * cw4
    if (i > 0) { doc.setDrawColor(...BORDER); doc.line(cx, y + 4, cx, y + stripH - 4) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...LABEL)
    doc.text(label, cx + cw4 / 2, y + 13, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...NAVY)
    // truncate if needed
    let v = val
    while (doc.getTextWidth(v) > cw4 - 14 && v.length > 4) v = v.slice(0, -2) + '…'
    doc.text(v, cx + cw4 / 2, y + 28, { align: 'center' })
  })
  y += stripH + 12

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — JOB INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Job Information')
  fieldRow('Customer',    report.customer)
  fieldRow('Jobsite',     report.customer_site || report.customer, true)
  twoCol(
    { label: 'Job ID',  value: report.jobsite_id || '—' },
    { label: 'Branch',  value: (report.branch || '—').toUpperCase() }
  )
  fieldRow('Report Date', fmtDate(report.report_date), true)
  if (report.gps_location) fieldRow('GPS Coordinates', report.gps_location)
  y += 8

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — CREW ONSITE
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Crew Onsite')
  fieldRow('Supervisor', report.supervisor_name || report.submitted_by || '—')
  const crew = (report.crew_on_site || []).filter(Boolean)
  fieldRow('Installers', crew.length ? crew.join(', ') : 'None listed', true)
  y += 8

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — SAFETY DOCUMENTATION
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Safety Documentation')
  safetyRow('JSA — Job Safety Analysis',     'Hazard identification, controls & emergency procedures',      report.jsa_uploaded)
  safetyRow('Man Lift Pre-Use Checklist',     'Equipment inspection before operation  ·  OSHA 1926.453',    report.manlift_checklist)
  safetyRow('Fall Protection Plan',           'PPE verification, anchor points & rescue procedures',        report.fall_protection)
  y += 8

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — WORK SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Work Summary')
  // Time onsite — slightly emphasized
  checkPage(24)
  doc.setFillColor(...NAVY_LT)
  doc.rect(ML, y, CW, 24, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...LABEL)
  doc.text('TOTAL TIME ONSITE', ML + 8, y + 15)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text(fmtHours(report.hours_worked), ML + 140, y + 16)
  doc.setDrawColor(...BORDER)
  doc.line(ML, y + 24, ML + CW, y + 24)
  y += 24

  workTypePills(report.work_types)
  if (report.work_other) fieldRow('Other Work',   report.work_other, true)
  if (report.other_tasks) fieldRow('Notes & Tasks', report.other_tasks)
  y += 8

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — TRAVEL
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Travel')
  twoCol(
    { label: 'Miles Driven', value: report.miles_driven ? `${report.miles_driven} mi` : '—' },
    { label: 'Drive Time',   value: fmtHours(report.drive_time) }
  )
  y += 8

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SIGN-OFF
  // ═══════════════════════════════════════════════════════════════════════════════
  sectionHead('Supervisor Sign-Off')
  checkPage(76)

  const supervisor  = report.supervisor_name || report.submitted_by || '—'
  const submittedAt = report.submitted_at
    ? new Date(report.submitted_at).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })
    : '—'
  const boxH = 72

  doc.setFillColor(...BG)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(ML, y, CW, boxH, 4, 4, 'FD')

  if (report.signed) {
    // Green seal circle
    doc.setFillColor(...GREEN)
    doc.circle(ML + 30, y + boxH / 2, 18, 'F')
    drawCheck(ML + 30 - 9, y + boxH / 2 - 7, 18, WHITE)

    // Name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT)
    doc.text(supervisor, ML + 56, y + 24)

    // Sub-labels
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...LABEL)
    doc.text('Supervisor  ·  Digitally certified via LMC Field Operations', ML + 56, y + 38)
    doc.text(`Submitted: ${submittedAt}`, ML + 56, y + 52)

    // Right: "DIGITALLY SIGNED" box
    const sealW = 108
    const sealX = ML + CW - sealW - 10
    doc.setFillColor(...GREEN_BG)
    doc.setDrawColor(...GREEN_BD)
    doc.roundedRect(sealX, y + 10, sealW, 52, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...GREEN)
    doc.text('DIGITALLY SIGNED', sealX + sealW / 2, y + 28, { align: 'center' })
    doc.text('& SUBMITTED', sealX + sealW / 2, y + 42, { align: 'center' })
    // small check in the seal
    drawCheck(sealX + sealW / 2 - 6, y + 48, 12, GREEN)
  } else {
    // Signature line
    doc.setDrawColor(170, 180, 200)
    doc.line(ML + 16, y + 44, ML + 260, y + 44)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...LABEL)
    doc.text(supervisor, ML + 16, y + 22)
    doc.text('Supervisor Signature', ML + 16, y + 56)
    // "Pending" badge
    doc.setFillColor(255, 247, 237)
    doc.setDrawColor(253, 186, 116)
    doc.roundedRect(ML + CW - 100, y + 24, 88, 22, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(194, 65, 12)
    doc.text('PENDING SIGNATURE', ML + CW - 56, y + 38, { align: 'center' })
  }

  y += boxH + 12

  // ═══════════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════════
  drawPageFooter()

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPLOAD TO SUPABASE STORAGE
  // ═══════════════════════════════════════════════════════════════════════════════
  const pdfBlob = doc.output('blob')
  const fileName = `dfl_${report.report_date}_${(report.id || Date.now()).toString().substring(0, 8)}.pdf`
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
