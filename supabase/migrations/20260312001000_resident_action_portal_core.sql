-- Migration for Resident Action Portal Core Tables

-- 1. Habitability Rules Table
-- Note: Modifying/Creating to match the new schema request
create table if not exists habitability_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- e.g., Plumbing, Heating
  issue_name text not null,
  legal_citation text,
  repair_clock_hours integer not null,
  oversight_body text,
  created_at timestamptz default now()
);

-- 2. Issues Table
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid not null references habitability_rules(id) on delete restrict,
  description text,
  status text check (status in ('pending', 'escalated', 'resolved')) default 'pending',
  created_at timestamptz default now(),
  deadline_at timestamptz
);

alter table issues add column if not exists rule_id uuid references habitability_rules(id) on delete restrict;

-- 3. Interactions Table
create type vibe_category as enum ('neutral', 'dismissive', 'hostile', 'illegal_entry');

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  staff_name text,
  location text,
  description text,
  vibe vibe_category default 'neutral',
  created_at timestamptz default now()
);

-- 4. Automatically calculate deadline_at
create or replace function calculate_issue_deadline()
returns trigger as $$
declare
  clock_hours integer;
begin
  select repair_clock_hours into clock_hours
  from habitability_rules
  where id = NEW.rule_id;

  if clock_hours is not null then
    NEW.deadline_at := NEW.created_at + (clock_hours || ' hours')::interval;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists issues_deadline_trigger on issues;
create trigger issues_deadline_trigger
before insert or update of rule_id on issues
for each row
execute function calculate_issue_deadline();

-- 5. Row Level Security (RLS)
alter table habitability_rules enable row level security;
alter table issues enable row level security;
alter table interactions enable row level security;

-- Policies for habitability_rules (Publicly readable)
drop policy if exists "Habitability rules are viewable by everyone" on habitability_rules;
create policy "Habitability rules are viewable by everyone"
on habitability_rules for select
using (true);

-- Policies for issues (Tenant-only)
drop policy if exists "Tenants can view their own issues" on issues;
create policy "Tenants can view their own issues"
on issues for select
using (auth.uid() = tenant_id);

drop policy if exists "Tenants can insert their own issues" on issues;
create policy "Tenants can insert their own issues"
on issues for insert
with check (auth.uid() = tenant_id);

drop policy if exists "Tenants can update their own issues" on issues;
create policy "Tenants can update their own issues"
on issues for update
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);

-- Policies for interactions (Tenant-only)
drop policy if exists "Tenants can view their own interactions" on interactions;
create policy "Tenants can view their own interactions"
on interactions for select
using (auth.uid() = tenant_id);

drop policy if exists "Tenants can insert their own interactions" on interactions;
create policy "Tenants can insert their own interactions"
on interactions for insert
with check (auth.uid() = tenant_id);

drop policy if exists "Tenants can update their own interactions" on interactions;
create policy "Tenants can update their own interactions"
on interactions for update
using (auth.uid() = tenant_id)
with check (auth.uid() = tenant_id);
