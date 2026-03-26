import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CaretRight, CaretDown, CheckCircle, Eye,
  Trash, X, ArrowLeft, Plus, SpinnerGap,
  Lightning, MagnifyingGlass, Ruler, ClipboardText,
  Buildings, Factory, Drop, Camera, MapPin,
} from '@phosphor-icons/react'
import { jsPDF } from 'jspdf'
import { db } from '../lib/supabase.js'
import { TECHNICIANS } from '../data/mockData.js'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

export const COMPLETION_TYPES = {
  'installation': {
    label:    'Installation Completion',
    short:    'Installation',
    icon:     Lightning,
    color:    'var(--accent)',
    colorDim: 'var(--accent-dim)',
    desc:     'Final sign-off on completed LPS installation',
    ref:      'NFPA 780 / UL 96A',
    fields: [
      { id: 'lps_class',        label: 'LPS Class',                 type: 'select',  options: ['Class I', 'Class II'], required: true },
      { id: 'air_terminals',    label: 'Air Terminals Installed',    type: 'number',  required: true },
      { id: 'down_conductors',  label: 'Down Conductors Installed',  type: 'number',  required: true },
      { id: 'ground_rods',      label: 'Ground Rods Installed',      type: 'number',  required: true },
      { id: 'bonding_complete', label: 'Bonding Complete',           type: 'boolean', required: true },
      { id: 'ul_label',         label: 'UL Master Label Applied',    type: 'boolean' },
      { id: 'resistance_ohms',  label: 'Ground Resistance (ohms)',   type: 'number' },
    ],
  },
  'inspection': {
    label:    'Inspection Completion',
    short:    'Inspection',
    icon:     MagnifyingGlass,
    color:    'var(--blue)',
    colorDim: 'var(--blue-soft)',
    desc:     'Post-inspection findings and compliance status',
    ref:      'LPI-175 / LPI-177',
    fields: [
      { id: 'inspection_type', label: 'Inspection Type',            type: 'select', options: ['Annual', 'Bi-Annual', 'Post-Strike', 'Pre-Certification'], required: true },
      { id: 'system_class',   label: 'System Class',               type: 'select', options: ['Class I', 'Class II'] },
      { id: 'overall_result', label: 'Overall Result',              type: 'select', options: ['Pass', 'Pass with Conditions', 'Fail'], required: true },
      { id: 'deficiencies',   label: 'Deficiencies Found',         type: 'textarea' },
      { id: 'corrective_req', label: 'Corrective Action Required',  type: 'boolean' },
      { id: 'next_inspection',label: 'Next Inspection Due',         type: 'date' },
    ],
  },
  'site-survey': {
    label:    'Site Survey Completion',
    short:    'Site Survey',
    icon:     Ruler,
    color:    'var(--green)',
    colorDim: 'var(--green-s)',
    desc:     'Site survey findings and LPS recommendations',
    ref:      'NFPA 780 Annex L',
    fields: [
      { id: 'structure_type',  label: 'Structure Type',             type: 'select', options: ['Commercial', 'Industrial', 'Healthcare', 'Educational', 'Residential', 'Utility', 'Other'], required: true },
      { id: 'height_ft',       label: 'Structure Height (ft)',      type: 'number', required: true },
      { id: 'lps_recommended', label: 'LPS Recommended',            type: 'boolean', required: true },
      { id: 'risk_ratio',      label: 'Nd/Nc Risk Ratio',           type: 'number' },
      { id: 'estimated_cost',  label: 'Estimated Install Cost ($)',  type: 'number' },
      { id: 'proposal_ready',  label: 'Proposal Ready to Send',     type: 'boolean' },
    ],
  },
  'annual-test': {
    label:    'Annual Test Completion',
    short:    'Annual Test',
    icon:     ClipboardText,
    color:    '#7C3AED',
    colorDim: 'rgba(124,58,237,0.12)',
    desc:     'Annual continuity and resistance test results',
    ref:      'NFPA 780 §4.18',
    fields: [
      { id: 'test_method',     label: 'Test Method',                type: 'select', options: ['Fall-of-Potential', 'Clamp-On', 'Stakeless'], required: true },
      { id: 'resistance_ohms', label: 'Ground Resistance (ohms)',   type: 'number', required: true },
      { id: 'resistance_pass', label: 'Resistance ≤ 10 ohms',       type: 'boolean', required: true },
      { id: 'continuity_pass', label: 'Continuity Test Passed',     type: 'boolean', required: true },
      { id: 'corrosion_found', label: 'Corrosion / Damage Found',   type: 'boolean' },
      { id: 'repairs_needed',  label: 'Repairs Recommended',        type: 'boolean' },
      { id: 'cert_issued',     label: 'Test Certificate Issued',    type: 'boolean' },
    ],
  },
}

// ─── Status badge map ──────────────────────────────────────────────────────────
const STATUS_BADGE = {
  'Draft':            'badge-hold',
  'Submitted':        'badge-awarded',
  'Under Review':     'badge-scheduled',
  'Pending Customer': 'badge-customer',
  'Customer Signed':  'badge-signed',
  'Complete':         'badge-complete',
  'Rejected':         'badge-review',
}


// ─── Extended form types for new forms ────────────────────────────────────────
Object.assign(COMPLETION_TYPES, {
  'midstream-install': {
    label: 'Midstream Install Completion', short: 'Midstream Install',
    icon: Factory, color: '#0EA5E9', colorDim: '#E0F2FE',
    desc: 'Used after new installation of midstream facilities', ref: 'NFPA 780 / API RP 545',
    fields: [
      { id: 'facility_name',    label: 'Facility Name',           type: 'text',    required: true },
      { id: 'facility_type',    label: 'Facility Type',           type: 'select',  options: ['Compressor Station', 'Metering Station', 'Gas Processing', 'Treatment Plant', 'Other'], required: true },
      { id: 'air_terminals',    label: 'Air Terminals Installed', type: 'number',  required: true },
      { id: 'down_conductors',  label: 'Down Conductors',         type: 'number',  required: true },
      { id: 'ground_rods',      label: 'Ground Rods Installed',   type: 'number',  required: true },
      { id: 'bonding_complete', label: 'Bonding Complete',        type: 'boolean', required: true },
      { id: 'resistance_ohms',  label: 'Ground Resistance (ohms)',type: 'number' },
      { id: 'ul_label',         label: 'UL Master Label Applied', type: 'boolean' },
    ],
  },
  'swd-production': {
    label: 'SWD Production Install Completion', short: 'SWD Production',
    icon: Drop, color: '#6366F1', colorDim: '#EEF2FF',
    desc: 'SWD and Production sites completion form after new installation', ref: 'NFPA 780',
    fields: [], // flat fields kept for PDF compat; sections drives the form UI
    sections: [
      { title: 'Job Information', fields: [
        { id: 'customer_account',       label: 'Customer Account',           type: 'select', required: true,
          options: ['Select customer…'] },
        { id: 'site_name',              label: 'Site Name',                  type: 'text',  required: true },
        { id: 'job_number',             label: 'Job Number',                 type: 'text',  required: true },
        { id: 'location',               label: 'Location',                   type: 'gps',   required: true },
        { id: 'location_notes',         label: 'Location Notes',             type: 'textarea' },
        { id: 'primary_contact',        label: 'Primary Contact',            type: 'text',  required: true },
        { id: 'primary_contact_email',  label: 'Primary Contact Email',      type: 'email', hint: 'If more than one email, separate each by a space.' },
        { id: 'primary_contact_phone',  label: 'Primary Contact Phone',      type: 'tel' },
        { id: 'lm_representative',      label: 'Lightning Master Representative', type: 'text', required: true },
        { id: 'lm_installers',          label: 'Lightning Master Installers', type: 'text', required: true },
        { id: 'customer_signature',     label: 'Customer Signature',         type: 'signature',
          hint: 'Confirms delivery receipt of materials and installation is completed to Lightning Master Corporation best practices standards.' },
        { id: 'customer_name_sig',      label: 'Customer Name for Signature', type: 'text' },
        { id: 'site_sign',              label: 'Site Sign',                  type: 'photo', required: true },
      ]},
      { title: 'Site Details', fields: [
        { id: 'site_type',              label: 'Salt Water Disposal or Production Site?', type: 'radio', required: true,
          options: ['Salt Water Disposal', 'Production and Storage', 'Tank Storage', 'SWD & Production', 'Other'] },
        { id: 'scope_of_work',          label: 'Scope of Work — Select all that apply', type: 'checklist',
          options: [
            'Lightning Master Technicians Installation',
            'Supervision of 3rd party installation',
            'Full Lightning Master lightning protection system installed to best practices',
            'Tank Bottom Grounding (Installed new Grounding system)',
            'Tank Bottom Grounding (Tied into existing Grounding system)',
            'Tank Bottom Bonding',
            'Tank Top Air Terminals installed and bonded only',
            'Install protection on a customer selected portion of the site and not the entire site',
            'Other',
          ]},
        { id: 'fiberglass_tanks',       label: 'If any, FIBERGLASS Tanks Quantity and Size', type: 'text', hint: "example: 4-15', 2-25'" },
        { id: 'steel_tanks',            label: 'If any, STEEL Tanks Quantity and Size',      type: 'text', hint: "example: 4-15', 2-25'" },
        { id: 'tank_type_qty',          label: 'Tank Type and Quantity',                     type: 'text' },
        { id: 'ground_electrode',       label: 'Ground Electrode System in place',           type: 'select', required: true,
          options: ['Yes — LM Installed', 'Yes — Existing System Tied In', 'Inherently Self Grounded (Steel)', 'No — Not Required', 'Other'] },
        { id: 'berm_containment',       label: 'Type of Berm/Containment used',             type: 'select',
          options: ['Metal', 'Concrete', 'Earthen/Dirt', 'No Containment', 'Other'] },
        { id: 'photo_battery_overall',  label: 'Capture 3 Photos of the Battery overall from corners if possible (excluding Production area)', type: 'photo', required: true },
        { id: 'photo_catwalk_views',    label: 'Catwalk Views of Tank Tops Overall',        type: 'photo' },
        { id: 'photo_fiberglass_top',   label: 'Detail Photo: FIBERGLASS tank top and thief hatch connections', type: 'photo' },
        { id: 'photo_steel_top',        label: 'Detail Photo: STEEL Tank top and thief hatch connections',      type: 'photo' },
        { id: 'tank_top_ventline',      label: 'Select all areas confirmed installed on TANK TOPS and VENTLINE PIPING according to LMC best practices and standards', type: 'checklist', required: true,
          options: [
            'In-Tank Static Drain (ITSD) installed in FIBERGLASS tanks',
            'In-Tank Static Drain (ITSD) installed in Lined STEEL tanks',
            'Thief hatch bonded to Lightning Protection System',
            'Air Terminal on STEEL horizontal ventline piping',
            'Air Terminals on Horizontal Non-Metallic Vent line piping installed with conductor bonded to backbone at BOTH ENDS',
            'Air Terminals placed around outer edge of tank and bonded with conductor to lightning protection system',
            'FIBERGLASS TANKS-Bonded Isolated metal bodies within 6\' of main conductor (steel vent line, lifting eyes, tank sticks, overflow flanges, bull plugs,)',
            'Windsocks placed in visible areas with Streamer Retarding Air Terminals and bonded into main backbone',
            'NON-METALLIC PIPING- Bonded any VENTING APPURTENANCES to conductor',
            'Other',
          ]},
      ]},
      { title: 'Tank Bottom Bonding and Grounding', fields: [
        { id: 'photo_tank_bottom',      label: 'Photo Overall of Tank BOTTOM bonding (2 photos max if applicable)', type: 'photo' },
        { id: 'photo_grounding_ends',   label: 'Photo Verify Grounding Ends (example: where catwalk ends at ground electrode or where downleads end; where conductor goes over containment to ground electrode) 2 photo max', type: 'photo' },
        { id: 'tank_bottom_verified',   label: 'Verified areas installed for BOTTOM TANK grounding and bonding to Lightning Master best practices and standards for installation', type: 'checklist',
          options: [
            'Bonded C-Veil into lightning protection system',
            'FIBERGLASS TANKS-Bonded metal bodies within 6\' of tank bottom are bonded into Lightning Protection System for equipotential',
            'Lightning Master Installed Ground Electrodes',
            'Tied Lightning Protection system in EXISTING grounding system',
            'Inherently Self Grounded STEEL TANKS used for bonding and grounding',
            'Bonded Metal containment with minimum (2) places every 100 feet or less.',
            'Bonded Steel walkovers to metal containment wall.',
            'Installed Conductor Downleads just before catwalk goes into upward direction at a FIBERGLASS tank',
            'Other',
          ]},
      ]},
      { title: 'Production Area', fields: [
        { id: 'photo_production_area',  label: 'Capture Photo of PRODUCTION area from at least 2 angles (4 photos max)', type: 'photo' },
        { id: 'photo_vessel_types',     label: '(1) Photo of each UNIQUE TYPE of vessel installed with lightning protection (ex: 1 Heater Treater, 1 Horiz Separator, 1 VRT, 1 Vertical Separator)', type: 'photo' },
        { id: 'vessel_list',            label: 'List vessel type, orientation, quantity', type: 'textarea', hint: 'example: Separator Horizontal 4: Heater Treater Vertical 2: Scrubber Horizontal 1: VRU vertical 1' },
        { id: 'production_area_verified', label: 'Select all areas verified installation is completed in PRODUCTION AREA according to Lightning Master installation best practices and standards', type: 'checklist',
          options: [
            'Air Terminals bonded directly to grounded vessels',
            'Air Terminals installed with conductor and downleads to ground',
            'Lightning Master Installed Ground electrodes',
            'Grounded vessels using EXISTING ground system',
            'Poles kits installed to create zone of protection',
            'Other',
          ]},
      ]},
      { title: 'Light Poles, SCADA, Communications', fields: [
        { id: 'photo_pole_types',       label: 'Capture 1 photo of EACH type of pole lightning protection was installed (Example: "Light Pole" or "SCADA" or "Surveillance Camera or similar pole")', type: 'photo' },
        { id: 'pole_list',              label: 'List type and quantity of each type of pole protected', type: 'text', hint: 'example: 3 Wooden poles, 2 metal site lights on building, 1 SCADA' },
        { id: 'light_pole_notes',       label: 'Light Pole Notes', type: 'textarea' },
      ]},
      { title: 'Buildings, Awnings, Electrical Panel', fields: [
        { id: 'photo_buildings',        label: 'LMC INSTALLED PROTECTION ONLY — (1) Photo of each Building and/or Canopy and/or Awning, and/or Electric Panel with Air Terminals (Exclude Battery, Production area and Light Poles) 6 photos max', type: 'photo' },
      ]},
      { title: 'Other Miscellaneous Notes', fields: [
        { id: 'remarks',                label: 'Remarks / Additional Notes',                              type: 'textarea' },
        { id: 'photo_misc',             label: 'Photo of Miscellaneous or additional photos needed',      type: 'photo' },
        { id: 'added_structures_scope', label: 'Added Structures Scope',                                  type: 'textarea' },
        { id: 'photo_added_structures', label: 'Added Structures',                                        type: 'photo' },
      ]},
      { title: 'Lightning Master Notes', fields: [
        { id: 'lm_notes',               label: 'Internal Notes',                                          type: 'textarea' },
        { id: 'date_completed',         label: 'Date of Completion',                                      type: 'date', required: true },
      ]},
    ],
  },
  'golden-triangle': {
    label: 'Golden Triangle Polymers', short: 'GT Polymers',
    icon: Buildings, color: '#D97706', colorDim: '#FEF3C7',
    desc: 'Structure Completion Report — Golden Triangle Polymers', ref: 'NFPA 780',
    fields: [
      { id: 'structure_name',   label: 'Structure Name',          type: 'text',    required: true },
      { id: 'structure_type',   label: 'Structure Type',          type: 'select',  options: ['Processing', 'Storage', 'Office', 'Utility', 'Other'], required: true },
      { id: 'lps_class',        label: 'LPS Class',               type: 'select',  options: ['Class I', 'Class II'], required: true },
      { id: 'air_terminals',    label: 'Air Terminals Installed', type: 'number',  required: true },
      { id: 'down_conductors',  label: 'Down Conductors',         type: 'number',  required: true },
      { id: 'ground_rods',      label: 'Ground Rods',             type: 'number',  required: true },
      { id: 'bonding_complete', label: 'Bonding Complete',        type: 'boolean', required: true },
      { id: 'ul_label',         label: 'UL Master Label Applied', type: 'boolean' },
    ],
  },
  'northstar': {
    label: 'Northstar', short: 'Northstar',
    icon: Buildings, color: '#059669', colorDim: '#D1FAE5',
    desc: 'Structure Completion Report — Northstar', ref: 'NFPA 780',
    fields: [
      { id: 'structure_name',   label: 'Structure Name',          type: 'text',    required: true },
      { id: 'structure_type',   label: 'Structure Type',          type: 'select',  options: ['Processing', 'Storage', 'Office', 'Utility', 'Other'], required: true },
      { id: 'lps_class',        label: 'LPS Class',               type: 'select',  options: ['Class I', 'Class II'], required: true },
      { id: 'air_terminals',    label: 'Air Terminals Installed', type: 'number',  required: true },
      { id: 'down_conductors',  label: 'Down Conductors',         type: 'number',  required: true },
      { id: 'ground_rods',      label: 'Ground Rods',             type: 'number',  required: true },
      { id: 'bonding_complete', label: 'Bonding Complete',        type: 'boolean', required: true },
      { id: 'ul_label',         label: 'UL Master Label Applied', type: 'boolean' },
    ],
  },
  'swd-inspection': {
    label: 'SWD LP Inspection Report', short: 'SWD Inspection',
    icon: Drop, color: '#6366F1', colorDim: '#EEF2FF',
    desc: 'Preventative maintenance for upstream tank batteries and midstream facilities', ref: 'NFPA 780 / API RP 545',
    fields: [
      { id: 'site_type',        label: 'Site Type',               type: 'select',  options: ['Upstream Tank Battery', 'Midstream Processing', 'Downstream Storage', 'Refinement', 'Other'], required: true },
      { id: 'overall_result',   label: 'Overall Result',          type: 'select',  options: ['Pass', 'Pass with Conditions', 'Fail'], required: true },
      { id: 'conductor_condition', label: 'Conductor Condition',  type: 'select',  options: ['Good', 'Fair - Monitor', 'Poor - Replace'], required: true },
      { id: 'ground_resistance',label: 'Ground Resistance (ohms)',type: 'number' },
      { id: 'corrosion_found',  label: 'Corrosion / Damage Found',type: 'boolean' },
      { id: 'repairs_required', label: 'Repairs Required',        type: 'boolean' },
      { id: 'deficiencies',     label: 'Deficiencies Found',      type: 'textarea' },
    ],
  },
  'bolt-completion': {
    label: 'Bolt Completion Report', short: 'Bolt Completion',
    icon: Lightning, color: '#C0101B', colorDim: '#FEF0F1',
    desc: 'Bolt completion report for LPS installation', ref: 'NFPA 780 / UL 96A',
    fields: [], // flat fields kept for PDF compat; sections drives the form UI
    sections: [
      { title: 'Project Information', fields: [
        { id: 'customer_name',          label: 'Customer Name',          type: 'text',  required: true },
        { id: 'site_facility_name',     label: 'Site / Facility Name',   type: 'text',  required: true },
        { id: 'job_number',             label: 'Job Number',             type: 'text',  required: true },
        { id: 'location',               label: 'Location',               type: 'gps' },
        { id: 'primary_contact_name',   label: 'Primary Contact Name',   type: 'text',  required: true },
        { id: 'primary_contact_phone',  label: 'Primary Contact Phone',  type: 'tel',   required: true },
        { id: 'primary_contact_email',  label: 'Primary Contact Email',  type: 'email', hint: 'If more than one email, separate each by a space.' },
        { id: 'field_contact_name',     label: 'Field Contact Name',     type: 'text',  required: true },
        { id: 'field_contact_number',   label: 'Field Contact Number',   type: 'tel' },
      ]},
      { title: 'Bolt Crew Information', fields: [
        { id: 'bolt_representative',    label: 'Bolt Representative',    type: 'text',  required: true },
        { id: 'bolt_supervisor_email',  label: 'Bolt Supervisor Email',  type: 'email', required: true, hint: 'If more than one email, separate each by a space.' },
        { id: 'installer_names',        label: 'Installer Names',        type: 'text',  required: true },
        { id: 'date_of_completion',     label: 'Date Of Completion',     type: 'date',  required: true },
        { id: 'customer_name_sig',      label: 'Customer Name for Signature', type: 'text' },
        { id: 'site_sign',              label: 'Site Sign',              type: 'photo', required: true },
        { id: 'front_of_facility',      label: 'Front of Facility',      type: 'photo', required: true },
      ]},
      { title: 'Scope of Work', fields: [
        { id: 'scope_of_work',          label: 'Scope of Work',          type: 'textarea', required: true },
      ]},
      { title: 'Site Detail', fields: [
        { id: 'type_of_installation',   label: 'Type Of Installation',   type: 'select', required: true,
          options: ['New Installation', 'Retrofit', 'Addition / Extension', 'Replacement'] },
        { id: 'common_bond',            label: 'Common Bond?',           type: 'select', required: true, options: ['Yes', 'No'] },
        { id: 'surge_protection',       label: 'Was Surge Protection Provided?', type: 'select', required: true, options: ['Yes', 'No'] },
        { id: 'ul_certificate',         label: 'UL Master Certificate or Letter Of Findings?', type: 'select', required: true,
          options: ['UL Master Certificate', 'Letter of Findings', 'Both', 'Neither / Pending'] },
        { id: 'additional_notes',       label: 'Additional Notes',       type: 'textarea' },
      ]},
      { title: 'Site Pictures', fields: [
        { id: 'photo_roof_top',         label: 'Roof Top',               type: 'photo', required: true },
        { id: 'notes_roof_top',         label: 'Notes',                  type: 'text' },
        { id: 'photo_perimeter',        label: 'Perimeter',              type: 'photo' },
        { id: 'notes_perimeter',        label: 'Notes',                  type: 'text' },
        { id: 'photo_rtu_mid_roof',     label: 'RTU / Mid-roof',         type: 'photo' },
        { id: 'notes_rtu_mid_roof',     label: 'Notes',                  type: 'text' },
        { id: 'photo_thru_roof',        label: 'Thru-Roof',              type: 'photo' },
        { id: 'notes_thru_roof',        label: 'Notes',                  type: 'text' },
        { id: 'photo_downleads',        label: 'Downleads & Grounding',  type: 'photo' },
        { id: 'notes_downleads',        label: 'Notes',                  type: 'text' },
        { id: 'photo_common_bond',      label: 'Common Bond',            type: 'photo' },
        { id: 'notes_common_bond',      label: 'Notes',                  type: 'text' },
        { id: 'photo_additional',       label: 'Additional Photos',      type: 'photo' },
        { id: 'notes_additional',       label: 'Notes',                  type: 'text' },
      ]},
    ],
  },
  'bolt-inspection': {
    label: 'Bolt Inspection Report', short: 'Bolt Inspection',
    icon: MagnifyingGlass, color: '#C0101B', colorDim: '#FEF0F1',
    desc: 'Bolt inspection and compliance report', ref: 'NFPA 780 / UL 96A',
    fields: [], // flat fields kept for PDF compat; sections drives the form UI
    sections: [
      { title: 'Project Information', fields: [
        { id: 'customer_name',          label: 'Customer Name',          type: 'text',  required: true },
        { id: 'site_facility_name',     label: 'Site / Facility Name',   type: 'text',  required: true },
        { id: 'job_number',             label: 'Job Number',             type: 'text' },
        { id: 'location',               label: 'Location',               type: 'gps' },
        { id: 'primary_contact_name',   label: 'Primary Contact Name',   type: 'text',  required: true },
        { id: 'primary_contact_phone',  label: 'Primary Contact Phone',  type: 'tel',   required: true },
        { id: 'primary_contact_email',  label: 'Primary Contact Email',  type: 'email', hint: 'If more than one email, separate each by a space.' },
        { id: 'field_contact_name',     label: 'Field Contact Name',     type: 'text',  required: true },
        { id: 'field_contact_number',   label: 'Field Contact Number',   type: 'tel' },
      ]},
      { title: 'Bolt Crew Information', fields: [
        { id: 'bolt_representative',    label: 'Bolt Representative',    type: 'text',  required: true },
        { id: 'bolt_supervisor_email',  label: 'Bolt Supervisor Email',  type: 'email', required: true, hint: 'If more than one email, separate each by a space.' },
        { id: 'installer_names',        label: 'Installer Names',        type: 'text',  required: true },
        { id: 'date_of_completion',     label: 'Date Of Completion',     type: 'date',  required: true },
        { id: 'customer_signature',     label: 'Customer Signature',     type: 'signature',
          hint: 'Confirms delivery receipt of materials and installation is completed to Bolt Lightning Protection best practices standards.' },
        { id: 'customer_name_sig',      label: 'Customer Name for Signature', type: 'text' },
        { id: 'site_sign',              label: 'Site Sign',              type: 'photo', required: true },
        { id: 'front_of_facility',      label: 'Front of Facility',      type: 'photo', required: true },
      ]},
      { title: 'Site Detail', fields: [
        { id: 'type_of_installation',   label: 'Type Of Installation',   type: 'select', required: true,
          options: ['New Installation', 'Retrofit', 'Addition / Extension', 'Replacement'] },
        { id: 'common_bond',            label: 'Common Bond?',           type: 'select', required: true, options: ['Yes', 'No'] },
        { id: 'additional_notes',       label: 'Additional Notes',       type: 'textarea' },
        { id: 'total_thru_roofs',       label: 'Total Number Of Thru-Roofs', type: 'number', required: true },
        { id: 'is_surge_installed',     label: 'Is Surge Installed?',    type: 'text' },
        { id: 'remediations',           label: 'Remediations',           type: 'photo' },
      ]},
      { title: 'Site Pictures', fields: [
        { id: 'photo_roof_top',         label: 'Roof Top',               type: 'photo', required: true },
        { id: 'notes_roof_top',         label: 'Notes',                  type: 'text' },
        { id: 'photo_perimeter',        label: 'Perimeter',              type: 'photo' },
        { id: 'notes_perimeter',        label: 'Notes',                  type: 'text' },
        { id: 'photo_rtu_mid_roof',     label: 'RTU / Mid-roof',         type: 'photo' },
        { id: 'notes_rtu_mid_roof',     label: 'Notes',                  type: 'text' },
        { id: 'photo_thru_roof',        label: 'Thru-roof',              type: 'photo' },
        { id: 'notes_thru_roof',        label: 'Notes',                  type: 'text' },
        { id: 'photo_downleads',        label: 'Downleads & Grounding',  type: 'photo' },
        { id: 'notes_downleads',        label: 'Notes',                  type: 'text' },
        { id: 'photo_common_bond',      label: 'Common Bond',            type: 'photo' },
        { id: 'notes_common_bond',      label: 'Notes',                  type: 'text' },
        { id: 'photo_additional',       label: 'Additional Photos',      type: 'photo' },
        { id: 'notes_additional',       label: 'Notes',                  type: 'text' },
      ]},
    ],
  },
  // Midstream Facilities sub-section forms
  'midstream-general':    { label: 'General Site Information',            short: 'Site Info',      icon: MagnifyingGlass, color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'General site information and overview', ref: 'NFPA 780', fields: [ { id: 'operator', label: 'Operator/Owner', type: 'text', required: true }, { id: 'facility_type', label: 'Facility Type', type: 'select', options: ['Compressor Station', 'Metering Station', 'Gas Processing', 'Treatment Plant'], required: true }, { id: 'lps_exists', label: 'Existing LPS Present', type: 'boolean' }, { id: 'last_inspection', label: 'Last Inspection Date', type: 'date' }, { id: 'overall_condition', label: 'Overall Condition', type: 'select', options: ['Good', 'Fair', 'Poor'] }, { id: 'notes', label: 'Notes', type: 'textarea' } ] },
  'midstream-buildings':  { label: 'Buildings and Offices',               short: 'Buildings',      icon: Buildings,       color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Inspect lightning protection on buildings and office structures', ref: 'NFPA 780', fields: [ { id: 'structure_count', label: 'Number of Structures', type: 'number', required: true }, { id: 'air_terminals_ok', label: 'Air Terminals Satisfactory', type: 'boolean', required: true }, { id: 'conductors_ok', label: 'Conductors Satisfactory', type: 'boolean', required: true }, { id: 'bonding_ok', label: 'Bonding Satisfactory', type: 'boolean' }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-cable':      { label: 'Elevated Cable Trays and Pipe Racks', short: 'Cable Trays',    icon: Factory,         color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Elevated cable trays and pipe rack inspection', ref: 'NFPA 780', fields: [ { id: 'bonding_continuity', label: 'Bonding Continuity', type: 'boolean', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'corrosion', label: 'Corrosion Present', type: 'boolean' }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-fans':       { label: 'Air Cooled Heat Exchanger Fans',      short: 'ACHE Fans',      icon: Factory,         color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Air cooled heat exchanger fan inspection', ref: 'NFPA 780', fields: [ { id: 'fan_count', label: 'Number of Units', type: 'number', required: true }, { id: 'bonding_ok', label: 'Bonding Satisfactory', type: 'boolean', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-tanks':      { label: 'Storage Tanks',                       short: 'Storage Tanks',  icon: Drop,            color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Storage tank lightning protection inspection', ref: 'API RP 545 / NFPA 780', fields: [ { id: 'tank_count', label: 'Number of Tanks', type: 'number', required: true }, { id: 'tank_type', label: 'Tank Type', type: 'select', options: ['Floating Roof', 'Fixed Roof', 'Cone Roof', 'Dome Roof'] }, { id: 'shunts_ok', label: 'Shunts/Bonds Satisfactory', type: 'boolean', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'resistance_ohms', label: 'Ground Resistance (ohms)', type: 'number' }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-generators': { label: 'Power Generators',                    short: 'Generators',     icon: Lightning,       color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Power generator grounding and bonding inspection', ref: 'NFPA 780 / NEC', fields: [ { id: 'generator_count', label: 'Number of Units', type: 'number', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'bonding_ok', label: 'Bonding Satisfactory', type: 'boolean', required: true }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-vessels':    { label: 'Scrubber / Separator Vessels',        short: 'Vessels',        icon: Factory,         color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Scrubber and separator vessel inspection', ref: 'NFPA 780 / API RP 545', fields: [ { id: 'vessel_count', label: 'Number of Vessels', type: 'number', required: true }, { id: 'bonding_ok', label: 'Bonding Satisfactory', type: 'boolean', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-poles':      { label: 'Light Poles and Communication Towers', short: 'Poles/Towers',  icon: Lightning,       color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Light pole and communication tower inspection', ref: 'NFPA 780', fields: [ { id: 'structure_count', label: 'Number of Structures', type: 'number', required: true }, { id: 'grounding_ok', label: 'Grounding Satisfactory', type: 'boolean', required: true }, { id: 'conductor_ok', label: 'Down Conductors Satisfactory', type: 'boolean', required: true }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-fence':      { label: 'Perimeter Chain Link Fence',          short: 'Fence',          icon: Factory,         color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Perimeter fence bonding and grounding inspection', ref: 'NFPA 780', fields: [ { id: 'fence_bonded', label: 'Fence Properly Bonded', type: 'boolean', required: true }, { id: 'gates_bonded', label: 'Gates Bonded', type: 'boolean', required: true }, { id: 'deficiencies', label: 'Deficiencies', type: 'textarea' } ] },
  'midstream-misc':       { label: 'Other Miscellaneous Areas',           short: 'Misc Areas',     icon: MagnifyingGlass, color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Other miscellaneous areas inspection', ref: 'NFPA 780', fields: [ { id: 'area_desc', label: 'Area Description', type: 'text', required: true }, { id: 'condition', label: 'Condition', type: 'select', options: ['Good', 'Fair - Monitor', 'Poor - Repair Required'] }, { id: 'notes', label: 'Notes', type: 'textarea' } ] },
  'midstream-summary':    { label: 'Recommendations Summary',             short: 'Recommendations',icon: ClipboardText,   color: '#0EA5E9', colorDim: '#E0F2FE', desc: 'Summary of findings and recommendations', ref: 'NFPA 780', fields: [ { id: 'overall_result', label: 'Overall Assessment', type: 'select', options: ['Satisfactory', 'Satisfactory with Conditions', 'Unsatisfactory'], required: true }, { id: 'priority_repairs', label: 'Priority Repairs Required', type: 'boolean' }, { id: 'recommendations', label: 'Recommendations', type: 'textarea', required: true }, { id: 'next_inspection', label: 'Next Inspection Due', type: 'date' } ] },
})

// ─── Form catalog by branch ────────────────────────────────────────────────────
const FORM_CATALOG = {
  lm: {
    completion: [
      { id: 'midstream-install', label: 'Midstream Install Completion', desc: 'New installation of midstream facilities',            icon: Factory   },
      { id: 'swd-production',    label: 'SWD Production Install',       desc: 'SWD and Production sites after new installation',    icon: Drop      },
      { id: 'golden-triangle',   label: 'Golden Triangle Polymers',     desc: 'Structure Completion Report',                        icon: Buildings },
      { id: 'northstar',         label: 'Northstar',                    desc: 'Structure Completion Report',                        icon: Buildings },
    ],
    inspection: [
      { id: 'midstream-facilities', label: 'Midstream Facilities Inspection', desc: 'Compressor Stations, Metering, Gas Processing', icon: MagnifyingGlass, hasSubs: true },
      { id: 'swd-inspection',       label: 'SWD LP Inspection Report',        desc: 'Upstream tank batteries & midstream facilities', icon: Drop            },
    ],
    survey: [
      { id: 'site-survey', label: 'Site Survey Quote Form', desc: 'Assets to protect, materials and site information', icon: Ruler },
    ],
  },
  bolt: {
    completion: [
      { id: 'bolt-completion', label: 'Bolt Completion Report', desc: 'Bolt completion report for LPS installation', icon: Lightning },
    ],
    inspection: [
      { id: 'bolt-inspection', label: 'Bolt Inspection Report', desc: 'Bolt inspection and compliance report',        icon: MagnifyingGlass },
    ],
    survey: [
      { id: 'site-survey', label: 'Site Survey Quote Form', desc: 'Assets to protect, materials and site information', icon: Ruler },
    ],
  },
}

// ─── Midstream Facilities sub-sections ────────────────────────────────────────
const MIDSTREAM_SUBS = [
  { id: 'midstream-general',    label: 'General Site Information',             required: true  },
  { id: 'midstream-buildings',  label: 'Buildings and Offices'                                 },
  { id: 'midstream-cable',      label: 'Elevated Cable Trays and Pipe Racks'                   },
  { id: 'midstream-fans',       label: 'Air Cooled Heat Exchanger Fans'                        },
  { id: 'midstream-tanks',      label: 'Storage Tanks'                                         },
  { id: 'midstream-generators', label: 'Power Generators'                                      },
  { id: 'midstream-vessels',    label: 'Scrubber / Separator Vessels'                          },
  { id: 'midstream-poles',      label: 'Light Poles and Communication Towers'                  },
  { id: 'midstream-fence',      label: 'Perimeter Chain Link Fence'                            },
  { id: 'midstream-misc',       label: 'Other Miscellaneous Areas'                             },
  { id: 'midstream-summary',    label: 'Recommendations Summary'                               },
]

// ─── Signature pad ─────────────────────────────────────────────────────────────
import { useRef } from 'react'

function SigPad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image()
      img.onload = () => canvasRef.current?.getContext('2d')?.drawImage(img, 0, 0)
      img.src = value
    }
  }, [])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height
    if (e.touches) return { x: (e.touches[0].clientX - rect.left)*sx, y: (e.touches[0].clientY - rect.top)*sy }
    return { x: (e.clientX - rect.left)*sx, y: (e.clientY - rect.top)*sy }
  }
  const start = (e) => { e.preventDefault(); drawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const move  = (e) => { e.preventDefault(); if (!drawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#374151'; ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const end   = (e) => { e.preventDefault(); if (!drawing.current) return; drawing.current=false; onChange(canvasRef.current.toDataURL('image/png')) }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0,0,480,80); onChange(null) }

  return (
    <div style={{ position:'relative', border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
      <canvas ref={canvasRef} width={480} height={100}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width:'100%', height:'6rem', display:'block', background:'#FAFAFA', cursor:'crosshair', touchAction:'none' }}
      />
      {!value && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'var(--text-3)', fontSize:'var(--fs-sm)', pointerEvents:'none', fontFamily:'var(--font)' }}>Sign here</div>}
      {value  && <button type="button" onClick={clear} style={{ position:'absolute', top:'var(--sp-1)', right:'var(--sp-1)', background:'rgba(0,0,0,0.45)', borderRadius:'var(--r-xs)', padding:'0.125rem 0.375rem', fontSize:'var(--fs-xs)', color:'#fff', display:'flex', alignItems:'center', gap:'var(--sp-1)' }}><Trash size={10}/> Clear</button>}
    </div>
  )
}

// ─── PDF generator ─────────────────────────────────────────────────────────────
async function generateCompletionPdf(formType, formData) {
  const cfg = COMPLETION_TYPES[formType]
  const doc = new jsPDF({ unit:'pt', format:'letter' })
  const W=612, ML=40, CW=532
  const NAVY=[26,35,95], NAVY2=[42,55,120], NAVY_LT=[235,240,255]
  const WHITE=[255,255,255], BG=[248,249,252], BORDER=[218,222,232]
  const LABEL=[107,114,128], TEXT=[17,24,39]
  const GREEN=[22,163,74], GREEN_BG=[240,253,244], GREEN_BD=[134,239,172]
  let y=0

  const checkPage = (n=28) => { if (y+n>750) { drawFooter(); doc.addPage(); y=40 } }
  const drawFooter = () => {
    const ph=doc.internal.pageSize.getHeight()
    doc.setFillColor(...BG); doc.rect(0,ph-34,W,34,'F')
    doc.setDrawColor(...BORDER); doc.line(0,ph-34,W,ph-34)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(`LMC Field Operations  ·  ${cfg.label}  ·  ${cfg.ref}`, ML, ph-14)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, W/2, ph-14, {align:'center'})
    doc.text(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), W-ML, ph-14, {align:'right'})
  }
  const sectionHead = (title) => {
    checkPage(28)
    doc.setFillColor(...NAVY); doc.rect(ML,y,3,18,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), ML+10, y+12)
    doc.setDrawColor(...NAVY_LT); doc.line(ML+10+doc.getTextWidth(title.toUpperCase())+6, y+8, ML+CW, y+8)
    y+=22
  }
  const fieldRow = (label, value, shade=false) => {
    const lines=doc.splitTextToSize(String(value??'—'), CW-140)
    const rowH=Math.max(20, lines.length*12+8)
    checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    doc.text(lines, ML+140, y+13)
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y+=rowH
  }
  const boolRow = (label, value, shade=false) => {
    const rowH=20; checkPage(rowH)
    if (shade) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...LABEL)
    doc.text(label.toUpperCase(), ML+6, y+13)
    const ok=value===true||value==='true'
    const pW=40, pX=ML+CW-pW-6, pY=y+(rowH-14)/2
    doc.setFillColor(...(ok?GREEN_BG:[254,242,242])); doc.setDrawColor(...(ok?GREEN_BD:[254,202,202]))
    doc.roundedRect(pX,pY,pW,14,2,2,'FD')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...(ok?GREEN:[220,38,38]))
    doc.text(ok?'YES':'NO', pX+pW/2, pY+9.5, {align:'center'})
    doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
    y+=rowH
  }

  // Header
  doc.setFillColor(...NAVY); doc.rect(0,0,W,80,'F')
  doc.setFillColor(...NAVY2); doc.rect(W-160,0,160,80,'F')
  doc.setFillColor(59,130,246); doc.rect(0,80,W,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...WHITE)
  doc.text('LMC', ML, 36)
  doc.setDrawColor(80,100,160); doc.line(ML+42,12,ML+42,68)
  doc.setFontSize(11); doc.text('Field Operations', ML+52, 30)
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(170,185,220)
  doc.text(cfg.label, ML+52, 46); doc.text(cfg.ref, ML+52, 60)
  doc.setFillColor(...GREEN); doc.roundedRect(W-148,12,112,20,3,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('COMPLETED & SIGNED', W-92, 25, {align:'center'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(170,185,220)
  doc.text(new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}), W-ML, 50, {align:'right'})
  y=84

  // Summary strip
  doc.setFillColor(...NAVY_LT); doc.rect(0,y,W,32,'F')
  doc.setDrawColor(...BORDER); doc.line(0,y+32,W,y+32)
  const cw4=W/4
  ;[{label:'SITE',val:formData.site_name||'—'},{label:'JOB #',val:formData.job_number||'—'},{label:'DATE',val:formData.date_completed||'—'},{label:'TECHNICIAN',val:formData.tech_name||'—'}]
    .forEach(({label,val},i) => {
      const cx=i*cw4
      if (i>0) { doc.setDrawColor(...BORDER); doc.line(cx,y+4,cx,y+28) }
      doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...LABEL)
      doc.text(label, cx+cw4/2, y+11, {align:'center'})
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...NAVY)
      let v=val; while(doc.getTextWidth(v)>cw4-12&&v.length>4) v=v.slice(0,-2)+'…'
      doc.text(v, cx+cw4/2, y+24, {align:'center'})
    })
  y+=44

  sectionHead('Job Information')
  fieldRow('Site Name',  formData.site_name||'—')
  fieldRow('Address',    formData.site_address||'—', true)
  fieldRow('Job Number', formData.job_number||'—')
  fieldRow('Technician', formData.tech_name||'—', true)
  fieldRow('Date',       formData.date_completed||'—')
  y+=6

  sectionHead(`${cfg.short} Details`)
  cfg.fields.forEach((f,i) => {
    if (f.type==='boolean') boolRow(f.label, formData[f.id], i%2===1)
    else fieldRow(f.label, formData[f.id]??'—', i%2===1)
  })
  y+=6

  if (formData.notes) { sectionHead('Notes'); fieldRow('Notes', formData.notes); y+=6 }
  if (formData.punch_list?.length) {
    sectionHead('Punch List')
    formData.punch_list.forEach((item,i) => fieldRow(`Item ${i+1}`, item, i%2===1))
    y+=6
  }

  sectionHead('Sign-Off')
  ;[{role:'Supervisor',name:formData.supervisor_name,sig:formData.supervisor_sig},{role:'Customer',name:formData.customer_name,sig:formData.customer_sig}]
    .filter(p=>p.name)
    .forEach((p,n) => {
      const rowH=56; checkPage(rowH)
      if (n%2===1) { doc.setFillColor(...BG); doc.rect(ML,y,CW,rowH,'F') }
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...TEXT)
      doc.text(p.name, ML+6, y+16)
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...LABEL)
      doc.text(p.role, ML+6, y+28)
      if (p.sig?.startsWith('data:image')) { try { doc.addImage(p.sig,'PNG',ML+200,y+6,120,38) } catch(e){} }
      doc.setFillColor(...GREEN_BG); doc.setDrawColor(...GREEN_BD)
      doc.roundedRect(ML+CW-80,y+18,68,16,3,3,'FD')
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREEN)
      doc.text('SIGNED', ML+CW-46, y+29, {align:'center'})
      doc.setDrawColor(...BORDER); doc.line(ML,y+rowH,ML+CW,y+rowH)
      y+=rowH
    })

  drawFooter()

  const pdfBlob  = doc.output('blob')
  const date     = formData.date_completed||new Date().toISOString().slice(0,10)
  const slug     = (formData.site_name||'site').toLowerCase().replace(/\s+/g,'-').slice(0,20)
  const filePath = `completion-forms/${formType}_${date}_${slug}_${Date.now().toString(36)}.pdf`
  const { error } = await db.storage.from('field-log-pdfs').upload(filePath, pdfBlob, { contentType:'application/pdf', upsert:true })
  if (error) throw error
  const { data: urlData } = db.storage.from('field-log-pdfs').getPublicUrl(filePath)
  return urlData.publicUrl
}

// ─── Field renderer ────────────────────────────────────────────────────────────
function FormField({ field, value, onChange }) {
  const base = { width:'100%', fontSize:'var(--fs-md)', background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)' }
  if (field.type==='select') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)} style={base}>
      <option value="">Select…</option>
      {field.options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )
  if (field.type==='boolean') return (
    <div style={{ display:'flex', gap:'var(--sp-2)', padding:'0.25rem', background:'var(--surface-raised)', border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)' }}>
      {['Yes','No'].map(opt => {
        const active = opt==='Yes'?value===true:value===false
        return (
          <button key={opt} type="button" onClick={()=>onChange(opt==='Yes')} style={{
            flex:1, padding:'var(--sp-2)', borderRadius:'var(--r-xs)', fontSize:'var(--fs-md)',
            border: active ? '1px solid var(--navy)' : '1px solid transparent',
            background: active ? 'var(--navy)' : 'transparent',
            color: active ? '#fff' : 'var(--text-2)',
            fontWeight: active ? 600 : 400, transition:'all var(--ease-fast)',
          }}>{opt}</button>
        )
      })}
    </div>
  )
  if (field.type==='textarea') return <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...base, resize:'vertical', lineHeight:1.5, padding:'var(--sp-2) var(--sp-3)' }} />
  if (field.type==='date')    return <input type="date"   value={value||''} onChange={e=>onChange(e.target.value)} style={base} />
  if (field.type==='number')  return <input type="number" step="any" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="0" style={base} />
  if (field.type==='tel')     return <input type="tel"    value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base} />
  if (field.type==='email')   return <input type="email"  value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base} />
  if (field.type==='signature') return <SigPad value={value||null} onChange={onChange} />
  if (field.type==='radio') return (
    <div style={{ border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
      {field.options.map((opt, i) => {
        const active = value === opt
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
            background: active ? '#EEF2FF' : '#fff',
            border: 'none',
            borderTop: i > 0 ? '1px solid #E5E7EB' : 'none',
            textAlign:'left', fontSize:'var(--fs-md)', color: active ? '#6366F1' : 'var(--text-1)',
            fontWeight: active ? 600 : 400,
          }}>
            {opt}
            <span style={{ width:18, height:18, borderRadius:'50%', border: active ? '5px solid #6366F1' : '2px solid #C9CDD4', flexShrink:0, display:'inline-block' }} />
          </button>
        )
      })}
      {field.allowOther && value === 'Other' && (
        <input type="text" placeholder="Please specify…" style={{ width:'100%', padding:'8px 14px', border:'none', borderTop:'1px solid #E5E7EB', fontSize:'var(--fs-md)', background:'#FAFAFA' }} />
      )}
    </div>
  )
  if (field.type==='checklist') return (
    <div style={{ border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
      {field.options.map((opt, i) => {
        const checked = Array.isArray(value) && value.includes(opt)
        const toggle = () => {
          const cur = Array.isArray(value) ? value : []
          onChange(checked ? cur.filter(v => v !== opt) : [...cur, opt])
        }
        return (
          <button key={opt} type="button" onClick={toggle} style={{
            width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
            background: checked ? '#EEF2FF' : (i % 2 === 0 ? '#fff' : '#FAFAFA'),
            borderTop: i > 0 ? '1px solid #E5E7EB' : 'none', border:'none',
            textAlign:'left', fontSize:'var(--fs-sm)', color: checked ? '#4F46E5' : 'var(--text-1)',
            fontWeight: checked ? 600 : 400,
          }}>
            <span style={{ flex:1, lineHeight:1.4 }}>{opt}</span>
            <span style={{
              width:17, height:17, borderRadius:4, flexShrink:0,
              border: checked ? '2px solid #4F46E5' : '2px solid #C9CDD4',
              background: checked ? '#4F46E5' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {checked && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
  if (field.type==='gps') return (
    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-2) var(--sp-3)', background:'var(--bg)', border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)', color:'var(--text-2)', fontSize:'var(--fs-md)' }}>
      <MapPin size={13} style={{ color:'var(--blue)', flexShrink:0 }} />
      <span style={{ fontFamily:'var(--mono)', fontSize:'var(--fs-sm)' }}>{value || 'Acquiring location…'}</span>
    </div>
  )
  if (field.type==='photo') {
    const fid = `photo-${field.id}`
    const handleFile = e => {
      const f = e.target.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = ev => onChange(ev.target.result)
      reader.readAsDataURL(f)
    }
    return (
      <label htmlFor={fid} style={{ cursor:'pointer', display:'block' }}>
        <input id={fid} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFile} />
        {value
          ? <div style={{ position:'relative', border:'1px solid #E5E7EB', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
              <img src={value} alt={field.label} style={{ width:'100%', maxHeight:'200px', objectFit:'cover', display:'block' }} />
              <button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();onChange(null)}}
                style={{ position:'absolute', top:'var(--sp-1)', right:'var(--sp-1)', background:'rgba(0,0,0,0.55)', borderRadius:'var(--r-xs)', padding:'0.125rem 0.375rem', fontSize:'var(--fs-xs)', color:'#fff', display:'flex', alignItems:'center', gap:'var(--sp-1)' }}>
                <X size={10}/> Remove
              </button>
            </div>
          : <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', padding:'var(--sp-3)', background:'var(--bg)', border:'1.5px dashed #C9CDD4', borderRadius:'var(--r-sm)', color:'var(--text-3)', fontSize:'var(--fs-md)' }}>
              <Camera size={15}/> Tap to choose photo
            </div>
        }
      </label>
    )
  }
  return <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base} />
}

function FieldLabel({ label, required }) {
  return (
    <div style={{ fontFamily:'var(--font)', fontSize:'var(--fs-sm)', fontWeight:600, color:'var(--text-2)', marginBottom:'var(--sp-1)' }}>
      {label}{required&&<span style={{ color:'var(--red)', marginLeft:'2px' }}>*</span>}
    </div>
  )
}

function Section({ title, children, open, onToggle }) {
  return (
    <div style={{ background:'var(--surface)', borderRadius:'var(--r-lg)', marginBottom:'var(--sp-3)', overflow:'hidden' }}>
      <button type="button" onClick={onToggle} style={{ width:'100%', padding:'var(--sp-2) var(--sp-4)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--navy)' }}>
        <span style={{ fontFamily:'var(--font)', fontSize:'var(--fs-sm)', fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{title}</span>
        <CaretDown size={12} style={{ color:'rgba(255,255,255,0.6)', transform:open?'rotate(180deg)':'none', transition:'transform var(--ease-base)' }} />
      </button>
      {open && <div style={{ padding:'var(--sp-4)', display:'flex', flexDirection:'column', gap:'var(--sp-4)', background:'var(--surface-raised)' }}>{children}</div>}
    </div>
  )
}

// ─── Completion form view ──────────────────────────────────────────────────────
export function CompletionFormView({ formType, onSave, onCancel }) {
  const cfg  = COMPLETION_TYPES[formType]
  const [values,      setValues]      = useState({ date_completed: new Date().toISOString().slice(0,10), branch:'lm' })
  const initOpen = cfg.sections
    ? Object.fromEntries(cfg.sections.map(s => [s.title, true]))
    : { job:true, details:true, notes:true, signoff:true }
  const [open,        setOpen]        = useState(initOpen)
  const [punchItems,  setPunchItems]  = useState([''])
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)

  const set    = (k,v) => setValues(f=>({...f,[k]:v}))
  const toggle = (k)   => setOpen(o=>({...o,[k]:!o[k]}))
  const Icon   = cfg.icon

  // Auto-capture GPS for forms that have a gps field
  useEffect(() => {
    const allFields = cfg.sections ? cfg.sections.flatMap(s => s.fields) : (cfg.fields || [])
    if (allFields.some(f => f.type === 'gps')) {
      navigator.geolocation?.getCurrentPosition(
        pos => set('location', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => set('location', 'Location unavailable')
      )
    }
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    const payload = { ...values, punch_list: punchItems.filter(Boolean) }
    try {
      const pdfUrl = await generateCompletionPdf(formType, payload)
      await db.from('completion_forms').insert({
        form_type:       formType,
        branch:          values.branch||'lm',
        site_name:       values.site_name,
        site_address:    values.site_address,
        job_number:      values.job_number,
        tech_name:       values.tech_name,
        date_completed:  values.date_completed,
        notes:           values.notes,
        punch_list:      punchItems.filter(Boolean),
        form_data:       payload,
        supervisor_name: values.supervisor_name,
        supervisor_sig:  values.supervisor_sig,
        customer_name:   values.customer_name,
        customer_sig:    values.customer_sig,
        status:          'submitted',
        pdf_url:         pdfUrl,
      })
      onSave({ pdfUrl, siteName: values.site_name, formType })
    } catch(err) {
      setError('PDF upload failed. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

      {/* Sections: dynamic (sections-based forms) or legacy hardcoded */}
      {cfg.sections ? (
        cfg.sections.map(section => (
          <Section key={section.title} title={section.title} open={open[section.title] !== false} onToggle={()=>toggle(section.title)}>
            {section.fields.map(field => (
              <div key={field.id}>
                <FieldLabel label={field.label} required={field.required} />
                <FormField field={field} value={values[field.id]} onChange={v=>set(field.id,v)} />
                {field.hint && (
                  <div style={{ fontSize:'var(--fs-xs)', color:'var(--text-3)', marginTop:'var(--sp-1)', fontStyle:'italic' }}>{field.hint}</div>
                )}
              </div>
            ))}
          </Section>
        ))
      ) : (
        <>
      {/* Job info */}
      <Section title="Job Information" open={open.job} onToggle={()=>toggle('job')}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Site Name" required />
            <input value={values.site_name||''} onChange={e=>set('site_name',e.target.value)} placeholder="Site name" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Address" />
            <input value={values.site_address||''} onChange={e=>set('site_address',e.target.value)} placeholder="Street address" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div>
            <FieldLabel label="Job Number" />
            <input value={values.job_number||''} onChange={e=>set('job_number',e.target.value)} placeholder="JOB-2026-XXXX" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div>
            <FieldLabel label="Date Completed" required />
            <input type="date" value={values.date_completed||''} onChange={e=>set('date_completed',e.target.value)} style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <FieldLabel label="Assigned Technician" required />
            <input value={values.tech_name||''} onChange={e=>set('tech_name',e.target.value)} placeholder="Technician name" style={{ width:'100%', fontSize:'var(--fs-md)' }} />
          </div>
        </div>
      </Section>

      {/* Type-specific fields */}
      <Section title={`${cfg.short} Details`} open={open.details} onToggle={()=>toggle('details')}>
        {cfg.fields.map(field => (
          <div key={field.id}>
            <FieldLabel label={field.label} required={field.required} />
            <FormField field={field} value={values[field.id]} onChange={v=>set(field.id,v)} />
          </div>
        ))}
      </Section>

      {/* Notes + punch list */}
      <Section title="Notes & Punch List" open={open.notes} onToggle={()=>toggle('notes')}>
        <div>
          <FieldLabel label="Notes" />
          <textarea value={values.notes||''} onChange={e=>set('notes',e.target.value)} rows={3}
            placeholder="Additional notes, observations, or follow-up items…"
            style={{ width:'100%', fontSize:'var(--fs-md)', resize:'vertical', lineHeight:1.5, padding:'var(--sp-2) var(--sp-3)' }} />
        </div>
        <div>
          <FieldLabel label="Punch List Items" />
          {punchItems.map((item,i) => (
            <div key={i} style={{ display:'flex', gap:'var(--sp-2)', marginBottom:'var(--sp-2)' }}>
              <input value={item} onChange={e=>{ const n=[...punchItems]; n[i]=e.target.value; setPunchItems(n) }}
                placeholder={`Item ${i+1}`} style={{ flex:1, fontSize:'var(--fs-md)' }} />
              {punchItems.length>1 && (
                <button type="button" onClick={()=>setPunchItems(p=>p.filter((_,j)=>j!==i))} style={{ color:'var(--text-3)', padding:'0 var(--sp-2)' }}><X size={13}/></button>
              )}
            </div>
          ))}
          <button type="button" onClick={()=>setPunchItems(p=>[...p,''])}
            style={{ fontSize:'var(--fs-sm)', color:'var(--blue)', display:'flex', alignItems:'center', gap:'var(--sp-1)', marginTop:'var(--sp-1)' }}>
            <Plus size={12}/> Add item
          </button>
        </div>
      </Section>

      {/* Sign-off */}
      <Section title="Sign-Off" open={open.signoff} onToggle={()=>toggle('signoff')}>
        {[{role:'Supervisor',nk:'supervisor_name',sk:'supervisor_sig'},{role:'Customer',nk:'customer_name',sk:'customer_sig'}].map(({role,nk,sk}) => (
          <div key={role}>
            <FieldLabel label={`${role} Sign-Off`} />
            <input value={values[nk]||''} onChange={e=>set(nk,e.target.value)} placeholder={`${role} full name`}
              style={{ width:'100%', fontSize:'var(--fs-md)', marginBottom:'var(--sp-2)' }} />
            {values[nk] && <SigPad value={values[sk]||null} onChange={v=>set(sk,v)} />}
          </div>
        ))}
      </Section>
        </>
      )}

      </div>{/* /page-stack */}

      {error && <div style={{ padding:'var(--sp-3) var(--sp-4)', marginBottom:'var(--sp-3)', background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:'var(--r-md)', fontSize:'var(--fs-sm)', color:'var(--red)' }}>{error}</div>}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', padding:'var(--sp-3)', borderRadius:'var(--r-md)', marginBottom:'var(--sp-8)',
        background: submitting?'var(--hover)':'var(--red)',
        color: submitting?'var(--text-3)':'#fff',
        fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase',
        border:`1px solid ${submitting?'var(--border)':'var(--red)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--sp-2)',
        transition:'all var(--ease-fast)',
      }}>
        {submitting
          ? <><SpinnerGap size={14} style={{ animation:'spin 1s linear infinite' }} /> Generating PDF…</>
          : <><CheckCircle size={14} /> Complete &amp; Sign</>
        }
      </button>
    </div>
  )
}

// ─── Success view ──────────────────────────────────────────────────────────────
export function SuccessView({ result, onBack }) {
  return (
    <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--sp-10) var(--sp-6)' }}>
      <CheckCircle size={52} style={{ color:'var(--green)', marginBottom:'var(--sp-3)' }} />
      <div style={{ fontFamily:'var(--font)', fontSize:'var(--fs-xl)', fontWeight:700, marginBottom:'var(--sp-2)' }}>Form Completed</div>
      <div style={{ color:'var(--text-2)', fontSize:'var(--fs-md)', marginBottom:'var(--sp-6)', textAlign:'center' }}>
        {COMPLETION_TYPES[result.formType]?.label} for {result.siteName} has been saved.
      </div>
      <div style={{ display:'flex', gap:'var(--sp-3)' }}>
        {result.pdfUrl && (
          <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', gap:'var(--sp-2)',
            padding:'var(--sp-2) var(--sp-5)', borderRadius:'var(--r-md)',
            background:'var(--blue-soft)', color:'var(--blue)',
            fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.06em', textDecoration:'none',
          }}>
            <Eye size={13}/> View PDF
          </a>
        )}
        <button onClick={onBack} style={{
          padding:'var(--sp-2) var(--sp-5)', borderRadius:'var(--r-md)',
          background:'var(--surface)', fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', color:'var(--text-3)',
        }}>
          Back to Forms
        </button>
      </div>
    </div>
  )
}

// ─── Completion row in submissions list ────────────────────────────────────────
function CompletionRow({ form }) {
  const cfg = COMPLETION_TYPES[form.form_type]||{}
  const Icon = cfg.icon||ClipboardText
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', padding:'0.875rem var(--sp-4)', borderBottom:'1px solid var(--border-l)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="project-name">{form.site_name||'Unnamed Site'}</div>
        <div className="project-meta">{cfg.short} · {form.tech_name} · {form.date_completed}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--sp-1)', flexShrink:0 }}>
        <span className="badge badge-complete">Complete</span>
        {form.pdf_url && (
          <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', padding:'0.1875rem 0.5rem', borderRadius:'var(--r-xs)', background:'var(--blue-soft)', color:'var(--blue)', fontFamily:'var(--mono)', fontSize:'var(--fs-xs)', fontWeight:600, textTransform:'uppercase', textDecoration:'none' }}>
            <Eye size={10}/> PDF
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ title, forms, branch, onStart, expandedId, onToggle }) {
  const bc = BRANCH_COLORS[branch]
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column' }}>
      <div className="card-header" style={{ background: bc.bgActive }}>
        <span className="card-title">
          <span className="card-dot" style={{ background:'rgba(255,255,255,0.5)' }} />
          {title}
        </span>
      </div>
      <div style={{ flex:1 }}>
        {forms.map(form => {
          const Icon     = form.icon
          const isExpand = expandedId === form.id
          return (
            <div key={form.id}>
              <button
                onClick={() => form.hasSubs ? onToggle(isExpand ? null : form.id) : onStart(form.id)}
                style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:'var(--sp-3)',
                  padding:'0.75rem var(--sp-4)', borderBottom:'1px solid var(--border-l)',
                  transition:'background var(--ease-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Icon size={16} style={{ color: bc.bgActive, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="project-name">{form.label}</div>
                  <div className="project-meta">{form.desc}</div>
                </div>
                {form.hasSubs
                  ? <CaretDown size={12} style={{ color:'var(--text-3)', flexShrink:0, transition:'transform 0.15s', transform: isExpand ? 'rotate(180deg)' : 'none' }} />
                  : <CaretRight size={12} style={{ color:'var(--text-3)', flexShrink:0 }} />
                }
              </button>
              {form.hasSubs && isExpand && (
                <div style={{ background:'var(--surface-raised)' }}>
                  {MIDSTREAM_SUBS.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => onStart(sub.id)}
                      style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'var(--sp-2)',
                        padding:'0.5rem var(--sp-4) 0.5rem 2.75rem',
                        borderBottom:'1px solid var(--border-l)',
                        transition:'background var(--ease-fast)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--text-3)', flexShrink:0 }} />
                      <span style={{ flex:1, fontSize:'var(--fs-sm)', fontWeight:500, color:'var(--text-1)' }}>{sub.label}</span>
                      {sub.required && <span style={{ fontSize:'var(--fs-2xs)', color:'var(--red)', fontFamily:'var(--mono)', fontWeight:600 }}>REQ</span>}
                      <CaretRight size={10} style={{ color:'var(--text-4)', flexShrink:0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Report Forms page ───────────────────────────────────────────────────
export default function Forms() {
  const navigate    = useNavigate()
  const [branch,     setBranch]     = useState('lm')
  const [expandedId, setExpandedId] = useState(null)
  const [dbForms,    setDbForms]    = useState([])
  const [dbLoading,  setDbLoading]  = useState(true)

  // Pull live form catalog from Supabase
  useEffect(() => {
    db.from('form_definitions')
      .select('slug, title, short, description, category, branch, icon_name, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setDbForms(data)
        setDbLoading(false)
      })
      .catch(() => setDbLoading(false))
  }, [])

  const handleStart = (type) => navigate(`/forms/${type}`)

  // Build catalog from DB forms, filtering by branch (null = all branches)
  const branchForms = dbForms.filter(f => !f.branch || f.branch === branch)
  const dbCatalog = {
    completion: branchForms.filter(f => f.category === 'completion'),
    inspection: branchForms.filter(f => f.category === 'inspection'),
    survey:     branchForms.filter(f => f.category === 'survey'),
  }

  // Convert DB form to catalog card format
  const toCardForm = f => ({
    id: f.slug, label: f.title, desc: f.description || '', icon: Buildings,
  })

  // Fall back to hardcoded FORM_CATALOG if DB hasn't loaded yet
  const staticCatalog = FORM_CATALOG[branch]
  const catalog = dbLoading ? staticCatalog : {
    completion: dbCatalog.completion.length ? dbCatalog.completion.map(toCardForm) : staticCatalog.completion,
    inspection: dbCatalog.inspection.length ? dbCatalog.inspection.map(toCardForm) : staticCatalog.inspection,
    survey:     dbCatalog.survey.length     ? dbCatalog.survey.map(toCardForm)     : staticCatalog.survey,
  }

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ FIELD OVERVIEW ════════════════════════════════════════════════════ */}
        <SectionDivider title="Report Forms" label="Field Overview" accent="var(--navy)" />

        <BranchTabs active={branch} onChange={setBranch} />

        {/* 3-column category grid → 1-column on mobile */}
        <div className="form-catalog-grid">
          <CategoryCard title="Completion Reports" forms={catalog.completion} branch={branch} onStart={handleStart} expandedId={expandedId} onToggle={setExpandedId} />
          <CategoryCard title="Inspection Reports" forms={catalog.inspection} branch={branch} onStart={handleStart} expandedId={expandedId} onToggle={setExpandedId} />
          <CategoryCard title="Site Surveys"       forms={catalog.survey}     branch={branch} onStart={handleStart} expandedId={expandedId} onToggle={setExpandedId} />
        </div>

      </div>
    </div>
  )
}
