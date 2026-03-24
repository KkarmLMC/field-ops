# Field Ops — Cowork Project Brief

## What This Is
A proprietary field service workflow tool for Bolt Lightning Protection (Lightning Master, Fernandina Beach FL).
Covers the full job lifecycle: Site Survey → Installation → Inspection → Certification → Annual Testing.
Built for desktop dispatch/admin use and eventually mobile technician use in the field.

---

## Current State (as of March 2026)

### What exists and works:
- `index.html` — Vite entry point, mounts `#root`
- `vite.config.js`, `tailwind.config.js`, `postcss.config.js` — build config
- `package.json` — deps: React 18, Supabase JS, Dexie (IndexedDB), Lucide React, Tailwind
- `src/main.jsx` — ReactDOM.createRoot entry
- `src/index.css` — full design system (CSS variables, typography, badge classes)
- `src/App.jsx` — routing state machine (page + selectedJob + activeForm state)
- `src/data/mockData.js` — JOBS, TECHNICIANS, FORM_TEMPLATES, STATS
- `src/components/Layout.jsx` — sidebar nav shell (imports Layout.css which is NOT yet created)

### What is NOT yet built (needs to be created):
- `src/components/Layout.css`
- `src/pages/Dashboard.jsx`
- `src/pages/Jobs.jsx`
- `src/pages/JobDetail.jsx`
- `src/pages/FormRunner.jsx`
- `src/pages/Reports.jsx`
- `src/pages/Technicians.jsx`

---

## Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + custom CSS variables (see index.css)
- **Icons:** lucide-react@0.383.0
- **Offline DB:** Dexie (IndexedDB wrapper) — wired in but not yet used in UI
- **Backend (future):** Supabase — not yet connected, use mockData for now
- **Deployment:** Vercel (project: `field-ops`, team: `kodylees-projects`)
- **Repo:** github.com/KkarmLMC/field-ops

---

## Design System (from index.css)

### CSS Variables
```
--bg: #0a0c0f         (page background)
--bg-2: #111418       (card backgrounds)
--bg-3: #181c22       (input backgrounds)
--bg-4: #1e242d       (hover states)
--border: #252c38
--border-bright: #2e3847
--text: #c8d4e0       (primary text)
--text-dim: #5a6a7a   (secondary text)
--accent: #e8a020     (amber — primary action color)
--green: #1db954
--red: #e03030
--blue: #2080e0
--mono: 'DM Mono', monospace
--head: 'Barlow Condensed', sans-serif
--body: 'Barlow', sans-serif
```

### Aesthetic Direction
Industrial/utilitarian. Dark. High-contrast. Built for tablet/field readability.
No purple gradients. No rounded pill buttons. No generic SaaS look.
Think: ops center, not marketing site.

### Badge Classes (already defined in index.css)
- `.badge .badge-scheduled` — blue
- `.badge .badge-active` — amber
- `.badge .badge-completed` — green
- `.badge .badge-failed` — red
- `.badge .badge-pending` — muted

### Utility Classes
- `.label` — mono, 10px, uppercase, dimmed (use for field labels, section headers)

---

## Data Shapes (from mockData.js)

### Job
```js
{
  id: 'JOB-2026-0312',
  type: 'installation' | 'inspection' | 'site-survey' | 'certification' | 'annual-test',
  status: 'active' | 'scheduled' | 'completed' | 'failed',
  client: string,
  address: string,
  structure: string,
  assignedTo: 'T001' | 'T002' | 'T003' | 'T004',   // technician ID
  scheduledDate: 'YYYY-MM-DD',
  nfpaClass: 'I' | 'II' | 'III',
  priority: 'high' | 'medium' | 'low',
  progress: 0–100,
  forms: string[],   // completed form IDs
  notes: string,
}
```

### Technician
```js
{ id: 'T001', name: string, license: string, status: 'active' | 'field', phone: string }
```

### Form Template (FORM_TEMPLATES['site-survey' | 'installation' | 'inspection'])
```js
{
  id: string,
  label: string,
  nfpaRef: string,
  sections: [{ id, title, fields: [{ id, label, type, options?, required?, nfpa? }] }]
}
```
Field types: `'text' | 'number' | 'select' | 'boolean' | 'textarea'`

---

## Routing (App.jsx)
```
navigate('dashboard')
navigate('jobs')
navigate('job-detail', { job: jobObject })
navigate('form-runner', { job: jobObject, form: 'site-survey' | 'installation' | 'inspection' })
navigate('reports')
navigate('technicians')
```

---

## Pages to Build

### Layout.css
Styles for the layout shell. Sidebar is fixed left, main content fills the rest.
Key classes needed: `.layout`, `.sidebar`, `.sidebar-open`, `.sidebar-header`, `.sidebar-logo`,
`.logo-icon`, `.logo-text`, `.logo-sub`, `.sidebar-nav`, `.nav-item`, `.nav-item-active`,
`.sidebar-footer`, `.sync-indicator`, `.sync-icon`, `.sidebar-user`, `.user-avatar`, `.user-name`,
`.main-content`, `.mobile-toggle`, `.sidebar-overlay`

### Dashboard.jsx
Props: `{ navigate }`
Show: stat cards (jobs this month, completed, pending, failed, techs in field),
today's active jobs list (filtered from JOBS), a quick-access panel for recent activity.
Clicking a job navigates to job-detail.

### Jobs.jsx
Props: `{ navigate }`
Full job list from JOBS mock data. Filter bar: status, type, technician.
Each row shows: job ID, client, type badge, status badge, assigned tech, scheduled date, progress bar.
Clicking a row navigates to job-detail.

### JobDetail.jsx
Props: `{ job, navigate }`
Full job card: all job fields, assigned technician info, progress indicator.
Forms section: show which forms are completed (from job.forms[]), which are available to fill.
Button to launch FormRunner for each available form type.
Back button → navigate('jobs').

### FormRunner.jsx
Props: `{ job, formId, navigate }`
Loads FORM_TEMPLATES[formId]. Renders each section and its fields.
Field rendering by type: text/number → input, select → dropdown, boolean → toggle/checkbox, textarea → textarea.
Show nfpa reference next to each field label.
Submit button saves to local state (no backend yet). Show success state.
Back button → navigate('job-detail', { job }).

### Reports.jsx
Props: `{ navigate }`
List of completed jobs. For each, show a "Generate Certificate" button (mock — just shows a preview panel).
Certificate preview: job ID, client, address, technician name + license, NFPA class, date, pass/fail status.

### Technicians.jsx
Props: `{ navigate }`
Cards for each technician: name, license, status badge (active/field), phone.
Below each card: list of their assigned jobs from JOBS (filtered by assignedTo).

---

## How to Run Locally
```bash
cd /path/to/field-ops
npm install
npm run dev
```

## How to Deploy
Push to main branch on github.com/KkarmLMC/field-ops — Vercel auto-deploys.
Or: `vercel --prod` from the project root if Vercel CLI is installed.

---

## Coding Conventions
- Functional components only, no class components
- CSS modules or plain CSS files co-located with components (e.g. Layout.css next to Layout.jsx)
- No TypeScript — plain JSX
- No external state management — useState/props only for now
- Import icons from lucide-react
- Use CSS variables from index.css for all colors — no hardcoded hex values in component styles
- Keep mockData imports from `../data/mockData.js` (adjust relative path as needed)
