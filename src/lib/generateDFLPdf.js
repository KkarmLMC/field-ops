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
  const NAVY2    = [42,  55, 120 ]
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
  const ORANGE   = [194, 65,  12 ]

  let y = 0

  // ── Draw a manual checkmark ───────────────────────────────────────────────────
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

  // ── Page overflow → new page ─────────────────────────────────────────────────
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
    doc.setFillColor(...NAVY)
    doc.rect(ML, y, 3, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), ML + 10, y + 13)
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(left.label.toUpperCase(), ML + 8, y + 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text(String(left.value ?? '—'), ML + 120, y + 15)
    doc.setDrawColor(...BORDER)
    doc.line(ML + half, y + 5, ML + half, y + rowH - 5)
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT)
    doc.text(label, ML + 30, y + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(desc, ML + 30, y + 24)
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
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 88, 'F')
  doc.setFillColor(...NAVY2)
  doc.rect(W - 180, 0, 180, 88, 'F')
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 88, W, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...WHITE)
  doc.text('LMC', ML, 40)

  doc.setDrawColor(80, 100, 160)
  doc.line(ML + 48, 14, ML + 48, 74)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...WHITE)
  doc.text('Field Operations', ML + 58, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(170, 185, 220)
  doc.text('Daily Field Log  ·  Lightning Master Controls', ML + 58, 50)
  doc.text('End-of-Day Close-Out Report', ML + 58, 64)

  doc.setFillColor(...GREEN)
  doc.roundedRect(W - 164, 14, 82, 22, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  drawCheck(W - 164 + 8, 14 + 6, 10, WHITE)
  doc.text('SUBMITTED', W - 164 + 50, 28, { align: 'center' })

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
    doc.setFillColor(...GREEN)
    doc.circle(ML + 30, y + boxH / 2, 18, 'F')
    drawCheck(ML + 30 - 9, y + boxH / 2 - 7, 18, WHITE)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT)
    doc.text(supervisor, ML + 56, y + 24)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...LABEL)
    doc.text('Supervisor  ·  Digitally certified via LMC Field Operations', ML + 56, y + 38)
    doc.text(`Submitted: ${submittedAt}`, ML + 56, y + 52)

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
    drawCheck(sealX + sealW / 2 - 6, y + 48, 12, GREEN)
  } else {
    doc.setDrawColor(170, 180, 200)
    doc.line(ML + 16, y + 44, ML + 260, y + 44)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...LABEL)
    doc.text(supervisor, ML + 16, y + 22)
    doc.text('Supervisor Signature', ML + 16, y + 56)
    doc.setFillColor(255, 247, 237)
    doc.setDrawColor(253, 186, 116)
    doc.roundedRect(ML + CW - 100, y + 24, 88, 22, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...ORANGE)
    doc.text('PENDING SIGNATURE', ML + CW - 56, y + 38, { align: 'center' })
  }

  y += boxH + 12

  // ═══════════════════════════════════════════════════════════════════════════════
  // FOOTER (page 1)
  // ═══════════════════════════════════════════════════════════════════════════════
  drawPageFooter()

  // ═══════════════════════════════════════════════════════════════════════════════
  // SAFETY FORM PAGES
  // ═══════════════════════════════════════════════════════════════════════════════
  const SAFETY_FORM_DEFS = [
    { dataKey: 'jsa_data',             slug: 'jsa',              label: 'Job Safety Analysis',          ref: 'LMC-Form-000-008' },
    { dataKey: 'manlift_data',         slug: 'manlift-checklist', label: 'Manlift Pre-Shift Inspection', ref: 'OSHA 1926.453' },
    { dataKey: 'fall_protection_data', slug: 'fall-protection',  label: 'Fall Protection Inspection',   ref: 'OSHA 1926.502' },
  ]

  // Fetch safety form schemas from Supabase
  const slugs = SAFETY_FORM_DEFS.map(f => f.slug)
  const { data: schemaRows } = await db.from('form_definitions')
    .select('slug, sections')
    .in('slug', slugs)
  const schemaMap = Object.fromEntries((schemaRows || []).map(r => [r.slug, r]))

  for (const formDef of SAFETY_FORM_DEFS) {
    const formData = report[formDef.dataKey]
    if (!formData) continue

    const schema = schemaMap[formDef.slug]
    if (!schema) continue
    const template = schema

    // ── New page for this safety form ─────────────────────────────────────────
    doc.addPage()
    y = 0

    // ── Compact safety form header ────────────────────────────────────────────
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, W, 58, 'F')
    doc.setFillColor(...NAVY2)
    doc.rect(W - 180, 0, 180, 58, 'F')
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 58, W, 3, 'F')

    // LMC wordmark (compact)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...WHITE)
    doc.text('LMC', ML, 32)

    doc.setDrawColor(80, 100, 160)
    doc.line(ML + 34, 10, ML + 34, 50)

    // Form title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...WHITE)
    doc.text(formDef.label, ML + 44, 25)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(170, 185, 220)
    doc.text(`Ref: ${formDef.ref}  ·  Attached to Daily Field Log`, ML + 44, 40)

    // Right: report date + ATTACHMENT badge
    const pillW2 = 90
    doc.setFillColor(42, 55, 140)
    doc.setDrawColor(80, 100, 160)
    doc.roundedRect(W - ML - pillW2, 14, pillW2, 20, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(170, 185, 220)
    doc.text('ATTACHMENT', W - ML - pillW2 / 2, 26.5, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(170, 185, 220)
    doc.text(fmtDate(report.report_date), W - ML, 47, { align: 'right' })

    y = 61

    // ── Thin summary strip ────────────────────────────────────────────────────
    const sfStripH = 28
    doc.setFillColor(...NAVY_LT)
    doc.rect(0, y, W, sfStripH, 'F')
    doc.setDrawColor(...BORDER)
    doc.line(0, y + sfStripH, W, y + sfStripH)

    const sfCols = [
      { label: 'SUPERVISOR', val: report.supervisor_name || report.submitted_by || '—' },
      { label: 'JOBSITE',    val: report.customer_site || report.customer || '—'        },
      { label: 'DATE',       val: fmtDate(report.report_date)                           },
      { label: 'REPORT #',   val: (report.id || 'pending').toString().substring(0, 8).toUpperCase() },
    ]
    sfCols.forEach(({ label, val }, i) => {
      const cx = i * cw4
      if (i > 0) { doc.setDrawColor(...BORDER); doc.line(cx, y + 3, cx, y + sfStripH - 3) }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.setTextColor(...LABEL)
      doc.text(label, cx + cw4 / 2, y + 10, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...NAVY)
      let v = val
      while (doc.getTextWidth(v) > cw4 - 10 && v.length > 4) v = v.slice(0, -2) + '…'
      doc.text(v, cx + cw4 / 2, y + 22, { align: 'center' })
    })
    y += sfStripH + 10

    // ── Render each section ───────────────────────────────────────────────────
    for (const section of template.sections) {
      // Skip sections where ALL fields are activity-row or personnel-sig
      const renderableFields = section.fields.filter(
        f => !['activity-row', 'personnel-sig'].includes(f.type)
      )
      if (renderableFields.length === 0) continue

      sectionHead(section.title)

      renderableFields.forEach((field, fi) => {
        const rawVal = formData[field.id]
        const shade = fi % 2 === 1

        if (field.type === 'pass-fail') {
          sfPassFailRow(field.label, rawVal, shade)
        } else if (field.type === 'ok-notok-na') {
          sfOkNotOkRow(field.label, rawVal, shade)
        } else if (field.type === 'checkbox-group') {
          sfCheckboxGroupRow(field.label, rawVal || [], field.options || [], shade)
        } else if (field.type === 'textarea') {
          fieldRow(field.label, rawVal || '—', shade)
        } else {
          // text, date, number, select, boolean
          let display = rawVal ?? '—'
          if (field.type === 'date' && rawVal) display = fmtDate(rawVal)
          if (field.type === 'boolean') display = rawVal ? 'Yes' : rawVal === false ? 'No' : '—'
          fieldRow(field.label, display, shade)
        }
      })
      y += 6
    }

    drawPageFooter()
  }

  // ── Pass / Fail row (for fall-protection form) ────────────────────────────────
  function sfPassFailRow(label, val, shade) {
    const rowH = 22
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT)
    doc.text(label, ML + 8, y + 14)

    // Badge
    const isPass = val === 'pass' || val === true || val === 'Pass'
    const isFail = val === 'fail' || val === false || val === 'Fail'
    const pillW  = 52
    const pillX  = ML + CW - pillW - 6
    const pillY  = y + (rowH - 14) / 2

    if (isPass) {
      doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
    } else if (isFail) {
      doc.setFillColor(...RED_BG); doc.setDrawColor(254, 202, 202)
    } else {
      doc.setFillColor(...BG); doc.setDrawColor(...BORDER)
    }
    doc.roundedRect(pillX, pillY, pillW, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...(isPass ? GREEN : isFail ? RED : LABEL))
    const pillLabel = isPass ? 'PASS' : isFail ? 'FAIL' : '—'
    doc.text(pillLabel, pillX + pillW / 2, pillY + 9.5, { align: 'center' })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ── OK / Not OK / N/A row (for manlift checklist) ────────────────────────────
  function sfOkNotOkRow(label, val, shade) {
    const rowH = 22
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT)
    doc.text(label, ML + 8, y + 14)

    const isOk   = val === 'ok'
    const isNot  = val === 'not-ok'
    const isNA   = val === 'na'

    const pillW = 52
    const pillX = ML + CW - pillW - 6
    const pillY = y + (rowH - 14) / 2

    if (isOk) {
      doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
    } else if (isNot) {
      doc.setFillColor(...RED_BG); doc.setDrawColor(254, 202, 202)
    } else if (isNA) {
      doc.setFillColor(243, 244, 246); doc.setDrawColor(209, 213, 219)
    } else {
      doc.setFillColor(...BG); doc.setDrawColor(...BORDER)
    }
    doc.roundedRect(pillX, pillY, pillW, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...(isOk ? GREEN : isNot ? RED : LABEL))
    const pillLabel = isOk ? 'OK' : isNot ? 'NOT OK' : isNA ? 'N/A' : '—'
    doc.text(pillLabel, pillX + pillW / 2, pillY + 9.5, { align: 'center' })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

  // ── Checkbox group row (for JSA permits/PPE/equipment) ───────────────────────
  function sfCheckboxGroupRow(label, selected, options, shade) {
    if (!options || options.length === 0) return
    // Calculate height: label row + pill rows
    const PILL_H   = 18
    const PILL_GAP = 4
    let   px       = ML + 8
    let   rows     = 1
    // Set font to match pill rendering before measuring
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const pillMeta = options.map(opt => {
      const tw = doc.getTextWidth(opt) + 14
      if (px + tw > ML + CW - 4) { rows++; px = ML + 8 }
      px += tw + PILL_GAP
      return tw
    })
    const rowH = 18 + rows * (PILL_H + PILL_GAP) + 8
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML, y, CW, rowH, 'F') }

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML + 8, y + 12)

    // Pills
    let ppx = ML + 8
    let ppy = y + 18
    options.forEach((opt, i) => {
      const tw = pillMeta[i]
      if (ppx + tw > ML + CW - 4) { ppx = ML + 8; ppy += PILL_H + PILL_GAP }
      const isChecked = Array.isArray(selected) && selected.includes(opt)
      if (isChecked) {
        doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
      } else {
        doc.setFillColor(246, 248, 252); doc.setDrawColor(209, 213, 219)
      }
      doc.roundedRect(ppx, ppy, tw, PILL_H - 2, 2, 2, 'FD')
      doc.setFont('helvetica', isChecked ? 'bold' : 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...(isChecked ? GREEN : LABEL))
      doc.text(opt, ppx + tw / 2, ppy + 11, { align: 'center' })
      ppx += tw + PILL_GAP
    })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y + rowH, ML + CW, y + rowH)
    y += rowH
  }

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
