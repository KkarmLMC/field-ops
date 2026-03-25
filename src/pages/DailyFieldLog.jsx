import { useState } from 'react'
import { Clock, CheckCircle, FileText, Plus } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { MOCK_REPORTS, TECHNICIANS } from '../data/mockData.js'

const STATUS_COLOR = {
  Draft:     { bg: '#F3F4F6', color: '#000000' },
  Submitted: { bg: '#F3F4F6', color: '#000000' },
  Reviewed:  { bg: '#F3F4F6', color: '#000000' },
}

function getTech(name) {
  return TECHNICIANS.find(t => t.name === name) ?? null
}

export default function DailyFieldLog() {
  const [branch, setBranch] = useState('lm')

  const lmCount         = MOCK_REPORTS.filter(r => r.branch === 'lm').length
  const boltCount       = MOCK_REPORTS.filter(r => r.branch === 'bolt').length
  const boltDallasCount = MOCK_REPORTS.filter(r => r.branch === 'bolt-dallas').length

  const reports = MOCK_REPORTS
    .filter(r => r.branch === branch)
    .sort((a, b) => b.report_date.localeCompare(a.report_date))

  const totalHours = reports.reduce((sum, r) => sum + r.hours_worked, 0)
  const submitted  = reports.filter(r => r.status === 'Submitted' || r.status === 'Reviewed').length

  return (
    <div className="page-content fade-in">

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Entries', value: reports.length, icon: <FileText size={14} />, color: '#000000' },
          { label: 'Hours Logged',  value: `${totalHours}h`, icon: <Clock size={14} />, color: '#000000' },
          { label: 'Reviewed',      value: submitted, icon: <CheckCircle size={14} />, color: '#000000' },
        ].map(s => (
          <div key={s.label} className="dash-card" style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Log entries */}
      <div className="dash-card">
        <div className="dash-card-head">
          <span className="dash-card-title">
            <Clock size={14} />
            Field Log Entries
          </span>
          <button className="dash-card-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> New Entry
          </button>
        </div>
        <div>
          {reports.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No log entries for this branch
            </div>
          ) : (
            reports.map(r => {
              const sc = STATUS_COLOR[r.status] || STATUS_COLOR.Draft
              return (
                <div key={r.id} className="dash-job-row" style={{ cursor: 'default' }}>
                  <div className="dash-job-icon" style={{ background: sc.bg, fontSize: 16 }}>
                    <FileText size={15} style={{ color: sc.color }} />
                  </div>
                  <div className="dash-job-info">
                    <div className="dash-job-name">{r.projects.name}</div>
                    <div className="dash-job-meta">
                      {r.submitted_by}
                      <span className="dash-job-dot">·</span>
                      {r.report_date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{r.hours_worked}h</div>
                    <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>{r.status}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
