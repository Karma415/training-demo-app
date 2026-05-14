ALTER TABLE notifications ADD COLUMN title text;
ALTER TABLE notifications ADD COLUMN content text;
ALTER TABLE notifications ADD COLUMN type text;
ALTER TABLE notifications ADD COLUMN read boolean default false;
ALTER TABLE notifications ADD COLUMN is_global boolean default false;
ALTER TABLE notifications ALTER COLUMN tenant_id DROP NOT NULL;
