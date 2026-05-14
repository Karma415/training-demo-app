


export type IssueStatus = 'Reported' | 'Pending' | 'In-Progress' | 'Resolved' | 'Stalled' | 'Escalated';

export type IssueCategory = 'Pest' | 'Elevator' | 'Plumbing' | 'Security' | 'Harassment' | 'Electrical' | 'Mold/Mildew' | 'Medical Issue' | 'Other';

export type ManagementMethod = 'Written Request' | 'Verbal' | 'Phone' | 'Work Order';

export interface HabitabilityRule {
  id: string;
  category: string;
  issue_name: string;
  legal_citation?: string;
  repair_clock_hours: number;
  oversight_body?: string;
  created_at?: string;
}
export type UserRole = 'tenant' | 'resident' | 'admin' | 'superadmin' | 'legal_counsel';
export interface Tenant {
  id: string;
  supabaseId?: string; // Link to Supabase Auth
  name: string;
  firstName?: string;
  lastName?: string;
  unit: string;
  email: string;
  phone?: string;
  status?: string;
  monthlyRent?: number;
  moveInDate?: string;
  leaseAnalyzed?: boolean;
  leaseSummary?: string;
  role?: UserRole;
  avatarUrl?: string;
  requestsAttorney?: boolean;
  temporaryUnit?: string;
  temporaryMoveInDate?: string;
  temporaryMoveOutDate?: string;
  is_lightweight?: boolean;
}

export interface Evidence {
  id: string;
  url: string;
  timestamp: string;
  type: 'photo' | 'document';
  caption?: string;
}

export interface Issue {
  id: string;
  tenantId?: string;
  tenantUID?: string; // Supabase ID for strict isolation
  category: any; // Kept as any or IssueCategory[] for backwards compatibility
  ruleId?: string;
  rule?: HabitabilityRule; // Joined data
  description: string;
  managementMethod: ManagementMethod;
  managementResponse?: string;
  dateStarted: string;
  status: IssueStatus;
  daysSinceReported: number;
  hasGivenNotice: boolean;
  photoUrl?: string; // Still useful for UI
  evidence: Evidence[];
  escalationLevel: number;
  lastAction?: string;
  nextAction?: string;
  deadline?: string;
  repairDeadline?: string;
  daysRemaining?: number;
  floor?: number;
  unit?: string;
}
// ... (lines 56-104) ... 
export interface InteractionLogEntry {
    id: string;
    tenantId: string;
    interactionType: InteractionType;
    location: string;
    staffName: string;
    staffTitle: string;
    staffRole?: string;
    staff_name?: string;
    event_type?: string;
    summary: string;
    detailedNotes: string;
    interactionCategory: string[] | string;
    promiseMadeStatus: 'Yes' | 'No';
    promiseMadeDetails: string;
    expectedFollowUpDates: string;
    relatedIssueId?: string;
    timestamp: string;
    isResolved?: boolean;
    resolutionDetails?: string;
    resolvedDate?: string;
}

export interface BuildingViolation {
  id: string;
  address: string;
  date: string;
  category: string;
  status: string;
  description: string;
}

export interface LoungeMessage {
  id: string;
  author: string;
  unit: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface LegalNotice {
  id: string;
  issuedBy: 'The Pierre Hotel' | 'THC-Tenderloin Housing Clinic' | 'Tenant' | 'Oversight Organization' | 'Other';
  relatedIssueId?: string;
  tenantUID?: string; // Added for isolation (Supabase ID)
  recipient: 'HSH' | 'DBI - Dept of Bldg Inspection' | 'DPH - Dept of Public Health' | 'S.F. Rent Board' | 'THC' | 'The Pierre Management/Staff' | 'Other';
  dateSent: string;
  copyUrl?: string;
  content?: string;
  status: 'Draft' | 'Sent' | 'Delivered' | 'Action Needed';
  templateType?: string;
}

export interface LegalRecommendation {
  title: string;
  description: string;
  isAlert?: boolean;
  link?: {
    text: string;
    url: string;
  };
  type: 'emergency' | 'dbi' | 'harassment' | 'repairdeduct' | 'rentboard';
}

export interface ReliefResource {
  id: string;
  name: string;
  category: 'Government' | 'Faith-Based' | 'Community';
  description: string;
  contact: string;
  website: string;
  bestFor: string;
}

// Added missing exported types for components
export interface Communication {
  id: string;
  date: string;
  type: 'Call' | 'In-Person' | 'Email' | 'Text' | 'Recording';
  contactPerson: string;
  summary: string;
  hasRecording?: boolean;
}

export type InteractionType = 'In-Person' | 'Maintenance Visit' | 'Office Visit' | 'Phone' | 'Email' | 'Letter' | 'Text' | 'Other' | 'system_event';

export interface BuildingRedactedIssue {
  id: string;
  floor?: number;
  category: IssueCategory;
  status: IssueStatus;
  dateStarted: string;
}

export interface DBIComplaint {
  id: string;
  complaintNumber: string;
  dateFiled: string;
  inspectorName: string;
  status: 'Open' | 'NOV Issued' | 'Closed' | 'Abated';
  findings: string;
}

export interface CollectiveTemplate {
  id: string;
  title: string;
  description: string;
  legalBasis: string;
}

export interface LegalResource {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  website: string;
  lat: number;
  lng: number;
  description: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'update' | 'message';
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  urgency: 'High' | 'Medium' | 'Low';
  purpose: string;
  sender?: string;
  status: string;
}

export interface Todo {
  id: string;
  task: string;
  tenantName?: string;
  tenantUID?: string; // Added for isolation (Supabase ID)
  relatedIssueId?: string;
  date: string;
  status: 'To-Do' | 'In-Progress' | 'Done';
  completed: boolean;
  deadline?: string;
  notes?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  meeting_link?: string;
  location?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  is_all_day?: boolean;
  description?: string;
  tenant_uid?: string;
  approved_by_admin: boolean;
  is_global: boolean;
  urgency?: string;
  created_at: string;
}

export interface FloorPlanUnit {
  id: string; // e.g. "305"
  unitNumber: string; // e.g. "305"
  floor: number; // e.g. 3
  verticalStack: string; // e.g. "05" matching 205, 305, 405...
  isResidential: boolean; // false for supportive housing office
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface BuildingFloorPlan {
  floor: number;
  units: FloorPlanUnit[];
}
