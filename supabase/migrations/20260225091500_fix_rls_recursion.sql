-- =====================================================
-- FIX: INFINITE RECURSION IN TENANTS POLICY
-- =====================================================

-- 1. Drop all potentially recursive policies on the tenants table
-- Note: Replace these names if they differ on your server
DROP POLICY IF EXISTS "Tenant can view own profile" ON tenants;
DROP POLICY IF EXISTS "Tenant can update own profile" ON tenants;
DROP POLICY IF EXISTS "Tenant can insert own profile" ON tenants;
DROP POLICY IF EXISTS "view_co_tenants" ON tenants; -- Common source of recursion

-- 2. Create clean, non-recursive policies
-- This policy only uses auth.uid() and does not perform any subqueries on the tenants table itself.
CREATE POLICY "Tenant can view own profile"
ON tenants FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Tenant can update own profile"
ON tenants FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Tenant can insert own profile"
ON tenants FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Verify RLS is enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
