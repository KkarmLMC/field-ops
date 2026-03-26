# Field Ops — Developer Documentation

> Complete technical reference for the Field Ops codebase. Last updated March 2026.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository & Deployment](#3-repository--deployment)
4. [Project Structure](#4-project-structure)
5. [Architecture Overview](#5-architecture-overview)
6. [Routing](#6-routing)
7. [Branch System](#7-branch-system)
8. [Design System](#8-design-system)
9. [Component Library](#9-component-library)
10. [Form Engine](#10-form-engine)
11. [Database Schema](#11-database-schema)
12. [Offline & Sync](#12-offline--sync)
13. [PDF Generation](#13-pdf-generation)
14. [Role System](#14-role-system)
15. [Performance](#15-performance)
16. [Data & Mock Data](#16-data--mock-data)
17. [Standards & Conventions](#17-standards--conventions)

---

## 1. Project Overview

**Field Ops** is a proprietary field service workflow tool for Lightning Master Controls (LMC) and its subsidiary Bolt Lightning. It covers the full job lifecycle for lightning protection system (LPS) work — from site surveys and installation through inspection, certification, and annual testing.

**Two branches operate in the system:**
- **Lightning Master (lm)** — navy `#04245C`, midstream/upstream oil & gas work
- **Bolt Lightning (bolt)** — red `#C0101B`, commercial/residential work

**Users:**
- **Field technicians** — fill forms, log daily work, complete safety checklists
- **Management** — review submissions, manage form schemas, oversee technician activity

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router 7 |
| Styling | Plain CSS with custom design tokens (no Tailwind, no CSS-in-JS) |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| Database | Supabase (PostgreSQL + Storage) |
| Offline | Dexie (IndexedDB wrapper) |
| PDF | jsPDF |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Hosting | `field-ops-psi.vercel.app` |

---

## 3. Repository & Deployment

- **Repo:** `https://github.com/KkarmLMC/field-ops` (private)
- **Live app:** `https://field-ops-psi.vercel.app`
- **Supabase project:** `jnbdlhyjnzdsvscpgkqi`
- **Vercel project:** `prj_wYzXjlpDCGRA4hw5jRIIgerrETyI`

Every push to `main` triggers an automatic Vercel deployment (~30–45 seconds).

**To run locally:**
```bash
npm install
npm run dev
```

---

## 4. Project Structure

```
src/
├── App.jsx                  # Root — router, layout, lazy page loading
├── main.jsx                 # React entry point
├── index.css                # Font imports only
│
├── components/
│   ├── BranchTabs.jsx       # Branch switcher carousel (LM / Bolt)
│   ├── FormEngine.jsx       # Universal form renderer — ALL field types
│   ├── Layout.jsx / .css    # App shell layout
│   ├── SectionDivider.jsx   # Labelled horizontal rule between sections
│   ├── Sidebar.jsx          # Desktop sidebar navigation
│   ├── SyncBadge.jsx        # Online/offline/syncing status indicator
│   └── TabBar.jsx           # Mobile bottom tab navigation
│
├── config/
│   └── branches.js          # BRANCH_COLORS — color tokens per branch
│
├── data/
│   └── mockData.js          # PROJECTS, TECHNICIANS, STATS, MOCK_SUBMISSIONS
│
├── hooks/
│   └── useSync.js           # Online status + offline queue auto-flush
│
├── lib/
│   ├── generateDFLPdf.js    # Daily Field Log PDF generator (jsPDF)
│   ├── offline.js           # Dexie IndexedDB queue + form schema cache
│   ├── supabase.js          # Supabase client (db export)
│   └── useRole.js           # Role hook — 'field' | 'management'
│
├── pages/
│   ├── DailyFieldLog.jsx    # Daily work log — Part 1 (AM) + Part 2 (PM closeout)
│   ├── Dashboard.jsx        # Main dashboard — branch overview, project pipeline
│   ├── FormBuilder.jsx      # Management UI to edit form schemas
│   ├── FormPage.jsx         # Form renderer — fetches schema, submits via FormEngine
│   ├── Forms.jsx            # Report Forms catalog — categories + subforms
│   ├── Inspections.jsx      # Inspections hub
│   ├── Installations.jsx    # Installations hub
│   ├── Installs.jsx         # Kanban pipeline board
│   ├── ProjectDetail.jsx    # Single project detail view
│   ├── Reports.jsx          # Field reports list
│   ├── RiskAssessment.jsx   # Risk assessment form (standalone)
│   └── Technicians.jsx      # Technician directory
│
├── styles/
│   └── globals.css          # All CSS — design tokens, components, utilities
│
└── supabase/
    └── production_indexes.sql  # DB indexes to run once in Supabase SQL Editor
```

---

## 5. Architecture Overview

```
Browser
  └── App.jsx (router + layout)
        ├── Sidebar (desktop)
        ├── TabBar (mobile)
        └── <Page> (lazy-loaded chunk per route)
              └── FormEngine (when rendering a form)
                    └── Supabase (form_definitions schema)
                    └── Dexie (offline schema cache)

Supabase (PostgreSQL)
  ├── form_definitions     — form schemas (JSON)
  ├── form_categories      — catalog categories
  ├── form_submissions_v2  — submitted form data
  ├── daily_field_logs     — DFL entries
  └── risk_assessments     — risk assessments

Vercel (CDN)
  └── Static build artifacts, edge-cached globally
```

**Key principle:** The `FormEngine` component is the single source of truth for rendering every field type in every form. No page should implement its own field renderer. If a new field type is needed, add it to `FormEngine.jsx` only.

---

## 6. Routing

All routes are defined in `src/App.jsx`. Pages are **lazy-loaded** — each route only downloads its code chunk when first visited.

| Path | Component | Notes |
|---|---|---|
| `/` | → `/dashboard` | Redirect |
| `/dashboard` | `Dashboard` | Main overview |
| `/installations` | `Installations` | Hub with sub-routes |
| `/installations/pipeline` | `Installs` | Kanban board |
| `/installations/field-logs` | `DailyFieldLog` | Management view |
| `/installations/:id` | `ProjectDetail` | Single project |
| `/installations/field-reports` | `Reports` | Field reports list |
| `/inspections` | `Inspections` | Inspections hub |
| `/daily-field-log` | `DailyFieldLog` | Field technician view |
| `/forms` | `Forms` | Report Forms catalog |
| `/forms/builder` | `FormBuilder` | Management form editor |
| `/forms/:formType` | `FormPage` | Individual form renderer |
| `/technicians` | `Technicians` | Technician directory |

**Important:** `/forms/builder` must appear **before** `/forms/:formType` in the route list, otherwise `builder` is matched as a `formType` param.

---

## 7. Branch System

The app runs two branches simultaneously. Every page with branch-aware content uses `BranchTabs` to switch between them.

```js
// src/config/branches.js
export const BRANCH_COLORS = {
  lm: {
    bgActive:    '#04245C',   // Navy
    bgAccent:    '#1A4FA8',
    bgInactive:  '#F0F3FA',
    textActive:  '#ffffff',
    textInactive:'#000000',
    subActive:   'rgba(255,255,255,0.70)',
    subInactive: '#5C5C5C',
  },
  bolt: {
    bgActive:    '#C0101B',   // Red
    bgAccent:    '#E8404A',
    bgInactive:  '#FEF0F1',
    textActive:  '#ffffff',
    textInactive:'#000000',
    subActive:   'rgba(255,255,255,0.70)',
    subInactive: '#5C5C5C',
  },
}
```

**Usage in a component:**
```jsx
const [branch, setBranch] = useState('lm')
const bc = BRANCH_COLORS[branch]

// Branch-aware card header
<div style={{ background: bc.bgActive, color: bc.textActive }}>
  <BranchTabs active={branch} onChange={setBranch} />
</div>
```

Forms in `form_definitions` have a `branch` column:
- `null` — appears in both branches
- `'lm'` — Lightning Master only
- `'bolt'` — Bolt Lightning only

---

## 8. Design System

All design tokens are CSS custom properties defined in `src/styles/globals.css`.

### Color Tokens
```css
--navy:      #04245C    /* LM primary */
--red:       #F5333F    /* Bolt primary / accent / danger */
--blue:      #0047BA
--green:     #10B981
--amber:     #F59E0B
--orange:    #F97316

--text-1:    #000000    /* Primary content */
--text-2:    #374151    /* Secondary / labels */
--text-3:    #9CA3AF    /* Tertiary / timestamps / mono labels */
--text-4:    #D1D5DB    /* Disabled / placeholder */

--surface:        #FFFFFF
--surface-raised: #F7F8FA   /* Card backgrounds */
--border:         transparent  /* Flat design — no borders on cards */
--border-l:       #EFEFEF     /* Internal row dividers only */
--hover:          #F3F4F6
```

### Typography
```css
--font:  'Plus Jakarta Sans', sans-serif
--mono:  'DM Mono', monospace

/* Fluid type scale */
--fs-2xs  --fs-xs  --fs-sm  --fs-md  --fs-lg  --fs-xl
```

### Spacing
```css
--sp-1: 0.25rem   --sp-2: 0.5rem    --sp-3: 0.75rem
--sp-4: 1rem      --sp-5: 1.25rem   --sp-6: 1.5rem
--sp-8: 2rem      --sp-10: 2.5rem
```

### Design Rules
- **Flat design** — no shadows, no borders on cards. Use `--surface-raised` backgrounds.
- **Card headers** — always use `--navy` background with white text for non-branch cards. Branch-aware cards use `bc.bgActive`.
- **Inputs** — exception to flat rule: `1px solid var(--border-l)` border, white background.
- **Buttons** — `btn-primary` is red. `btn-navy` is navy. `btn-black` is black. Never mix.

---

## 9. Component Library

### BranchTabs
Swipeable carousel on mobile, 2-column grid on desktop. Shows branch stats.
```jsx
<BranchTabs active={branch} onChange={setBranch} />
```

### SectionDivider
```jsx
<SectionDivider title="Report Forms" label="Field Overview" accent="var(--navy)" />
```

### SyncBadge
Reads from `useSync()`. Shows: `online` (green) | `offline` (amber) | `pending` (orange) | `syncing` (blue spinner).
```jsx
<SyncBadge compact />
```

### FormEngine
See Section 10 — Form Engine.

### SigPad (exported from FormEngine)
Modal-based signature component. Stores `{ sig: base64, signedAt: ISO }`.
```jsx
import { SigPad } from '../components/FormEngine.jsx'
<SigPad value={value} onChange={onChange} />
```

---

## 10. Form Engine

`FormEngine` is the universal renderer for all forms in the app. **It is the single source of truth** — no page should implement its own field renderer.

### How it works

1. A form schema is stored as JSON in `form_definitions.sections` in Supabase
2. `FormPage` fetches the schema by `slug` and passes it to `FormEngine`
3. `FormEngine` renders each section and field based on the `type` property
4. On submit, `FormPage` saves to `form_submissions_v2` (or queues offline)

### Field Types

| Type | Description |
|---|---|
| `text` | Single line text input |
| `number` | Numeric input |
| `email` | Email input with validation |
| `date` | Date picker |
| `textarea` | Multi-line text |
| `select` | Dropdown with `options[]` |
| `boolean` | Yes / No toggle buttons |
| `radio` | Single-select pill buttons from `options[]` |
| `checklist` | Multi-select checkbox list from `options[]` |
| `checkbox-group` | Grid checkbox group (JSA style) |
| `pass-fail` | Pass / Fail buttons + comments field |
| `ok-notok-na` | OK / Not OK / N/A buttons + explanation |
| `activity-row` | 4-column row: Activity / Hazards / Controls / Responsibility |
| `personnel-sig` | Name + Role + Sign button row |
| `signature` | Full-screen signature modal — stores `{ sig, signedAt }` |
| `photo` | Camera capture, stores base64 array |
| `voice-note` | Audio recorder, max 30s, stores base64 + duration |
| `gps` | GPS coordinate capture |

### Schema Shape

```json
{
  "slug": "installation",
  "title": "Installation Completion",
  "short": "Installation",
  "description": "Final sign-off on completed LPS installation",
  "ref": "NFPA 780 / UL 96A",
  "category": "completion",
  "branch": null,
  "sort_order": 1,
  "active": true,
  "parent_slug": null,
  "sections": [
    {
      "title": "Job Information",
      "fields": [
        {
          "id": "site_name",
          "label": "Site Name",
          "type": "text",
          "required": true,
          "hint": "Optional helper text"
        }
      ]
    }
  ]
}
```

### Adding a New Form

1. Insert a row into `form_definitions` in Supabase (or use Form Builder at `/forms/builder`)
2. Set `category` to match an existing `form_categories.slug`, or create a new category
3. Set `parent_slug` if it's a sub-form (e.g. a Midstream sub-inspection)
4. The form automatically appears in the Report Forms catalog and is accessible at `/forms/{slug}`

### Form Builder

Located at `/forms/builder`. Management-facing UI that lets users:
- View all active forms with section/field counts
- Edit section titles, add/remove/reorder sections
- Edit field labels, types, options, hints, required flag
- Add fields via a type-picker bottom sheet (grouped: Basic / Choice / Safety / Capture)
- Drag to reorder fields (works on touch and mouse)
- Save changes directly to Supabase — no code deploy needed

---

## 11. Database Schema

### Supabase Project: `jnbdlhyjnzdsvscpgkqi`

All tables have RLS disabled for development. Enable RLS with proper policies before full production launch.

#### `form_categories`
Drives the Report Forms catalog categories.
```
id          uuid PK
slug        text UNIQUE       -- 'completion', 'inspection', 'survey', 'safety'
label       text              -- 'Completion Reports', etc.
branch      text              -- null = all, 'lm', 'bolt'
sort_order  int
active      bool
```

#### `form_definitions`
Every form schema. Sections and fields stored as JSONB.
```
id           uuid PK
slug         text UNIQUE      -- URL-safe identifier, e.g. 'swd-production'
title        text
short        text             -- Abbreviated label
description  text
ref          text             -- Compliance ref, e.g. 'NFPA 780 / UL 96A'
category     text             -- FK to form_categories.slug
branch       text             -- null | 'lm' | 'bolt'
parent_slug  text             -- FK to form_definitions.slug (for sub-forms)
icon_name    text             -- Phosphor icon name string
color        text
color_dim    text
sort_order   int
active       bool
sections     jsonb            -- Array of { title, fields[] }
created_at   timestamptz
updated_at   timestamptz      -- Auto-updated via trigger
```

#### `form_submissions_v2`
All form submissions from the FormEngine.
```
id           uuid PK
form_slug    text             -- FK to form_definitions.slug
branch       text
project_id   uuid
job_number   text
site_name    text
submitted_by text
status       text             -- 'submitted' | 'pending_customer' | 'complete'
form_data    jsonb            -- All field values keyed by field id
pdf_url      text
created_at   timestamptz
updated_at   timestamptz
```

#### `daily_field_logs`
Daily Field Log entries (Part 1 AM + Part 2 PM closeout).
```
id               uuid PK
branch           text
report_date      date
customer         text
customer_site    text
jobsite_id       uuid
supervisor_name  text
submitted_by     text
status           text         -- 'Draft' | 'Submitted' | 'Reviewed'
hours_worked     numeric
jsa_uploaded     bool
manlift_checklist bool
fall_protection  bool
jsa_data         jsonb
manlift_data     jsonb
fall_protection_data jsonb
pdf_url          text
created_at       timestamptz
```

#### `risk_assessments`
Standalone risk assessment records.

#### Storage Bucket
`field-log-pdfs` — subfolders: `reports/`, `jsa-pdfs/`, `completion-forms/`

---

## 12. Offline & Sync

### How it works

When a technician submits a form with no network connection:
1. The payload is saved to **IndexedDB** via Dexie (`localDB.pendingSubmissions`)
2. The success screen shows "Saved Locally" with an amber checkmark
3. The `SyncBadge` shows the pending count
4. When the device comes back online, `useSync` detects the event and calls `flushQueue()`
5. `flushQueue()` loops through pending items, posts each to `form_submissions_v2`, marks synced

### Form schema caching
When `FormPage` fetches a schema from Supabase, it also saves it to `localDB.cachedForms`. If the device is offline on next visit, the cached schema is used so the form can still be filled out.

### Key functions in `src/lib/offline.js`
```js
queueSubmission(payload)      // Add to IndexedDB queue
flushQueue()                  // Attempt to sync all pending to Supabase
cacheFormSchemas(forms[])     // Cache form schemas for offline use
getCachedForm(slug)           // Retrieve cached schema
getPendingCount()             // Returns count of unsynced items (used by SyncBadge)
```

### Dexie schema (IndexedDB)
```js
pendingSubmissions: '++id, form_slug, branch, queued_at, synced'
cachedForms:        'slug, updated_at'
```

---

## 13. PDF Generation

The Daily Field Log PDF is generated by `src/lib/generateDFLPdf.js` using jsPDF.

**What it generates:**
- Page 1: DFL header, job details, crew, hours, equipment
- Safety form pages: JSA, Manlift, Fall Protection — each as a separate attached page, rendered from their Supabase schemas

**The PDF is uploaded to Supabase Storage** (`field-log-pdfs/reports/`) and the URL is saved back to the `daily_field_logs.pdf_url` column.

**How safety form schemas are fetched for PDF rendering:**
```js
// generateDFLPdf.js fetches schemas from Supabase, not mockData
const { data: schemaRows } = await db.from('form_definitions')
  .select('slug, sections')
  .in('slug', ['jsa', 'manlift-checklist', 'fall-protection'])
```

---

## 14. Role System

Located in `src/lib/useRole.js`. Currently uses `localStorage` — will swap to Supabase Auth when login is built.

**Roles:**
- `'field'` — default, technician access
- `'management'` — can access Form Builder, edit forms

**Usage:**
```jsx
const { role, isManagement, isField } = useRole()

{isManagement && <button>Edit Form</button>}
```

**When auth is implemented:** Replace `getRole()` in `useRole.js` with a Supabase session lookup. Every gated component updates automatically — no other changes needed.

---

## 15. Performance

### Bundle splitting
Vite is configured to split vendor libraries into separate cached chunks:
- `vendor-react` — React + React DOM + React Router (~230 kB)
- `vendor-ui` — Phosphor Icons (~170 kB)
- `vendor-pdf` — jsPDF + html2canvas (~600 kB) — **only downloaded when generating a PDF**
- `vendor-dexie` — Dexie IndexedDB (~94 kB) — only downloaded when offline queue is used
- Each page is its own lazy-loaded chunk (2–53 kB)

### Lazy loading
All page components are wrapped in `React.lazy()` and `<Suspense>`. A page's code chunk downloads on first visit only. Subsequent visits use the browser cache.

### Pagination
- `DailyFieldLog` — loads 20 entries at a time, "Load more" button
- `ProjectDetail` — capped at 25 records per query with `.range(0, 24)`

### DB indexes
Production indexes are defined in `supabase/production_indexes.sql`. Run this file once in the Supabase SQL Editor before launch. Indexes cover all columns used for filtering, sorting, and joining across the main tables.

---

## 16. Data & Mock Data

`src/data/mockData.js` provides mock data used for UI development while real Supabase data is sparse.

**Exports:**
- `PROJECTS` — mock project records (used by dashboard, kanban, DFL dropdowns)
- `TECHNICIANS` — technician directory
- `STATS` — branch stats for BranchTabs
- `MOCK_REPORTS` — mock field reports
- `MOCK_SUBMISSIONS` — mock form submissions

**Strategy:** Pages fall back to mock data when Supabase returns empty results. As real data is imported, mock data usage will naturally phase out. Eventually `mockData.js` can be deleted and replaced with Supabase-only fetches.

---

## 17. Standards & Conventions

### Single source of truth
Every shared component lives in one file. No copy-pasting renderers between pages.
- Signature pad → `SigPad` exported from `FormEngine.jsx`
- Field rendering → `FormField` in `FormEngine.jsx`
- Form validation → `validateSchema` in `FormEngine.jsx`

### Adding a new page
1. Create `src/pages/MyPage.jsx`
2. Add a lazy import to `src/App.jsx`
3. Add a `<Route>` to the Routes block
4. Add to `PAGE_META` in `App.jsx` for the top bar title
5. Add to `NAV_ITEMS` in `Sidebar.jsx` if it needs a nav entry

### Adding a new field type
1. Add the renderer in `FormEngine.jsx` — `FormField` function
2. Add to the readOnly display block in `FormField`
3. Add to `FIELD_TYPES` array in `FormBuilder.jsx`
4. Add to the appropriate `TYPE_GROUPS` group in `FormBuilder.jsx`
5. Handle it in `validateSchema` if it has special empty-check logic

### CSS rules
- Use design tokens (`--navy`, `--sp-4`, `--fs-md`) — never hardcode values
- Cards: `background: var(--surface-raised)`, no border, no shadow
- Card headers: `background: var(--navy)` (or `bc.bgActive` for branch-aware)
- All styles go in `globals.css` — no inline style blocks for layout patterns

### Imports
- Never use mid-file imports — all imports at the top of the file
- External libraries first, then internal imports
- Relative imports use `../` paths (no path aliases configured)

### Git
- All changes committed to `main`
- Vercel auto-deploys on every push
- Commit messages: `Area: short description` (e.g. `FormEngine: add voice-note field type`)
