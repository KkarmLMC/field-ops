import { LayoutDashboard, Briefcase, FileText, Users, Zap, Menu, X, Radio } from 'lucide-react';
import { useState } from 'react';
import './Layout.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'technicians', label: 'Technicians', icon: Users },
];

export default function Layout({ children, page, navigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Zap size={18} className="logo-icon" />
            <span className="logo-text">BOLT</span>
            <span className="logo-sub">FIELD OPS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id || (page === 'job-detail' && id === 'jobs') ? 'nav-item-active' : ''}`}
              onClick={() => { navigate(id); setMobileOpen(false); }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sync-indicator">
            <Radio size={12} className="sync-icon" />
            <span className="label">LIVE SYNC</span>
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">KK</div>
            <div>
              <div className="user-name">Kodylee Karm</div>
              <div className="label">Ops Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
}
