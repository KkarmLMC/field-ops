/**
 * PageSubNav — horizontal sub-navigation tabs shown at the top of a page
 * when that page has child routes.
 *
 * Mobile only — on desktop the sidebar sub-nav handles this.
 * Appears below the mobile header, above page content.
 *
 * Props:
 *   items  — [{ path, label }]
 */

import { useNavigate, useLocation } from 'react-router-dom'

export default function PageSubNav({ items }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="page-sub-nav">
      {items.map(item => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`page-sub-nav__item ${active ? 'page-sub-nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
