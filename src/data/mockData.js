export const TECHNICIANS = [
  { id: 'T001', name: 'Marcus Webb', license: 'LPI-3847', status: 'active', phone: '904-555-0142' },
  { id: 'T002', name: 'Diane Okafor', license: 'LPI-2291', status: 'active', phone: '904-555-0187' },
  { id: 'T003', name: 'Ray Thibodaux', license: 'LPI-4056', status: 'field', phone: '904-555-0203' },
  { id: 'T004', name: 'Priya Nair', license: 'LPI-3312', status: 'field', phone: '904-555-0219' },
];

export const JOBS = [
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
    forms: ['site-survey', 'installation', 'inspection', 'certification'],
    notes: 'Certified. All 7 structures passed. Certificate #BOLT-2026-0271 issued.',
  },
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

export const STATS = {
  jobsThisMonth: 18,
  jobsCompleted: 12,
  jobsPending: 4,
  jobsFailed: 2,
  avgResistance: 4.7,
  techsInField: 2,
  certsPending: 3,
};
