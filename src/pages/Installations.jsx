import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, MagnifyingGlass, CaretRight, CheckCircle, Warning, Clock } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { JOBS, MOCK_PROJECTS, TECHNICIANS } from '../data/mockData.js'

const STAGE_COLOR = {
  'In Progress':    { color: '#000000', bg: '#F3F4F6' },
  'Scheduled':      { color: '#000000', bg: '#F3F4F6' },
  'Awarded':        { color: '#000000', bg: '#F3F4F6' },
  'Complete':       { color: '#000000', bg: '#F3F4F6' },
  'Pending Review': { color: '#000000', bg: '#F3F4F6' },
}

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

export default function Installations() {
  const navigate = useNavigate()
  const [branch, setBranch] = useState('bolt')

  const projects  = MOCK_PROJECTS.filter(p => p.branch === branch)
  const activeInstalls = JOBS.filter(j =>
    j.branch === branch && j.status === 'active' &&
    (j.type === 'installation' || j.type === 'site-survey' || j.type === 'certification')
  )
  const activeInspections = JOBS.filter(j =>
    j.branch === branch && j.status === 'active' && j.type === 'inspection'
  )

  const lmCount         = MOCK_PROJECTS.filter(p => p.branch === 'lm').length
  const boltCount       = MOCK_PROJECTS.filter(p => p.branch === 'bolt').length
  const boltDallasCount = MOCK_PROJECTS.filter(p => p.branch === 'bolt-dallas').length

  return (
    <div className="page-content fade-in">

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Quick links */}
      <div className="dash-tiles" style={{ marginBottom: 16 }}>
        <button className="dash-tile" onClick={() => navigate('/installations/installs')}
          style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}>
          <div className="dash-tile-icon"><Wrench size={18} /></div>
          <div className="dash-tile-text">
            <div className="dash-tile-label">Installs</div>
            <div className="dash-tile-sub">{activeInstalls.length} active</div>
          </div>
          <CaretRight size={14} className="dash-tile-arrow" />
        </button>
        <button className="dash-tile" onClick={() => navigate('/inspections')}
          style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}>
          <div className="dash-tile-icon"><MagnifyingGlass size={18} /></div>
          <div className="dash-tile-text">
            <div className="dash-tile-label">Inspections</div>
            <div className="dash-tile-sub">{activeInspections.length} active</div>
          </div>
          <CaretRight size={14} className="dash-tile-arrow" />
        </button>
      </div>

      {/* Projects list */}
      <div className="dash-card" style={{ marginBottom: 0 }}>
        <div className="dash-card-head">
          <span className="dash-card-title">
            <Clock size={14} />
            All Installations
          </span>
          <span className="dash-card-meta">{projects.length} total</span>
        </div>
        <div>
          {projects.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No installations for this branch
            </div>
          ) : (
            projects.map(p => {
              const sc = STAGE_COLOR[p.stage] || STAGE_COLOR['Scheduled']
              return (
                <div key={p.id} className="dash-job-row" onClick={() => navigate(`/installations/${p.id}`)}>
                  <div className="dash-job-icon" style={{ background: sc.bg }}>
                    {p.stage === 'Complete' ? <CheckCircle size={15} style={{ color: sc.color }} /> :
                     p.stage === 'Pending Review' ? <Warning size={15} style={{ color: sc.color }} /> :
                     <Wrench size={15} style={{ color: sc.color }} />}
                  </div>
                  <div className="dash-job-info">
                    <div className="dash-job-name">{p.name}</div>
                    <div className="dash-job-meta">{p.customer_account} · {p.city}, {p.state}</div>
                  </div>
                  <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    {p.stage}
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
