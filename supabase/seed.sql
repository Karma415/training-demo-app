-- Seed data for habitability_rules table (Resident Action Portal)
insert into habitability_rules (category, issue_name, legal_citation, repair_clock_hours, oversight_body)
values 
  ('Heating', 'No Heat', 'SF Housing Code § 701', 24, 'DBI'),
  ('Sanitation', 'Rodents/Roaches', 'SF Health Code Art. 11', 72, 'DPH'),
  ('Safety', 'Mold & Dampness', 'Health & Safety Code § 17920.3', 720, 'DBI')
on conflict do nothing;
