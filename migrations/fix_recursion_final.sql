-- FIX INFINITE RECURSION IN RLS POLICIES
-- This migration breaks the circular dependency between projects and project_routing

-- 1. Disable RLS temporarily to clean up (optional but safer)
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_routing DISABLE ROW LEVEL SECURITY;

-- 2. Drop the problematic policies
DROP POLICY IF EXISTS "projects_select_access" ON projects;
DROP POLICY IF EXISTS "routing_all_access" ON project_routing;
DROP POLICY IF EXISTS "rt_select_v3" ON project_routing;
DROP POLICY IF EXISTS "pj_select_v3" ON projects;
DROP POLICY IF EXISTS "rt_manage_v3" ON project_routing;

-- 3. Create NEW non-recursive policies for project_routing
-- We allow all authenticated users to SELECT from project_routing.
-- This is safe because it only contains UUIDs and status, and it breaks the recursion.
CREATE POLICY "routing_select_final" ON project_routing 
  FOR SELECT TO authenticated 
  USING (true);

-- Businesses can manage routing for their own projects
-- Vendors can manage their own routing records (e.g. update status to 'interested')
CREATE POLICY "routing_manage_final" ON project_routing 
  FOR ALL TO authenticated
  USING (
    vendor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_routing.project_id 
      AND projects.business_id = auth.uid()
    ) OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    vendor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_routing.project_id 
      AND projects.business_id = auth.uid()
    ) OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- 4. Create NEW non-recursive policies for projects
-- Businesses see their own, vendors see what's routed to them, admins see all
CREATE POLICY "projects_select_final" ON projects 
  FOR SELECT TO authenticated
  USING (
    business_id = auth.uid() OR
    selected_vendor_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    id IN (
      SELECT project_id FROM project_routing 
      WHERE vendor_id = auth.uid()
    )
  );

-- 5. Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;

-- 6. Ensure other tables are also fixed if needed
-- profiles recursion fix: avoid SELECT 1 FROM profiles inside the policy
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_read" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );
