-- Migration to create habitability_rules table
create table if not exists habitability_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_citation text,
  repair_clock_hours integer,
  oversight_body text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table habitability_rules enable row level security;

-- RLS Policy: Allow anyone to view habitability rules
create policy "Habitability rules are viewable by everyone"
on habitability_rules for select
using (true);
