export interface SubIssue {
  id: string;
  label: string;
  repairClockHours: number;
  oversightBody: string;
  legalCitation: string;
}

export interface IssueCategoryConfig {
  id: string;
  label: string;
  subIssues: SubIssue[];
}

export const ISSUE_CATEGORIES: IssueCategoryConfig[] = [
  {
    id: 'heating_ventilation',
    label: '🔥 1. Heating, Hot Water & Ventilation',
    subIssues: [
      { id: 'no_heat', label: 'No working heat', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'no_hot_water', label: 'No hot water or inconsistent hot water', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'broken_heater', label: 'Broken or unsafe heating units', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'poor_ventilation', label: 'Inadequate ventilation/nonfunctioning fans', repairClockHours: 336, oversightBody: 'DBI', legalCitation: 'SF Building Code § 1203' }
    ]
  },
  {
    id: 'plumbing_water',
    label: '🚰 2. Plumbing & Water Systems',
    subIssues: [
      { id: 'leaks', label: 'Leaks from ceiling, walls, pipes', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'broken_toilet', label: 'Clogged or non-functioning toilets', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 505' },
      { id: 'no_water', label: 'No cold or hot running water', repairClockHours: 24, oversightBody: 'DPH', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'sewage', label: 'Sewage backups or slow drainage', repairClockHours: 24, oversightBody: 'DPH', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'contaminated_water', label: 'Rust-colored or contaminated water', repairClockHours: 24, oversightBody: 'DPH', legalCitation: 'CA Health & Safety Code § 116270' }
    ]
  },
  {
    id: 'electrical_lighting',
    label: '⚡ 3. Electrical & Lighting',
    subIssues: [
      { id: 'exposed_wiring', label: 'Exposed wiring or unsafe electrical', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'CA Civil Code § 1941.1(e)' },
      { id: 'sparking_outlets', label: 'Outlets that spark or overheat', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'CA Civil Code § 1941.1(e)' },
      { id: 'insufficient_lighting', label: 'Insufficient lighting/broken fixtures', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'power_outages', label: 'Overloaded circuits/frequent outages', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' }
    ]
  },
  {
    id: 'structural',
    label: '🧱 4. Structural Integrity & Weatherproofing',
    subIssues: [
      { id: 'cracked_ceilings', label: 'Cracked, unstable, or sagging ceilings/walls', repairClockHours: 336, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'water_intrusion', label: 'Water intrusion from roof/walls', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'holes', label: 'Holes in walls or floors', repairClockHours: 336, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'unstable_stairs', label: 'Unstable stairways or railings', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' }
    ]
  },
  {
    id: 'pests',
    label: '🐀 5. Pests & Vermin',
    subIssues: [
      { id: 'rodents', label: 'Rodents (rats, mice)', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code Art. 11' },
      { id: 'roaches', label: 'Cockroaches', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code Art. 11' },
      { id: 'bedbugs', label: 'Bedbugs', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code Art. 11' },
      { id: 'other_pests', label: 'Flies, fleas, or other infestations', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code Art. 11' }
    ]
  },
  {
    id: 'security_safety',
    label: '🔐 6. Security & Safety',
    subIssues: [
      { id: 'broken_unit_locks', label: 'Broken locks on unit doors', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'SF Administrative Code 37.10B' },
      { id: 'broken_building_locks', label: 'Broken locks on building entry doors', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'SF Administrative Code 37.10B' },
      { id: 'intercom', label: 'Non-functioning intercom/buzzer', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'blocked_escapes', label: 'Fire escapes blocked or inaccessible', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'SF Fire Code' }
    ]
  },
  {
    id: 'sanitation',
    label: '🧼 7. Sanitation & Cleanliness (Shared Areas)',
    subIssues: [
      { id: 'dirty_bathrooms', label: 'Bathrooms not cleaned/maintained', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code' },
      { id: 'broken_fixtures', label: 'Broken shared bathroom fixtures', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'trash', label: 'Trash accumulation in hallways', repairClockHours: 72, oversightBody: 'DPH', legalCitation: 'SF Health Code' },
      { id: 'mold_shared', label: 'Mold in shared showers/bathrooms', repairClockHours: 720, oversightBody: 'DPH', legalCitation: 'Health & Safety Code § 17920.3' }
    ]
  },
  {
    id: 'fire_safety',
    label: '🧯 8. Fire Safety & Emergency Systems',
    subIssues: [
      { id: 'no_smoke_detector', label: 'Missing/non-working smoke detectors', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'CA Health & Safety Code' },
      { id: 'no_fire_alarm', label: 'No fire alarms or non-functional alarms', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'SF Fire Code' },
      { id: 'blocked_exits', label: 'Blocked fire exits or hallways', repairClockHours: 24, oversightBody: 'SFFD', legalCitation: 'SF Fire Code' },
      { id: 'expired_extinguishers', label: 'Missing/expired fire extinguishers', repairClockHours: 72, oversightBody: 'SFFD', legalCitation: 'SF Fire Code' }
    ]
  },
  {
    id: 'windows_doors',
    label: '🪟 9. Windows, Doors & Weather Protection',
    subIssues: [
      { id: 'broken_windows', label: 'Broken windows', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'drafts', label: 'Drafts due to poor sealing', repairClockHours: 336, oversightBody: 'DBI', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'doors_wont_seal', label: 'Doors that don’t latch or seal', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' }
    ]
  },
  {
    id: 'sro_specific',
    label: '🛏️ 10. Room-Specific SRO Issues',
    subIssues: [
      { id: 'mold_dampness', label: 'Condensation/Mold', repairClockHours: 720, oversightBody: 'DPH', legalCitation: 'Health & Safety Code § 17920.3' },
      { id: 'overheating', label: 'Overheating due to lack of airflow', repairClockHours: 336, oversightBody: 'DPH', legalCitation: 'SF Health Code' },
      { id: 'privacy', label: 'Lack of privacy (broken locks/gaps)', repairClockHours: 72, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 701' },
      { id: 'illegal_entry', label: 'Management entering without 24h notice', repairClockHours: 24, oversightBody: 'Rent Board', legalCitation: 'CA Civil Code § 1954' }
    ]
  },
  {
    id: 'building_wide',
    label: '🏢 11. Building-Wide Issues',
    subIssues: [
      { id: 'elevator', label: 'Elevator outages', repairClockHours: 24, oversightBody: 'DBI', legalCitation: 'SF Housing Code § 602' },
      { id: 'water_shutoffs', label: 'Water shutoffs without proper notice', repairClockHours: 24, oversightBody: 'DPH', legalCitation: 'CA Civil Code § 1941.1' },
      { id: 'hazards', label: 'Hazardous materials (asbestos, lead)', repairClockHours: 24, oversightBody: 'DPH', legalCitation: 'CA Health & Safety Code' },
      { id: 'manager_info', label: 'Lack of posted manager contact info', repairClockHours: 336, oversightBody: 'DBI', legalCitation: 'SF Housing Code' }
    ]
  },
  {
    id: 'admin_legal',
    label: '📑 12. Administrative & Legal Violations',
    subIssues: [
      { id: 'no_repair_response', label: 'Failure to respond to repair requests', repairClockHours: 72, oversightBody: 'Rent Board', legalCitation: 'SF Admin Code Chapter 37' },
      { id: 'retaliation', label: 'Retaliation after complaints', repairClockHours: 24, oversightBody: 'Rent Board', legalCitation: 'CA Civil Code § 1942.5' },
      { id: 'harassment', label: 'Staff Harassment / Intimidation', repairClockHours: 24, oversightBody: 'Rent Board', legalCitation: 'SF Admin Code § 37.10B' }
    ]
  }
];
