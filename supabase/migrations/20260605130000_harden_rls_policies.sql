-- Security Hardening: Drop unsafe building-wide sharing RLS policies to prevent tenants from viewing or modifying other tenants' evidence, interactions, tasks, or legal notices.
DROP POLICY IF EXISTS "Tenant can view evidence in their building" ON public.evidence_files;
DROP POLICY IF EXISTS "Tenant can upload evidence to their building issues" ON public.evidence_files;
DROP POLICY IF EXISTS "Tenant can view interactions in their building" ON public.interactions;
DROP POLICY IF EXISTS "tenant_create_interactions" ON public.interactions;
DROP POLICY IF EXISTS "tenant_delete_interactions" ON public.interactions;
DROP POLICY IF EXISTS "tenant_update_interactions" ON public.interactions;
DROP POLICY IF EXISTS "tenant_view_tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tenants can view relevant legal notices" ON public.legal_notices;
