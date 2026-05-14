-- =====================================================
-- EXTENSIONS
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

create type tenant_status as enum (
  'current_resident',
  'moved_out',
  'eviction_pending'
);

create type issue_status as enum (
  'reported',
  'pending',
  'in_progress',
  'resolved',
  'stalled'
);

create type management_method as enum (
  'written_request',
  'verbal',
  'phone',
  'work_order'
);

create type interaction_type as enum (
  'in_person',
  'phone_call',
  'voicemail',
  'email',
  'text_message'
);

create type task_status as enum (
  'to_do',
  'pending',
  'in_progress',
  'done'
);

create type urgency_level as enum (
  'very_high',
  'high',
  'medium',
  'low'
);

create type notification_status as enum (
  'pending',
  'completed',
  'canceled'
);

-- =====================================================
-- BUILDINGS (Global Table)
-- =====================================================

create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz default now()
);

-- Note: buildings is a global table shared across tenants. No RLS.

-- =====================================================
-- TENANTS
-- =====================================================

create table tenants (
  id uuid primary key references auth.users(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete restrict,
  first_name text,
  last_name text,
  unit_number integer,
  birthday date,
  email text,
  phone text,
  status tenant_status default 'current_resident',
  birthday_opt_in boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- ISSUES
-- =====================================================

create table issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  building_id uuid references buildings(id),
  category text[] not null,
  description text,
  date_reported date,
  management_method management_method,
  management_response text,
  status issue_status default 'reported',
  deadline date,
  created_at timestamptz default now()
);

create index idx_issues_tenant on issues(tenant_id);

-- =====================================================
-- INTERACTIONS
-- =====================================================

create table interactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  issue_id uuid references issues(id) on delete cascade,
  interaction_type interaction_type,
  topic text[],
  staff_name text,
  staff_role text,
  summary text,
  detailed_notes text,
  promise_made boolean default false,
  promise_details text,
  follow_up_date date,
  created_at timestamptz default now()
);

create index idx_interactions_tenant on interactions(tenant_id);

-- =====================================================
-- LEGAL NOTICES
-- =====================================================

create table legal_notices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  issue_id uuid references issues(id),
  notice_type text,
  content text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index idx_legal_notices_tenant on legal_notices(tenant_id);

-- =====================================================
-- TASKS
-- =====================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  issue_id uuid references issues(id),
  description text,
  due_date date,
  status task_status default 'to_do',
  completed boolean default false,
  created_at timestamptz default now()
);

create index idx_tasks_tenant on tasks(tenant_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  urgency urgency_level,
  purpose text,
  scheduled_date date,
  sender text,
  status notification_status default 'pending',
  notes text,
  created_at timestamptz default now()
);

create index idx_notifications_tenant on notifications(tenant_id);

-- =====================================================
-- AGENCIES (Global Table)
-- =====================================================

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_contact text,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- Note: agencies is a global table. RLS is not required unless tied to specific tenants.

-- =====================================================
-- EVIDENCE FILES
-- =====================================================

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  issue_id uuid references issues(id) on delete cascade,
  file_path text not null,
  uploaded_at timestamptz default now()
);

create index idx_evidence_tenant on evidence_files(tenant_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table tenants enable row level security;
alter table issues enable row level security;
alter table interactions enable row level security;
alter table legal_notices enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table evidence_files enable row level security;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- TENANTS
create policy "Tenant can view own profile"
on tenants for select
using (auth.uid() = id);

create policy "Tenant can update own profile"
on tenants for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Tenant can insert own profile"
on tenants for insert
with check (auth.uid() = id);

-- ISSUES
create policy "Tenant owns issues"
on issues for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- INTERACTIONS
create policy "Tenant owns interactions"
on interactions for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- LEGAL NOTICES
create policy "Tenant owns legal notices"
on legal_notices for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- TASKS
create policy "Tenant owns tasks"
on tasks for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- NOTIFICATIONS
create policy "Tenant owns notifications"
on notifications for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- EVIDENCE FILES
create policy "Tenant owns evidence"
on evidence_files for all
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);
