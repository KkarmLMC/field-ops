// Mock projects for when Supabase is empty — maps to real NFPA field ops
// branch: 'lm'         = Lightning Master (Oilfield, Chemical, Industrial)
//         'bolt'        = Bolt Florida     (Commercial, Municipal, Hotels)
//         'bolt-dallas' = Bolt Dallas      (Commercial, Industrial, Energy)

export const MOCK_PROJECTS = [
  { id: 'p-001', branch: 'bolt', name: 'Ritz-Carlton LPS Installation', customer_account: 'Ritz-Carlton Amelia Island', address: '4750 Amelia Island Pkwy', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0312', stage: 'In Progress', primary_contact: 'Michael Torres', primary_contact_phone: '904-555-0301', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-10T08:00:00Z' },
  { id: 'p-002', branch: 'bolt', name: 'Nassau County Courthouse LPS', customer_account: 'Nassau County Government', address: '76 S 4th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0318', stage: 'In Progress', primary_contact: 'Judge Patricia Lane', primary_contact_phone: '904-555-0302', lmc_representative: 'Tamika Russell', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-12T08:00:00Z' },
  { id: 'p-003', branch: 'bolt', name: 'Omni Resort Annual Inspection', customer_account: 'Omni Amelia Island Resort', address: '39 Beach Lagoon Rd', city: 'Amelia Island', state: 'FL', job_number: 'JOB-2026-0321', stage: 'In Progress', primary_contact: 'Sarah Chen', primary_contact_phone: '904-555-0303', lmc_representative: 'Priya Nair', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-14T08:00:00Z' },
  { id: 'p-004', branch: 'lm',   name: 'Port of Fernandina Crane Inspection', customer_account: 'Port of Fernandina', address: '1 Front St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0298', stage: 'Scheduled', primary_contact: 'Dave Rawlings', primary_contact_phone: '904-555-0304', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-25', archived: false, created_at: '2026-03-08T08:00:00Z' },
  { id: 'p-005', branch: 'bolt', name: 'Baptist Medical Center Survey', customer_account: 'Baptist Medical Center Nassau', address: '1250 S 18th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0287', stage: 'Scheduled', primary_contact: 'Dr. Angela Reeves', primary_contact_phone: '904-555-0305', lmc_representative: 'Diane Okafor', scheduled_date: '2026-03-26', archived: false, created_at: '2026-03-05T08:00:00Z' },
  { id: 'p-006', branch: 'lm',   name: 'Rayonier Advanced Materials Cert', customer_account: 'Rayonier Advanced Materials', address: '1301 Rayonier Way', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0271', stage: 'Complete', primary_contact: 'Tom Bradley', primary_contact_phone: '904-555-0306', lmc_representative: 'Priya Nair', scheduled_date: '2026-03-20', archived: false, created_at: '2026-02-28T08:00:00Z' },
  { id: 'p-007', branch: 'bolt', name: 'Amelia Island Lighthouse Install', customer_account: 'FL State Parks', address: "215 O'Hagan Ln", city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0255', stage: 'Complete', primary_contact: 'Ranger Williams', primary_contact_phone: '904-555-0307', lmc_representative: 'Diane Okafor', scheduled_date: '2026-03-14', archived: false, created_at: '2026-02-20T08:00:00Z' },
  { id: 'p-008', branch: 'bolt', name: 'Amelia Island Plantation — FAILED', customer_account: 'Amelia Island Plantation', address: '39 Beach Lagoon Rd', city: 'Amelia Island', state: 'FL', job_number: 'JOB-2026-0263', stage: 'Pending Review', primary_contact: 'Karen Mitchell', primary_contact_phone: '904-555-0308', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-18', archived: false, created_at: '2026-03-01T08:00:00Z' },
  { id: 'p-009', branch: 'lm',           name: 'WestRock Paper Mill Annual Test',       customer_account: 'WestRock Company',             address: '1500 N 8th St',         city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0334', stage: 'Awarded',      primary_contact: 'Plant Safety Office', primary_contact_phone: '904-555-0309', lmc_representative: 'Marcus Webb',  scheduled_date: '2026-03-29', archived: false, created_at: '2026-03-15T08:00:00Z' },
  { id: 'p-010', branch: 'bolt',         name: 'First Baptist Church Install',           customer_account: 'First Baptist Church',          address: '1600 S 8th St',         city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0220', stage: 'Complete',     primary_contact: 'Pastor James',        primary_contact_phone: '904-555-0310', lmc_representative: 'Marcus Webb',  scheduled_date: '2026-03-05', archived: false, created_at: '2026-02-15T08:00:00Z' },
  // ── Bolt Dallas ──
  { id: 'p-011', branch: 'bolt-dallas',  name: 'Oncor Substation LPS Install',           customer_account: 'Oncor Electric Delivery',       address: '1616 Woodall Rodgers Fwy', city: 'Dallas',         state: 'TX', job_number: 'JOB-2026-0401', stage: 'In Progress',  primary_contact: 'Kyle Brandt',         primary_contact_phone: '214-555-0401', lmc_representative: 'Chris Navarro', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-10T08:00:00Z' },
  { id: 'p-012', branch: 'bolt-dallas',  name: 'AT&T Discovery District Inspection',     customer_account: 'AT&T Inc.',                     address: '208 S Akard St',        city: 'Dallas',         state: 'TX', job_number: 'JOB-2026-0408', stage: 'Scheduled',    primary_contact: 'Facilities Manager',  primary_contact_phone: '214-555-0402', lmc_representative: 'Chris Navarro', scheduled_date: '2026-03-27', archived: false, created_at: '2026-03-12T08:00:00Z' },
  { id: 'p-013', branch: 'bolt-dallas',  name: 'Dallas Cowboys Training Facility LPS',   customer_account: 'Dallas Cowboys / AT&T Stadium', address: '9 Cowboys Way',         city: 'Frisco',         state: 'TX', job_number: 'JOB-2026-0415', stage: 'Complete',     primary_contact: 'Ryan Scott',          primary_contact_phone: '214-555-0403', lmc_representative: 'Chris Navarro', scheduled_date: '2026-03-15', archived: false, created_at: '2026-03-01T08:00:00Z' },
  { id: 'p-014', branch: 'bolt-dallas',  name: 'Pioneer Natural Resources Cert',         customer_account: 'Pioneer Natural Resources',     address: '777 Hidden Ridge',      city: 'Irving',         state: 'TX', job_number: 'JOB-2026-0422', stage: 'Pending Review', primary_contact: 'Safety Director',   primary_contact_phone: '214-555-0404', lmc_representative: 'Chris Navarro', scheduled_date: '2026-03-19', archived: false, created_at: '2026-03-05T08:00:00Z' },
];

// Mock daily field reports
export const MOCK_REPORTS = [
  {
    id: 'r-001', project_id: 'p-001', branch: 'bolt', report_date: '2026-03-24', submitted_by: 'Ray Thibodaux',
    customer_site: 'Ritz-Carlton Amelia Island — Rooftop',
    gps_location: '30.6282, -81.4637',
    crew_on_site: ['Ray Thibodaux', 'Priya Nair'],
    hours_worked: 8, work_types: ['Installation'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 18, drive_time: '28 min',
    other_tasks: 'Coordinated HVAC bonding with hotel facilities team.',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Submitted', projects: { name: 'Ritz-Carlton LPS Installation' },
  },
  {
    id: 'r-002', project_id: 'p-001', branch: 'bolt', report_date: '2026-03-23', submitted_by: 'Ray Thibodaux',
    customer_site: 'Ritz-Carlton Amelia Island — Rooftop',
    gps_location: '30.6282, -81.4637',
    crew_on_site: ['Ray Thibodaux'],
    hours_worked: 7.5, work_types: ['Installation', 'Site Revisit'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 18, drive_time: '28 min',
    other_tasks: '',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Reviewed', projects: { name: 'Ritz-Carlton LPS Installation' },
  },
  {
    id: 'r-003', project_id: 'p-002', branch: 'bolt', report_date: '2026-03-24', submitted_by: 'Tamika Russell',
    customer_site: 'Nassau County Courthouse — 3rd Floor Roof',
    gps_location: '30.6698, -81.4616',
    crew_on_site: ['Tamika Russell', 'Diane Okafor'],
    hours_worked: 6, work_types: ['Installation'],
    jsa_uploaded: true, manlift_checklist: false, fall_protection: true,
    miles_driven: 5, drive_time: '12 min',
    other_tasks: 'Historic masonry constraint — no drilling in NW facade. Will need custom bracket next visit.',
    supervisor_name: '', signed: false,
    status: 'Draft', projects: { name: 'Nassau County Courthouse LPS' },
  },
  {
    id: 'r-004', project_id: 'p-003', branch: 'bolt', report_date: '2026-03-24', submitted_by: 'Priya Nair',
    customer_site: 'Omni Amelia Island Resort — Tower Roof',
    gps_location: '30.5741, -81.4223',
    crew_on_site: ['Priya Nair'],
    hours_worked: 5, work_types: ['Inspection'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 22, drive_time: '35 min',
    other_tasks: 'Pool area bonding check completed. Minor corrosion noted on south down conductor — flagged for remediation.',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Submitted', projects: { name: 'Omni Resort Annual Inspection' },
  },
  {
    id: 'r-005', project_id: 'p-006', branch: 'lm', report_date: '2026-03-20', submitted_by: 'Priya Nair',
    customer_site: 'Rayonier Advanced Materials — Processing Unit 3',
    gps_location: '30.6791, -81.4558',
    crew_on_site: ['Priya Nair', 'Jake Herrera'],
    hours_worked: 9, work_types: ['Inspection', 'Remediation'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 8, drive_time: '15 min',
    other_tasks: '',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Reviewed', projects: { name: 'Rayonier Advanced Materials Cert' },
  },
  {
    id: 'r-006', project_id: 'p-007', branch: 'bolt', report_date: '2026-03-14', submitted_by: 'Diane Okafor',
    customer_site: 'Amelia Island Lighthouse — Exterior & Tower',
    gps_location: '30.6769, -81.4590',
    crew_on_site: ['Diane Okafor', 'Ray Thibodaux'],
    hours_worked: 8, work_types: ['Installation'],
    jsa_uploaded: true, manlift_checklist: false, fall_protection: true,
    miles_driven: 3, drive_time: '8 min',
    other_tasks: 'State Parks approval on file. All ground resistance readings <5Ω.',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Reviewed', projects: { name: 'Amelia Island Lighthouse Install' },
  },
  // ── LM entries ──
  {
    id: 'r-007', project_id: 'p-004', branch: 'lm', report_date: '2026-03-24', submitted_by: 'Marcus Webb',
    customer_site: 'Port of Fernandina — Crane Bay 4',
    gps_location: '30.6721, -81.4601',
    crew_on_site: ['Marcus Webb', 'Jake Herrera'],
    hours_worked: 10, work_types: ['Inspection'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 4, drive_time: '10 min',
    other_tasks: 'Saltwater corrosion on 2 ground rods — remediation order submitted.',
    supervisor_name: '', signed: false,
    status: 'Draft', projects: { name: 'Port of Fernandina Crane Inspection' },
  },
  {
    id: 'r-008', project_id: 'p-009', branch: 'lm', report_date: '2026-03-22', submitted_by: 'Jake Herrera',
    customer_site: 'WestRock Paper Mill — Stacks 1–3',
    gps_location: '30.6805, -81.4512',
    crew_on_site: ['Jake Herrera'],
    hours_worked: 6.5, work_types: ['Site Revisit'],
    jsa_uploaded: true, manlift_checklist: false, fall_protection: true,
    miles_driven: 6, drive_time: '12 min',
    other_tasks: 'Pre-job walkthrough. Confirmed PPE requirements with plant safety officer.',
    supervisor_name: 'Marcus Webb', signed: true,
    status: 'Submitted', projects: { name: 'WestRock Paper Mill Annual Test' },
  },
  // ── Bolt Dallas entries ──
  {
    id: 'r-009', project_id: 'p-011', branch: 'bolt-dallas', report_date: '2026-03-24', submitted_by: 'Chris Navarro',
    customer_site: 'Oncor Substation — Transmission Bay',
    gps_location: '32.7812, -96.7974',
    crew_on_site: ['Chris Navarro', 'Lena Kowalski'],
    hours_worked: 9, work_types: ['Installation'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 14, drive_time: '22 min',
    other_tasks: 'Utility coordination required for Zone 3 access — scheduled for tomorrow AM.',
    supervisor_name: '', signed: false,
    status: 'Draft', projects: { name: 'Oncor Substation LPS Install' },
  },
  {
    id: 'r-010', project_id: 'p-013', branch: 'bolt-dallas', report_date: '2026-03-15', submitted_by: 'Chris Navarro',
    customer_site: 'Dallas Cowboys Training Facility — 3 Buildings',
    gps_location: '33.1581, -96.8350',
    crew_on_site: ['Chris Navarro', 'Lena Kowalski'],
    hours_worked: 8.5, work_types: ['Installation', 'Inspection'],
    jsa_uploaded: true, manlift_checklist: true, fall_protection: true,
    miles_driven: 31, drive_time: '42 min',
    other_tasks: 'Certificate issued. All 3 buildings passed. Readings <4Ω at all stations.',
    supervisor_name: 'Chris Navarro', signed: true,
    status: 'Reviewed', projects: { name: 'Dallas Cowboys Training Facility LPS' },
  },
];

// Mock form submissions
export const MOCK_SUBMISSIONS = [
  { id: 's-001', project_id: 'p-001', branch: 'bolt', submitted_by: 'Ray Thibodaux', status: 'Submitted', created_at: '2026-03-22T10:00:00Z', projects: { name: 'Ritz-Carlton LPS Installation' } },
  { id: 's-002', project_id: 'p-006', branch: 'lm',   submitted_by: 'Priya Nair', status: 'Complete', created_at: '2026-03-20T14:00:00Z', projects: { name: 'Rayonier Advanced Materials Cert' } },
  { id: 's-003', project_id: 'p-007', branch: 'bolt', submitted_by: 'Diane Okafor', status: 'Complete', created_at: '2026-03-14T16:00:00Z', projects: { name: 'Amelia Island Lighthouse Install' } },
  { id: 's-004', project_id: 'p-008', branch: 'bolt', submitted_by: 'Marcus Webb', status: 'Under Review', created_at: '2026-03-18T11:00:00Z', projects: { name: 'Amelia Island Plantation — FAILED' } },
  { id: 's-005', project_id: 'p-002', branch: 'bolt', submitted_by: 'Tamika Russell', status: 'Pending Customer', created_at: '2026-03-23T09:00:00Z', projects: { name: 'Nassau County Courthouse LPS' } },
];

export const TECHNICIANS = [
  { id: 'T001', branch: 'lm',   name: 'Marcus Webb',    license: 'LPI-3847', status: 'active', phone: '904-555-0142' },
  { id: 'T002', branch: 'bolt', name: 'Diane Okafor',   license: 'LPI-2291', status: 'active', phone: '904-555-0187' },
  { id: 'T003', branch: 'bolt', name: 'Ray Thibodaux',  license: 'LPI-4056', status: 'field',  phone: '904-555-0203' },
  { id: 'T004', branch: 'bolt', name: 'Priya Nair',     license: 'LPI-3312', status: 'field',  phone: '904-555-0219' },
  { id: 'T005', branch: 'lm',   name: 'Jake Herrera',   license: 'LPI-4410', status: 'active', phone: '904-555-0238' },
  { id: 'T006', branch: 'bolt',        name: 'Tamika Russell', license: 'LPI-3780', status: 'field',  phone: '904-555-0251' },
  { id: 'T007', branch: 'bolt-dallas', name: 'Chris Navarro',  license: 'LPI-5102', status: 'field',  phone: '214-555-0701' },
  { id: 'T008', branch: 'bolt-dallas', name: 'Lena Kowalski',  license: 'LPI-5218', status: 'active', phone: '214-555-0702' },
];

export const JOBS = [
  // ── ACTIVE ──
  { id: 'JOB-2026-0312', branch: 'bolt', type: 'installation', status: 'active',    client: 'Ritz-Carlton Amelia Island',     address: '4750 Amelia Island Pkwy, Fernandina Beach, FL 32034', structure: 'Hotel / Resort — 12-story, 280ft',                      assignedTo: 'T003', scheduledDate: '2026-03-24', nfpaClass: 'I',   priority: 'high',   progress: 65,  forms: ['site-survey', 'installation'], notes: 'Rooftop HVAC bonding required. Elevator shaft grounding per UL 96A §4.2.' },
  { id: 'JOB-2026-0318', branch: 'bolt', type: 'installation', status: 'active',    client: 'Nassau County Courthouse',       address: '76 S 4th St, Fernandina Beach, FL 32034',            structure: 'Government — 3-story, 52ft, historic masonry',          assignedTo: 'T006', scheduledDate: '2026-03-24', nfpaClass: 'I',   priority: 'high',   progress: 40,  forms: ['site-survey'],                notes: 'Historic preservation constraints. No drilling into original facade.' },
  { id: 'JOB-2026-0321', branch: 'bolt', type: 'inspection',   status: 'ul-inspection', client: 'Omni Amelia Island Resort',  address: '39 Beach Lagoon Rd, Amelia Island, FL 32034',         structure: 'Resort — 8-story tower + 4 villa clusters, 220ft',      assignedTo: 'T004', scheduledDate: '2026-03-24', nfpaClass: 'I',   priority: 'medium', progress: 75,  forms: ['site-survey', 'inspection'],  notes: 'Annual inspection per contract. Pool area bonding check added this year. Awaiting UL sign-off.' },
  { id: 'JOB-2026-0315', branch: 'lm',   type: 'installation', status: 'active',    client: 'Rayonier Chemical Plant — Unit 3', address: '1301 Rayonier Way, Fernandina Beach, FL 32034',     structure: 'Chemical — Processing unit, 95ft, classified area',     assignedTo: 'T001', scheduledDate: '2026-03-24', nfpaClass: 'II',  priority: 'high',   progress: 55,  forms: ['site-survey', 'installation'], notes: 'Class I Div 2 hazardous area. Intrinsically safe bonding required.' },
  { id: 'JOB-2026-0317', branch: 'lm',   type: 'inspection',   status: 'ul-inspection', client: 'Port Crane Complex — Bay 4', address: '1 Front St, Fernandina Beach, FL 32034',             structure: 'Industrial — Port crane, 180ft, saltwater environment', assignedTo: 'T005', scheduledDate: '2026-03-24', nfpaClass: 'II',  priority: 'high',   progress: 90,  forms: ['site-survey', 'inspection'],  notes: 'Saltwater corrosion expected on ground rods. Full test required. UL final review pending.' },

  // ── AWAITING PO ──
  { id: 'JOB-2026-0345', branch: 'lm',         type: 'installation', status: 'awaiting-po', client: 'ExxonMobil Refinery — Unit 7',  address: '1600 Refinery Blvd, Fernandina Beach, FL 32034', structure: 'Industrial — Refinery unit, 120ft, classified area',  assignedTo: 'T001', scheduledDate: '2026-04-07', nfpaClass: 'II',  priority: 'high',   progress: 0, forms: [], notes: 'Awaiting procurement approval. PO routed to facility manager.' },
  { id: 'JOB-2026-0347', branch: 'bolt',        type: 'site-survey',  status: 'awaiting-po', client: 'Marriott Sawgrass Resort',     address: '1000 PGA Tour Blvd, Ponte Vedra Beach, FL 32082', structure: 'Resort — 7-story, 220 rooms, pool complex',           assignedTo: 'T002', scheduledDate: '2026-04-10', nfpaClass: 'I',   priority: 'medium', progress: 0, forms: [], notes: 'New client. Finance team reviewing quote. PO expected by April 1.' },
  { id: 'JOB-2026-0349', branch: 'bolt-dallas', type: 'installation', status: 'awaiting-po', client: 'Tesla Gigafactory Texas',      address: '13101 Harold Green Rd, Austin, TX 78725',         structure: 'Industrial — Gigafactory, multiple structures, 80ft', assignedTo: 'T007', scheduledDate: '2026-04-14', nfpaClass: 'II',  priority: 'high',   progress: 0, forms: [], notes: 'Large scope — 22 structures. Legal review ongoing. PO pending.' },

  // ── SCHEDULED ──
  { id: 'JOB-2026-0298', branch: 'lm',   type: 'inspection',   status: 'scheduled', client: 'Port of Fernandina — Crane Complex', address: '1 Front St, Fernandina Beach, FL 32034',          structure: 'Industrial — Port crane cluster, tallest 180ft',        assignedTo: 'T001', scheduledDate: '2026-03-25', nfpaClass: 'II',  priority: 'high',   progress: 0,   forms: [],                             notes: 'Annual inspection. Last certified 2025-03-10. Saltwater corrosion expected.' },
  { id: 'JOB-2026-0287', branch: 'bolt', type: 'site-survey',  status: 'scheduled', client: 'Baptist Medical Center Nassau',  address: '1250 S 18th St, Fernandina Beach, FL 32034',          structure: 'Healthcare — 4-story, 68ft, critical facility',         assignedTo: 'T002', scheduledDate: '2026-03-26', nfpaClass: 'I',   priority: 'medium', progress: 0,   forms: [],                             notes: 'Pre-install survey for generator pad bonding and rooftop expansion.' },
  { id: 'JOB-2026-0325', branch: 'bolt', type: 'site-survey',  status: 'scheduled', client: 'Fernandina Beach Golf Club',     address: '2800 Bill Melton Rd, Fernandina Beach, FL 32034',    structure: 'Commercial — Clubhouse + maintenance barn, 35ft',       assignedTo: 'T005', scheduledDate: '2026-03-27', nfpaClass: 'III', priority: 'low',    progress: 0,   forms: [],                             notes: 'New client inquiry. Insurance requiring LPS evaluation post-strike.' },
  { id: 'JOB-2026-0330', branch: 'bolt', type: 'installation', status: 'scheduled', client: 'Kraft Athletic Club at UNF',    address: '1 UNF Drive, Jacksonville, FL 32224',                structure: 'Educational — Athletic facility, steel frame, 65ft',    assignedTo: 'T003', scheduledDate: '2026-03-28', nfpaClass: 'II',  priority: 'medium', progress: 0,   forms: ['site-survey'],                notes: 'Installing 24 air terminals, 8 down conductors. Coordinate for outage window.' },
  { id: 'JOB-2026-0334', branch: 'lm',   type: 'annual-test',  status: 'scheduled', client: 'WestRock Paper Mill',           address: '1500 N 8th St, Fernandina Beach, FL 32034',          structure: 'Industrial — Paper mill, multiple stacks, 140ft',       assignedTo: 'T001', scheduledDate: '2026-03-29', nfpaClass: 'II',  priority: 'high',   progress: 0,   forms: [],                             notes: 'Hazardous — paper dust ignition risk. Full PPE + escort required.' },
  { id: 'JOB-2026-0338', branch: 'lm',   type: 'annual-test',  status: 'scheduled', client: 'Fernandina Warehouse Complex',  address: '4500 Buccaneer Trail, Yulee, FL 32097',              structure: 'Industrial — Warehouse, 42ft, steel frame',            assignedTo: 'T005', scheduledDate: '2026-03-30', nfpaClass: 'III', priority: 'low',    progress: 0,   forms: [],                             notes: 'Routine biannual. Check NE corner bracket corrosion noted last visit.' },

  // ── COMPLETED ──
  { id: 'JOB-2026-0271', branch: 'lm',   type: 'certification',status: 'completed', client: 'Rayonier Advanced Materials',   address: '1301 Rayonier Way, Fernandina Beach, FL 32034',      structure: 'Industrial — Processing plant, multiple structures',    assignedTo: 'T004', scheduledDate: '2026-03-20', nfpaClass: 'II',  priority: 'medium', progress: 100, forms: ['site-survey', 'installation', 'inspection'], notes: 'Certified. All 7 structures passed. Certificate #BOLT-2026-0271 issued.' },
  { id: 'JOB-2026-0255', branch: 'bolt', type: 'installation', status: 'completed', client: 'Amelia Island Lighthouse',      address: "215 O'Hagan Ln, Fernandina Beach, FL 32034",         structure: 'Historic — Lighthouse tower, 64ft, brick/masonry',     assignedTo: 'T002', scheduledDate: '2026-03-14', nfpaClass: 'I',   priority: 'high',   progress: 100, forms: ['site-survey', 'installation', 'inspection'], notes: 'Historic site — State Parks approval obtained. All readings <5Ω.' },
  { id: 'JOB-2026-0248', branch: 'bolt', type: 'annual-test',  status: 'completed', client: 'Fernandina Beach Municipal Airport', address: '1600 Airport Rd, Fernandina Beach, FL 32034',     structure: 'Aviation — Control tower 48ft, hangar complex',        assignedTo: 'T005', scheduledDate: '2026-03-12', nfpaClass: 'I',   priority: 'high',   progress: 100, forms: ['site-survey', 'inspection'],  notes: 'Annual test passed. All 4 ground electrode stations ≤6Ω. FAA compliance letter sent.' },
  { id: 'JOB-2026-0240', branch: 'lm',   type: 'inspection',   status: 'completed', client: 'Publix Distribution Center',    address: '4500 Buccaneer Trail, Yulee, FL 32097',              structure: 'Industrial — Warehouse complex, 42ft, steel frame',    assignedTo: 'T006', scheduledDate: '2026-03-10', nfpaClass: 'III', priority: 'low',    progress: 100, forms: ['site-survey', 'inspection'],  notes: 'Minor corrosion on NE corner down conductor bracket — noted for next service.' },
  { id: 'JOB-2026-0232', branch: 'bolt', type: 'certification',status: 'completed', client: 'Osprey Village Retirement Community', address: '600 Osprey Village Dr, Amelia Island, FL 32034', structure: 'Residential — 6 buildings, tallest 3-story, 38ft',     assignedTo: 'T003', scheduledDate: '2026-03-08', nfpaClass: 'III', priority: 'medium', progress: 100, forms: ['site-survey', 'installation', 'inspection'], notes: 'Full LPS across all 6 buildings. Certificate #BOLT-2026-0232 issued.' },
  { id: 'JOB-2026-0220', branch: 'bolt', type: 'installation', status: 'completed', client: 'First Baptist Church — Fernandina', address: '1600 S 8th St, Fernandina Beach, FL 32034',       structure: 'Religious — Sanctuary + steeple, 85ft',                assignedTo: 'T001', scheduledDate: '2026-03-05', nfpaClass: 'I',   priority: 'medium', progress: 100, forms: ['site-survey', 'installation', 'inspection'], notes: 'Steeple custom air terminal mount. Ground resistance 3.2Ω at all stations.' },

  // ── BOLT DALLAS ──
  { id: 'JOB-2026-0401', branch: 'bolt-dallas', type: 'installation', status: 'active',    client: 'Oncor Electric Delivery',          address: '1616 Woodall Rodgers Fwy, Dallas, TX 75202',       structure: 'Utility — Transmission substation, 85ft steel lattice', assignedTo: 'T007', scheduledDate: '2026-03-24', nfpaClass: 'II',  priority: 'high',   progress: 50,  forms: ['site-survey', 'installation'], notes: 'High-voltage substation. Full PPE and utility coordination required.' },
  { id: 'JOB-2026-0408', branch: 'bolt-dallas', type: 'inspection',   status: 'ul-inspection', client: 'AT&T Discovery District',      address: '208 S Akard St, Dallas, TX 75202',                 structure: 'Commercial — 29-story tower, 430ft',                    assignedTo: 'T008', scheduledDate: '2026-03-27', nfpaClass: 'I',   priority: 'medium', progress: 85,  forms: ['site-survey', 'inspection'],  notes: 'Annual high-rise inspection. Elevator machine room bonding required. UL sign-off pending.' },
  { id: 'JOB-2026-0415', branch: 'bolt-dallas', type: 'certification',status: 'completed', client: 'Dallas Cowboys Training Facility', address: '9 Cowboys Way, Frisco, TX 75034',                  structure: 'Sports — Training complex, 3 buildings, max 60ft',      assignedTo: 'T007', scheduledDate: '2026-03-15', nfpaClass: 'I',   priority: 'medium', progress: 100, forms: ['site-survey', 'installation', 'inspection'], notes: 'Full LPS across 3 buildings. All readings <4Ω. Certificate issued.' },
  { id: 'JOB-2026-0422', branch: 'bolt-dallas', type: 'annual-test',  status: 'scheduled', client: 'Pioneer Natural Resources HQ',     address: '777 Hidden Ridge, Irving, TX 75038',               structure: 'Energy — Corporate campus, 8-story, 130ft',             assignedTo: 'T008', scheduledDate: '2026-03-30', nfpaClass: 'II',  priority: 'high',   progress: 0,   forms: ['site-survey'],                notes: 'Annual test for energy sector compliance. Wind turbine bonding included.' },

  // ── POSTPONED ──
  { id: 'JOB-2026-0351', branch: 'lm',         type: 'installation', status: 'postponed', client: 'Georgia-Pacific Mill — Stack 2', address: '1 Mill Rd, Palatka, FL 32177',                    structure: 'Industrial — Paper mill stack, 160ft',                assignedTo: 'T005', scheduledDate: '2026-04-01', nfpaClass: 'II',  priority: 'high',   progress: 0, forms: [], notes: 'Postponed — client facility outage rescheduled. New date TBD.' },
  { id: 'JOB-2026-0353', branch: 'bolt',        type: 'annual-test',  status: 'postponed', client: 'Sea Turtle Inn',                address: '1 Ocean Blvd, Atlantic Beach, FL 32233',          structure: 'Hospitality — Beachfront hotel, 6-story, 72ft',       assignedTo: 'T003', scheduledDate: '2026-03-22', nfpaClass: 'I',   priority: 'low',    progress: 0, forms: [], notes: 'Postponed at client request — peak spring season. Rescheduled to June.' },
  { id: 'JOB-2026-0355', branch: 'bolt-dallas', type: 'site-survey',  status: 'postponed', client: 'Hunt Oil HQ',                   address: '1900 N Akard St, Dallas, TX 75201',               structure: 'Commercial — 14-story corporate tower, 210ft',        assignedTo: 'T008', scheduledDate: '2026-03-20', nfpaClass: 'I',   priority: 'medium', progress: 0, forms: [], notes: 'Postponed — building access permit delayed by city. Rescheduling in progress.' },

  // ── FAILED ──
  { id: 'JOB-2026-0263', branch: 'bolt', type: 'annual-test',  status: 'failed',    client: 'Amelia Island Plantation',     address: '39 Beach Lagoon Rd, Amelia Island, FL 32034',        structure: 'Resort — Multiple buildings, tallest 45ft',            assignedTo: 'T001', scheduledDate: '2026-03-18', nfpaClass: 'I',   priority: 'high',   progress: 90,  forms: ['site-survey', 'inspection'],  notes: 'FAILED: Ground resistance 28Ω at Buildings C. Exceeds 10Ω limit. Remediation order issued.' },
  { id: 'JOB-2026-0244', branch: 'lm',   type: 'inspection',   status: 'failed',    client: 'Sadler Point Marina',          address: '4669 Roosevelt Blvd, Jacksonville, FL 32210',        structure: 'Marine — Fuel dock + ship store, 28ft, wood frame',    assignedTo: 'T004', scheduledDate: '2026-03-11', nfpaClass: 'I',   priority: 'high',   progress: 85,  forms: ['site-survey', 'inspection'],  notes: 'FAILED: 3 of 6 air terminals missing — storm damage. Fuel dock bonding compromised. Urgent.' },
  { id: 'JOB-2026-0236', branch: 'lm',   type: 'annual-test',  status: 'failed',    client: 'St. Augustine Distillery',     address: '112 Riberia St, St. Augustine, FL 32084',            structure: 'Historic/Industrial — Distillery, 46ft, brick',        assignedTo: 'T006', scheduledDate: '2026-03-09', nfpaClass: 'I',   priority: 'high',   progress: 80,  forms: ['inspection'],                 notes: 'FAILED: Ground resistance 15Ω — soil dried out. Flammable vapor — critical. Add supplemental ground rods.' },
];

export const FORM_TEMPLATES = {
  'site-survey': {
    id: 'site-survey',
    label: 'Site Survey',
    nfpaRef: 'NFPA 780 Ch. 4',
    sections: [
      {
        id: 'structure',
        title: 'Structure Classification',
        fields: [
          { id: 'structure_type', label: 'Structure Type', type: 'select', options: ['Commercial', 'Industrial', 'Healthcare', 'Educational', 'Residential', 'Utility', 'Other'], required: true, nfpa: '§4.1' },
          { id: 'height_ft', label: 'Height (ft)', type: 'number', required: true, nfpa: '§4.2' },
          { id: 'construction', label: 'Construction Material', type: 'select', options: ['Steel Frame', 'Concrete', 'Masonry', 'Wood Frame', 'Mixed'], required: true, nfpa: '§4.3' },
          { id: 'occupancy', label: 'Occupancy Class', type: 'select', options: ['Class I', 'Class II', 'Class III'], required: true, nfpa: '§4.4' },
          { id: 'risk_index', label: 'Risk Index Score', type: 'number', required: true, nfpa: '§4.5' },
        ]
      },
      {
        id: 'roof',
        title: 'Roof Conditions',
        fields: [
          { id: 'roof_type', label: 'Roof Type', type: 'select', options: ['Flat', 'Gabled', 'Hip', 'Shed', 'Mansard', 'Other'], required: true, nfpa: '§5.1' },
          { id: 'roof_material', label: 'Roof Material', type: 'select', options: ['Metal', 'Membrane', 'Asphalt', 'Tile', 'Concrete', 'Green Roof'], required: true, nfpa: '§5.2' },
          { id: 'hvac_present', label: 'HVAC Equipment on Roof', type: 'boolean', required: true, nfpa: '§5.4' },
          { id: 'existing_terminals', label: 'Existing Air Terminals', type: 'boolean', nfpa: '§5.3' },
          { id: 'roof_notes', label: 'Roof Condition Notes', type: 'textarea' },
        ]
      },
      {
        id: 'ground',
        title: 'Ground Electrode Assessment',
        fields: [
          { id: 'soil_type', label: 'Soil Type', type: 'select', options: ['Sandy', 'Clay', 'Loam', 'Rocky', 'Mixed'], required: true, nfpa: '§8.1' },
          { id: 'moisture', label: 'Moisture Conditions', type: 'select', options: ['Dry', 'Moderate', 'Wet', 'Coastal/Salt Exposure'], required: true, nfpa: '§8.2' },
          { id: 'existing_ground', label: 'Existing Grounding System', type: 'boolean', nfpa: '§8.3' },
          { id: 'estimated_resistance', label: 'Estimated Ground Resistance (Ω)', type: 'number', nfpa: '§8.4' },
        ]
      }
    ]
  },
  'installation': {
    id: 'installation',
    label: 'Installation Checklist',
    nfpaRef: 'NFPA 780 Ch. 5–8',
    sections: [
      {
        id: 'air_terminals',
        title: 'Air Terminals',
        fields: [
          { id: 'terminal_type', label: 'Terminal Type', type: 'select', options: ['UL Listed — Standard', 'UL Listed — Early Streamer', 'Dissipation Array'], required: true, nfpa: '§5.3' },
          { id: 'terminal_qty', label: 'Quantity Installed', type: 'number', required: true, nfpa: '§5.4' },
          { id: 'spacing_verified', label: 'Max Spacing ≤20ft Verified', type: 'boolean', required: true, nfpa: '§5.5' },
          { id: 'height_above_roof', label: 'Min Height Above Roof (in)', type: 'number', required: true, nfpa: '§5.6' },
          { id: 'terminals_bonded', label: 'All Terminals Bonded to Ring', type: 'boolean', required: true, nfpa: '§5.8' },
        ]
      },
      {
        id: 'conductors',
        title: 'Down Conductors',
        fields: [
          { id: 'conductor_gauge', label: 'Conductor Gauge (AWG)', type: 'select', options: ['#2 AWG Copper', '#1/0 AWG Copper', '#4 AWG Aluminum', 'Other'], required: true, nfpa: '§6.1' },
          { id: 'conductor_qty', label: 'Down Conductors Installed', type: 'number', required: true, nfpa: '§6.2' },
          { id: 'attachment_spacing', label: 'Attachment Spacing (ft)', type: 'number', required: true, nfpa: '§6.3' },
          { id: 'bends_ok', label: 'No Sharp Bends <90° Verified', type: 'boolean', required: true, nfpa: '§6.4' },
        ]
      },
      {
        id: 'grounding',
        title: 'Ground Electrodes',
        fields: [
          { id: 'electrode_type', label: 'Electrode Type', type: 'select', options: ['Driven Rod — Copper', 'Driven Rod — Galvanized', 'Plate Electrode', 'Ring Electrode', 'Counterpoise'], required: true, nfpa: '§8.5' },
          { id: 'rod_depth', label: 'Depth Driven (ft)', type: 'number', required: true, nfpa: '§8.6' },
          { id: 'resistance_reading', label: 'Ground Resistance Reading (Ω)', type: 'number', required: true, nfpa: '§8.8' },
          { id: 'resistance_pass', label: 'Resistance ≤10Ω Confirmed', type: 'boolean', required: true, nfpa: '§8.9' },
          { id: 'bonded_to_electrical', label: 'Bonded to Electrical Ground', type: 'boolean', required: true, nfpa: '§8.10' },
        ]
      }
    ]
  },
  'inspection': {
    id: 'inspection',
    label: 'Inspection & Testing',
    nfpaRef: 'NFPA 780 Ch. 9 / LPI-175',
    sections: [
      {
        id: 'visual',
        title: 'Visual Inspection',
        fields: [
          { id: 'terminals_intact', label: 'All Air Terminals Intact', type: 'boolean', required: true, nfpa: '§9.2' },
          { id: 'corrosion_check', label: 'Corrosion Assessment', type: 'select', options: ['None', 'Minor — Clean', 'Moderate — Replace Recommended', 'Severe — Replace Required'], required: true, nfpa: '§9.3' },
          { id: 'conductor_damage', label: 'Down Conductor Damage', type: 'select', options: ['None', 'Minor', 'Significant — Repair', 'Broken — Replace'], required: true, nfpa: '§9.4' },
          { id: 'bonds_intact', label: 'All Bonding Connections Tight', type: 'boolean', required: true, nfpa: '§9.5' },
        ]
      },
      {
        id: 'testing',
        title: 'Ground Resistance Testing',
        fields: [
          { id: 'test_method', label: 'Test Method', type: 'select', options: ['Fall-of-Potential (3-point)', 'Clamp-On (Stakeless)', 'Wenner 4-Pin'], required: true, nfpa: '§9.8' },
          { id: 'test_equipment', label: 'Test Equipment / Model', type: 'text', required: true },
          { id: 'reading_1', label: 'Reading 1 (Ω)', type: 'number', required: true, nfpa: '§9.9' },
          { id: 'reading_2', label: 'Reading 2 (Ω)', type: 'number' },
          { id: 'reading_3', label: 'Reading 3 (Ω)', type: 'number' },
          { id: 'avg_resistance', label: 'Average Resistance (Ω)', type: 'number', required: true, nfpa: '§9.10' },
          { id: 'pass_fail', label: 'Pass / Fail', type: 'select', options: ['PASS — ≤10Ω', 'FAIL — >10Ω'], required: true, nfpa: '§9.11' },
        ]
      }
    ]
  },

  // ─── Safety Forms (linked from Daily Field Log) ───────────────────────────
  'fall-protection': {
    id: 'fall-protection',
    label: 'Fall Protection Inspection',
    nfpaRef: 'OSHA 1926.502',
    sections: [
      {
        id: 'header',
        title: 'Inspection Details',
        fields: [
          { id: 'inspector_name', label: 'Inspector Name', type: 'text', required: true },
          { id: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
        ],
      },
      {
        id: 'stitching',
        title: 'Stitching — Check for cuts, tears or pulled stitching',
        fields: [
          { id: 'stitch_shoulder', label: 'Shoulder Straps', type: 'pass-fail', required: true },
          { id: 'stitch_chest',    label: 'Chest Straps',    type: 'pass-fail', required: true },
          { id: 'stitch_leg',      label: 'Leg Straps',      type: 'pass-fail', required: true },
          { id: 'stitch_back',     label: 'Back Straps',     type: 'pass-fail', required: true },
        ],
      },
      {
        id: 'hardware',
        title: 'Hardware',
        fields: [
          { id: 'hw_slide_drings', label: 'Slide D-rings',             type: 'pass-fail', required: true },
          { id: 'hw_back_drings',  label: 'Back D-rings',              type: 'pass-fail', required: true },
          { id: 'hw_front_dring',  label: 'Front D-ring (if applicable)', type: 'pass-fail' },
          { id: 'hw_buckles',      label: 'Buckles',                   type: 'pass-fail', required: true },
          { id: 'hw_grommets',     label: 'Grommets',                  type: 'pass-fail', required: true },
        ],
      },
      {
        id: 'labels',
        title: 'Labels & Tags — Verify legibility and attachment',
        fields: [
          { id: 'labels_tags', label: 'Tags & Labels', type: 'pass-fail', required: true },
        ],
      },
      {
        id: 'webbing',
        title: 'Webbing — Check for cuts, frayed edges, burns, chemical deterioration, holes, discoloration or soiling',
        fields: [
          { id: 'web_shoulder', label: 'Shoulder Straps', type: 'pass-fail', required: true },
          { id: 'web_chest',    label: 'Chest Straps',    type: 'pass-fail', required: true },
          { id: 'web_leg',      label: 'Leg Straps',      type: 'pass-fail', required: true },
          { id: 'web_back',     label: 'Back Straps',     type: 'pass-fail', required: true },
        ],
      },
      {
        id: 'ropes',
        title: 'Ropes — Check for cuts, frayed edges, burns, chemical deterioration, holes, discoloration, soiling',
        fields: [
          { id: 'rope_retractable', label: 'Retractable Lanyards', type: 'pass-fail', required: true },
        ],
      },
      {
        id: 'comments',
        title: 'Additional Comments',
        fields: [
          { id: 'additional_comments', label: 'Comments', type: 'textarea' },
        ],
      },
    ],
  },

  'manlift-checklist': {
    id: 'manlift-checklist',
    label: 'Manlift Pre-Shift Inspection',
    nfpaRef: 'OSHA 1926.453',
    sections: [
      {
        id: 'header',
        title: 'Inspection Details',
        fields: [
          { id: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
        ],
      },
      {
        id: 'general',
        title: 'Pre-Shift Inspection — General',
        fields: [
          { id: 'basic_inspection',    label: 'Basic Inspection (from ground)',                      type: 'ok-notok-na', required: true },
          { id: 'manufacturers_manual',label: "Manufacturer's Manual (in Place)",                    type: 'ok-notok-na', required: true },
          { id: 'platform_railing',    label: 'Platform/railing (bent, worn, damaged, locking door)', type: 'ok-notok-na', required: true },
          { id: 'tires',               label: 'Tires (worn, air, separating, missing bolts)',          type: 'ok-notok-na', required: true },
          { id: 'fire_extinguisher',   label: 'Fire Extinguisher (fully charged, sealed)',            type: 'ok-notok-na', required: true },
          { id: 'horn',                label: 'Horn (operational, loud enough)',                      type: 'ok-notok-na', required: true },
          { id: 'restraining_device',  label: 'Restraining device (good repair, secure)',             type: 'ok-notok-na', required: true },
          { id: 'hydraulic_fluid_g',   label: 'Hydraulic fluid (platform down)',                      type: 'ok-notok-na', required: true },
          { id: 'hoses_g',             label: 'Hoses (good repair)',                                  type: 'ok-notok-na', required: true },
        ],
      },
      {
        id: 'internal_combustion',
        title: 'Internal Combustion Equipment',
        fields: [
          { id: 'propane_tank',      label: 'Propane tank (date, leak, secure)',         type: 'ok-notok-na' },
          { id: 'gas_cap',           label: 'Gas cap (secure)',                          type: 'ok-notok-na' },
          { id: 'engine_oil',        label: 'Engine oil (check with engine off)',         type: 'ok-notok-na' },
          { id: 'radiator',          label: 'Radiator (do not check if hot)',             type: 'ok-notok-na' },
          { id: 'hydraulic_fluid_ic',label: 'Hydraulic fluid (platform down)',            type: 'ok-notok-na' },
          { id: 'hoses_belts',       label: 'Hoses and belts (condition, tight, loose)',  type: 'ok-notok-na' },
          { id: 'battery_ic',        label: 'Battery (tight connections, cell levels)',   type: 'ok-notok-na' },
        ],
      },
      {
        id: 'battery_powered',
        title: 'Battery Powered Equipment',
        fields: [
          { id: 'cables_connections', label: 'Cables and connections (tight)',  type: 'ok-notok-na' },
          { id: 'cell_levels',        label: 'Cell levels (above plates)',      type: 'ok-notok-na' },
          { id: 'plugging_control',   label: 'Plugging control (smooth operation)', type: 'ok-notok-na' },
        ],
      },
      {
        id: 'basic_manlift',
        title: 'Basic Inspection on Manlift',
        fields: [
          { id: 'brake_pin',           label: 'Brake pin & linkage',                  type: 'ok-notok-na', required: true },
          { id: 'brakes',              label: 'Brakes (firm, stops smoothly)',         type: 'ok-notok-na', required: true },
          { id: 'steering',            label: 'Steering (smooth operations)',          type: 'ok-notok-na', required: true },
          { id: 'leaks',               label: 'Leaks (under manlift)',                 type: 'ok-notok-na', required: true },
          { id: 'hydraulic_controls',  label: 'Hydraulic controls (smooth operation)', type: 'ok-notok-na', required: true },
          { id: 'hydraulic_functions', label: 'Hydraulic functions (up & down)',        type: 'ok-notok-na', required: true },
          { id: 'directional_controls',label: 'Directional controls (smooth operations)', type: 'ok-notok-na', required: true },
        ],
      },
    ],
  },

  'jsa': {
    id: 'jsa',
    label: 'Job Safety Analysis',
    nfpaRef: 'LMC-Form-000-008',
    sections: [
      {
        id: 'job_info',
        title: 'Job Information',
        fields: [
          { id: 'jsa_date',          label: 'Date',             type: 'date', required: true },
          { id: 'company_name',      label: 'Company Name',     type: 'text', required: true },
          { id: 'site_name',         label: 'Site Name',        type: 'text', required: true },
          { id: 'general_activity',  label: 'General Activity', type: 'text', required: true },
        ],
      },
      {
        id: 'permits',
        title: 'Permit Required Activity',
        fields: [
          { id: 'permit_required', label: 'Check all that apply', type: 'checkbox-group', options: [
            'Confined Space',
            'Working over Water or at Height',
            'Ground Disturbance (One Call)',
            'Working on Pressurized Equipment',
            'Working in Contaminated Atmosphere',
            'Working in Unguarded / Unprotected Areas',
            'Lifts',
            'Hot Work',
            'Working on or near Energized Electrical Equipment',
            'Wild Life',
            'Other',
          ]},
        ],
      },
      {
        id: 'ppe',
        title: 'Personal Protective Equipment — Site Supervisor will verify ALL LMC Personnel',
        fields: [
          { id: 'ppe_required', label: 'Required PPE', type: 'checkbox-group', required: true, options: [
            'Hard Hat',
            'Safety Steel Toe Boots',
            'Safety Glasses',
            'Chemical Goggles',
            'High Visibility Safety Vest',
            'Appropriate Gloves',
            'Fire Protective Clothing (FR)',
            'Safety Harness with Lanyard',
            'Hearing Protection',
            'Respirator (Supplied Air)',
          ]},
        ],
      },
      {
        id: 'safety_equipment',
        title: 'Safety Equipment and Tools',
        fields: [
          { id: 'safety_tools', label: 'Required equipment on site', type: 'checkbox-group', options: [
            'Oxygen Monitor',
            'Combustible Gas Detector',
            'Toxic Gas Detector',
            'Fire Extinguisher',
            'Insulated Tools',
            'Hand-Held Radio',
            'Pneumatic Power Tools',
            'Other',
          ]},
        ],
      },
      {
        id: 'activities',
        title: 'Activities, Hazards & Risk Control Measures',
        fields: [
          { id: 'activity_1', label: 'Row 1', type: 'activity-row' },
          { id: 'activity_2', label: 'Row 2', type: 'activity-row' },
          { id: 'activity_3', label: 'Row 3', type: 'activity-row' },
          { id: 'activity_4', label: 'Row 4', type: 'activity-row' },
          { id: 'activity_5', label: 'Row 5', type: 'activity-row' },
        ],
      },
      {
        id: 'personnel',
        title: 'LightningMaster Personnel Performing the Work',
        fields: [
          { id: 'person_1', label: 'Person 1', type: 'personnel-sig', required: true },
          { id: 'person_2', label: 'Person 2', type: 'personnel-sig' },
          { id: 'person_3', label: 'Person 3', type: 'personnel-sig' },
          { id: 'person_4', label: 'Person 4', type: 'personnel-sig' },
          { id: 'person_5', label: 'Person 5', type: 'personnel-sig' },
          { id: 'person_6', label: 'Person 6', type: 'personnel-sig' },
        ],
      },
    ],
  },
};

export const STATS = {
  jobsThisMonth: 19,
  jobsCompleted: 6,
  jobsPending: 6,
  jobsFailed: 3,
  avgResistance: 4.7,
  techsInField: 3,
  certsPending: 2,
  activeProjects: 8,
  reportsThisMonth: 6,
  lm: {
    active: 2, scheduled: 3, completed: 2, failed: 2,
    techsInField: 1, label: 'Lightning Master',
    sectors: 'Oilfield · Chemical · Industrial',
  },
  bolt: {
    active: 3, scheduled: 3, completed: 4, failed: 1,
    techsInField: 2, label: 'Bolt Florida',
    sectors: 'Commercial · Municipal · Hotels',
  },
  'bolt-dallas': {
    active: 1, scheduled: 2, completed: 1, failed: 0,
    techsInField: 1, label: 'Bolt Dallas',
    sectors: 'Commercial · Industrial · Energy',
  },
};
