// Mock projects for when Supabase is empty — maps to real NFPA field ops
export const MOCK_PROJECTS = [
  { id: 'p-001', name: 'Ritz-Carlton LPS Installation', customer_account: 'Ritz-Carlton Amelia Island', address: '4750 Amelia Island Pkwy', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0312', stage: 'In Progress', primary_contact: 'Michael Torres', primary_contact_phone: '904-555-0301', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-10T08:00:00Z' },
  { id: 'p-002', name: 'Nassau County Courthouse LPS', customer_account: 'Nassau County Government', address: '76 S 4th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0318', stage: 'In Progress', primary_contact: 'Judge Patricia Lane', primary_contact_phone: '904-555-0302', lmc_representative: 'Tamika Russell', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-12T08:00:00Z' },
  { id: 'p-003', name: 'Omni Resort Annual Inspection', customer_account: 'Omni Amelia Island Resort', address: '39 Beach Lagoon Rd', city: 'Amelia Island', state: 'FL', job_number: 'JOB-2026-0321', stage: 'In Progress', primary_contact: 'Sarah Chen', primary_contact_phone: '904-555-0303', lmc_representative: 'Priya Nair', scheduled_date: '2026-03-24', archived: false, created_at: '2026-03-14T08:00:00Z' },
  { id: 'p-004', name: 'Port of Fernandina Crane Inspection', customer_account: 'Port of Fernandina', address: '1 Front St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0298', stage: 'Scheduled', primary_contact: 'Dave Rawlings', primary_contact_phone: '904-555-0304', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-25', archived: false, created_at: '2026-03-08T08:00:00Z' },
  { id: 'p-005', name: 'Baptist Medical Center Survey', customer_account: 'Baptist Medical Center Nassau', address: '1250 S 18th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0287', stage: 'Scheduled', primary_contact: 'Dr. Angela Reeves', primary_contact_phone: '904-555-0305', lmc_representative: 'Diane Okafor', scheduled_date: '2026-03-26', archived: false, created_at: '2026-03-05T08:00:00Z' },
  { id: 'p-006', name: 'Rayonier Advanced Materials Cert', customer_account: 'Rayonier Advanced Materials', address: '1301 Rayonier Way', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0271', stage: 'Complete', primary_contact: 'Tom Bradley', primary_contact_phone: '904-555-0306', lmc_representative: 'Priya Nair', scheduled_date: '2026-03-20', archived: false, created_at: '2026-02-28T08:00:00Z' },
  { id: 'p-007', name: 'Amelia Island Lighthouse Install', customer_account: 'FL State Parks', address: "215 O'Hagan Ln", city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0255', stage: 'Complete', primary_contact: 'Ranger Williams', primary_contact_phone: '904-555-0307', lmc_representative: 'Diane Okafor', scheduled_date: '2026-03-14', archived: false, created_at: '2026-02-20T08:00:00Z' },
  { id: 'p-008', name: 'Amelia Island Plantation — FAILED', customer_account: 'Amelia Island Plantation', address: '39 Beach Lagoon Rd', city: 'Amelia Island', state: 'FL', job_number: 'JOB-2026-0263', stage: 'Pending Review', primary_contact: 'Karen Mitchell', primary_contact_phone: '904-555-0308', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-18', archived: false, created_at: '2026-03-01T08:00:00Z' },
  { id: 'p-009', name: 'WestRock Paper Mill Annual Test', customer_account: 'WestRock Company', address: '1500 N 8th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0334', stage: 'Awarded', primary_contact: 'Plant Safety Office', primary_contact_phone: '904-555-0309', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-29', archived: false, created_at: '2026-03-15T08:00:00Z' },
  { id: 'p-010', name: 'First Baptist Church Install', customer_account: 'First Baptist Church', address: '1600 S 8th St', city: 'Fernandina Beach', state: 'FL', job_number: 'JOB-2026-0220', stage: 'Complete', primary_contact: 'Pastor James', primary_contact_phone: '904-555-0310', lmc_representative: 'Marcus Webb', scheduled_date: '2026-03-05', archived: false, created_at: '2026-02-15T08:00:00Z' },
];

// Mock daily field reports
export const MOCK_REPORTS = [
  { id: 'r-001', project_id: 'p-001', report_date: '2026-03-24', submitted_by: 'Ray Thibodaux', hours_worked: 8, status: 'Submitted', projects: { name: 'Ritz-Carlton LPS Installation' } },
  { id: 'r-002', project_id: 'p-001', report_date: '2026-03-23', submitted_by: 'Ray Thibodaux', hours_worked: 7.5, status: 'Reviewed', projects: { name: 'Ritz-Carlton LPS Installation' } },
  { id: 'r-003', project_id: 'p-002', report_date: '2026-03-24', submitted_by: 'Tamika Russell', hours_worked: 6, status: 'Draft', projects: { name: 'Nassau County Courthouse LPS' } },
  { id: 'r-004', project_id: 'p-003', report_date: '2026-03-24', submitted_by: 'Priya Nair', hours_worked: 5, status: 'Submitted', projects: { name: 'Omni Resort Annual Inspection' } },
  { id: 'r-005', project_id: 'p-006', report_date: '2026-03-20', submitted_by: 'Priya Nair', hours_worked: 9, status: 'Reviewed', projects: { name: 'Rayonier Advanced Materials Cert' } },
  { id: 'r-006', project_id: 'p-007', report_date: '2026-03-14', submitted_by: 'Diane Okafor', hours_worked: 8, status: 'Reviewed', projects: { name: 'Amelia Island Lighthouse Install' } },
];

// Mock form submissions
export const MOCK_SUBMISSIONS = [
  { id: 's-001', project_id: 'p-001', submitted_by: 'Ray Thibodaux', status: 'Submitted', created_at: '2026-03-22T10:00:00Z', projects: { name: 'Ritz-Carlton LPS Installation' } },
  { id: 's-002', project_id: 'p-006', submitted_by: 'Priya Nair', status: 'Complete', created_at: '2026-03-20T14:00:00Z', projects: { name: 'Rayonier Advanced Materials Cert' } },
  { id: 's-003', project_id: 'p-007', submitted_by: 'Diane Okafor', status: 'Complete', created_at: '2026-03-14T16:00:00Z', projects: { name: 'Amelia Island Lighthouse Install' } },
  { id: 's-004', project_id: 'p-008', submitted_by: 'Marcus Webb', status: 'Under Review', created_at: '2026-03-18T11:00:00Z', projects: { name: 'Amelia Island Plantation — FAILED' } },
  { id: 's-005', project_id: 'p-002', submitted_by: 'Tamika Russell', status: 'Pending Customer', created_at: '2026-03-23T09:00:00Z', projects: { name: 'Nassau County Courthouse LPS' } },
];

export const TECHNICIANS = [
  { id: 'T001', name: 'Marcus Webb', license: 'LPI-3847', status: 'active', phone: '904-555-0142' },
  { id: 'T002', name: 'Diane Okafor', license: 'LPI-2291', status: 'active', phone: '904-555-0187' },
  { id: 'T003', name: 'Ray Thibodaux', license: 'LPI-4056', status: 'field', phone: '904-555-0203' },
  { id: 'T004', name: 'Priya Nair', license: 'LPI-3312', status: 'field', phone: '904-555-0219' },
  { id: 'T005', name: 'Jake Herrera', license: 'LPI-4410', status: 'active', phone: '904-555-0238' },
  { id: 'T006', name: 'Tamika Russell', license: 'LPI-3780', status: 'field', phone: '904-555-0251' },
];

export const JOBS = [
  // ── ACTIVE ──
  {
    id: 'JOB-2026-0312',
    type: 'installation',
    status: 'active',
    client: 'Ritz-Carlton Amelia Island',
    address: '4750 Amelia Island Pkwy, Fernandina Beach, FL 32034',
    structure: 'Hotel / Resort — 12-story, 280ft',
    assignedTo: 'T003',
    scheduledDate: '2026-03-24',
    nfpaClass: 'I',
    priority: 'high',
    progress: 65,
    forms: ['site-survey', 'installation'],
    notes: 'Rooftop HVAC bonding required. Elevator shaft grounding per UL 96A §4.2.',
  },
  {
    id: 'JOB-2026-0318',
    type: 'installation',
    status: 'active',
    client: 'Nassau County Courthouse',
    address: '76 S 4th St, Fernandina Beach, FL 32034',
    structure: 'Government — 3-story, 52ft, historic masonry',
    assignedTo: 'T006',
    scheduledDate: '2026-03-24',
    nfpaClass: 'I',
    priority: 'high',
    progress: 40,
    forms: ['site-survey'],
    notes: 'Historic preservation constraints. No drilling into original facade. Concealed conductor routing required.',
  },
  {
    id: 'JOB-2026-0321',
    type: 'inspection',
    status: 'active',
    client: 'Omni Amelia Island Resort',
    address: '39 Beach Lagoon Rd, Amelia Island, FL 32034',
    structure: 'Resort — 8-story tower + 4 villa clusters, 220ft',
    assignedTo: 'T004',
    scheduledDate: '2026-03-24',
    nfpaClass: 'I',
    priority: 'medium',
    progress: 30,
    forms: ['site-survey'],
    notes: 'Annual inspection per contract. Pool area bonding check added this year. Guest access coordination with GM.',
  },

  // ── SCHEDULED ──
  {
    id: 'JOB-2026-0298',
    type: 'inspection',
    status: 'scheduled',
    client: 'Port of Fernandina — Crane Complex',
    address: '1 Front St, Fernandina Beach, FL 32034',
    structure: 'Industrial — Port crane cluster, tallest 180ft',
    assignedTo: 'T001',
    scheduledDate: '2026-03-25',
    nfpaClass: 'II',
    priority: 'high',
    progress: 0,
    forms: [],
    notes: 'Annual inspection. Last certified 2025-03-10. Saltwater corrosion expected on ground rods.',
  },
  {
    id: 'JOB-2026-0287',
    type: 'site-survey',
    status: 'scheduled',
    client: 'Baptist Medical Center Nassau',
    address: '1250 S 18th St, Fernandina Beach, FL 32034',
    structure: 'Healthcare — 4-story, 68ft, critical facility',
    assignedTo: 'T002',
    scheduledDate: '2026-03-26',
    nfpaClass: 'I',
    priority: 'medium',
    progress: 0,
    forms: [],
    notes: 'Pre-install survey for generator pad bonding and rooftop expansion.',
  },
  {
    id: 'JOB-2026-0325',
    type: 'site-survey',
    status: 'scheduled',
    client: 'Fernandina Beach Golf Club',
    address: '2800 Bill Melton Rd, Fernandina Beach, FL 32034',
    structure: 'Commercial — Clubhouse, maintenance barn, cart storage, tallest 35ft',
    assignedTo: 'T005',
    scheduledDate: '2026-03-27',
    nfpaClass: 'III',
    priority: 'low',
    progress: 0,
    forms: [],
    notes: 'New client inquiry. Lightning strike damaged cart barn roof last summer. Insurance requiring LPS evaluation.',
  },
  {
    id: 'JOB-2026-0330',
    type: 'installation',
    status: 'scheduled',
    client: 'Kraft Athletic Club at UNF',
    address: '1 UNF Drive, Jacksonville, FL 32224',
    structure: 'Educational — Athletic facility, steel frame, 65ft',
    assignedTo: 'T003',
    scheduledDate: '2026-03-28',
    nfpaClass: 'II',
    priority: 'medium',
    progress: 0,
    forms: ['site-survey'],
    notes: 'Survey complete. Installing 24 air terminals, 8 down conductors. Coordinate with campus facilities for outage window.',
  },
  {
    id: 'JOB-2026-0334',
    type: 'annual-test',
    status: 'scheduled',
    client: 'WestRock Paper Mill',
    address: '1500 N 8th St, Fernandina Beach, FL 32034',
    structure: 'Industrial — Paper mill, multiple stacks, tallest 140ft',
    assignedTo: 'T001',
    scheduledDate: '2026-03-29',
    nfpaClass: 'II',
    priority: 'high',
    progress: 0,
    forms: [],
    notes: 'Hazardous environment — paper dust ignition risk. Full PPE required. Escort by plant safety officer.',
  },

  // ── COMPLETED ──
  {
    id: 'JOB-2026-0271',
    type: 'certification',
    status: 'completed',
    client: 'Rayonier Advanced Materials',
    address: '1301 Rayonier Way, Fernandina Beach, FL 32034',
    structure: 'Industrial — Processing plant, multiple structures',
    assignedTo: 'T004',
    scheduledDate: '2026-03-20',
    nfpaClass: 'II',
    priority: 'medium',
    progress: 100,
    forms: ['site-survey', 'installation', 'inspection'],
    notes: 'Certified. All 7 structures passed. Certificate #BOLT-2026-0271 issued.',
  },
  {
    id: 'JOB-2026-0255',
    type: 'installation',
    status: 'completed',
    client: 'Amelia Island Lighthouse',
    address: '215 O\'Hagan Ln, Fernandina Beach, FL 32034',
    structure: 'Historic — Lighthouse tower, 64ft, brick/masonry',
    assignedTo: 'T002',
    scheduledDate: '2026-03-14',
    nfpaClass: 'I',
    priority: 'high',
    progress: 100,
    forms: ['site-survey', 'installation', 'inspection'],
    notes: 'Historic site — State Parks approval obtained. Concealed conductors along interior wall. Copper ground ring installed at base. All readings <5Ω.',
  },
  {
    id: 'JOB-2026-0248',
    type: 'annual-test',
    status: 'completed',
    client: 'Fernandina Beach Municipal Airport',
    address: '1600 Airport Rd, Fernandina Beach, FL 32034',
    structure: 'Aviation — Control tower 48ft, hangar complex',
    assignedTo: 'T005',
    scheduledDate: '2026-03-12',
    nfpaClass: 'I',
    priority: 'high',
    progress: 100,
    forms: ['site-survey', 'inspection'],
    notes: 'Annual test passed. All 4 ground electrode stations ≤6Ω. Tower array intact. FAA compliance letter sent.',
  },
  {
    id: 'JOB-2026-0240',
    type: 'inspection',
    status: 'completed',
    client: 'Publix Distribution Center',
    address: '4500 Buccaneer Trail, Yulee, FL 32097',
    structure: 'Industrial — Warehouse complex, 42ft, steel frame',
    assignedTo: 'T006',
    scheduledDate: '2026-03-10',
    nfpaClass: 'III',
    priority: 'low',
    progress: 100,
    forms: ['site-survey', 'inspection'],
    notes: 'Routine biannual inspection. Minor corrosion on NE corner down conductor bracket — noted for next service. Otherwise all pass.',
  },
  {
    id: 'JOB-2026-0232',
    type: 'certification',
    status: 'completed',
    client: 'Osprey Village Retirement Community',
    address: '600 Osprey Village Dr, Amelia Island, FL 32034',
    structure: 'Residential — 6 buildings, tallest 3-story, 38ft',
    assignedTo: 'T003',
    scheduledDate: '2026-03-08',
    nfpaClass: 'III',
    priority: 'medium',
    progress: 100,
    forms: ['site-survey', 'installation', 'inspection'],
    notes: 'Full LPS installed across all 6 buildings. Certificate #BOLT-2026-0232 issued. HOA board signed off.',
  },
  {
    id: 'JOB-2026-0220',
    type: 'installation',
    status: 'completed',
    client: 'First Baptist Church — Fernandina',
    address: '1600 S 8th St, Fernandina Beach, FL 32034',
    structure: 'Religious — Sanctuary + steeple, 85ft',
    assignedTo: 'T001',
    scheduledDate: '2026-03-05',
    nfpaClass: 'I',
    priority: 'medium',
    progress: 100,
    forms: ['site-survey', 'installation', 'inspection'],
    notes: 'Steeple required custom fabricated air terminal mount. Copper tape conductor concealed along roofline. Ground resistance 3.2Ω at all stations.',
  },

  // ── FAILED ──
  {
    id: 'JOB-2026-0263',
    type: 'annual-test',
    status: 'failed',
    client: 'Amelia Island Plantation',
    address: '39 Beach Lagoon Rd, Amelia Island, FL 32034',
    structure: 'Resort — Multiple buildings, tallest 45ft',
    assignedTo: 'T001',
    scheduledDate: '2026-03-18',
    nfpaClass: 'I',
    priority: 'high',
    progress: 90,
    forms: ['site-survey', 'inspection'],
    notes: 'FAILED: Ground resistance 28Ω at Building C rod cluster. Exceeds 10Ω limit. Remediation order issued.',
  },
  {
    id: 'JOB-2026-0244',
    type: 'inspection',
    status: 'failed',
    client: 'Sadler Point Marina',
    address: '4669 Roosevelt Blvd, Jacksonville, FL 32210',
    structure: 'Marine — Fuel dock + ship store, 28ft, wood frame',
    assignedTo: 'T004',
    scheduledDate: '2026-03-11',
    nfpaClass: 'I',
    priority: 'high',
    progress: 85,
    forms: ['site-survey', 'inspection'],
    notes: 'FAILED: 3 of 6 air terminals missing — storm damage from Hurricane season. Down conductor severed at west wall. Fuel dock bonding compromised. Urgent remediation required.',
  },
  {
    id: 'JOB-2026-0236',
    type: 'annual-test',
    status: 'failed',
    client: 'St. Augustine Distillery',
    address: '112 Riberia St, St. Augustine, FL 32084',
    structure: 'Historic/Industrial — Distillery, 46ft, brick',
    assignedTo: 'T006',
    scheduledDate: '2026-03-09',
    nfpaClass: 'I',
    priority: 'high',
    progress: 80,
    forms: ['inspection'],
    notes: 'FAILED: Ground resistance 15Ω — soil dried out since last reading. Flammable vapor environment makes this critical. Recommended: add supplemental ground rods + chemical treatment.',
  },
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
  }
};

// Counts derived from JOBS above:
// active: 3, scheduled: 5, completed: 6, failed: 3 = 17 total
export const STATS = {
  jobsThisMonth: 17,
  jobsCompleted: 6,
  jobsPending: 5,
  jobsFailed: 3,
  avgResistance: 4.7,
  techsInField: 3,
  certsPending: 2,
};
