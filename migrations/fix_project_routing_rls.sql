-- Fix RLS for project_routing (REFINED)
-- This version simplifies subqueries and ensures upsert (INSERT + UPDATE) works for businesses

-- 1. Ensure RLS is enabled
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all routing" ON project_routing;
DROP POLICY IF EXISTS "Admins manage all routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors can view their own routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors can insert their own interest" ON project_routing;
DROP POLICY IF EXISTS "Vendors can update their own routing" ON project_routing;
DROP POLICY IF EXISTS "Businesses can view routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses can invite vendors to their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses can update routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses can manage routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses can select routing" ON project_routing;
DROP POLICY IF EXISTS "Businesses can insert routing" ON project_routing;
DROP POLICY IF EXISTS "Businesses can update routing" ON project_routing;

-- 3. Define Admin Policy (Most robust check)
CREATE POLICY "Admins_routing_all" ON project_routing
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'))
  );

-- 4. Define Vendor Policies
CREATE POLICY "Vendors_routing_select" ON project_routing
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors_routing_insert" ON project_routing
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors_routing_update" ON project_routing
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

-- 5. Define Business Policies (Splitting operations for better Upsert support)
-- Business must be able to SELECT, INSERT, and UPDATE their own project's routing

CREATE POLICY "Businesses_routing_select" ON project_routing
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid())
  );

CREATE POLICY "Businesses_routing_insert" ON project_routing
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid())
  );

CREATE POLICY "Businesses_routing_update" ON project_routing
  FOR UPDATE TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid())
  );

-- 6. Add DELETE policy for admins/businesses (optional but good for completeness)
CREATE POLICY "Admins_businesses_routing_delete" ON project_routing
  FOR DELETE TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')) OR
    (project_id IN (SELECT id FROM projects WHERE business_id = auth.uid()))
  );
