-- Fix RLS for project_routing
-- This table was missing policies, which blocked both businesses from inviting and vendors from requesting

-- 1. Enable RLS (already enabled but good to ensure)
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors can view their own routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors can insert their own interest" ON project_routing;
DROP POLICY IF EXISTS "Vendors can update their own routing" ON project_routing;
DROP POLICY IF EXISTS "Businesses can view routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses can invite vendors to their projects" ON project_routing;

-- 3. Define new policies

-- Admin Policy
CREATE POLICY "Admins can manage all routing" ON project_routing
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Vendor Policies
CREATE POLICY "Vendors can view their own routing" ON project_routing
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert their own interest" ON project_routing
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their own routing" ON project_routing
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

-- Business Policies
CREATE POLICY "Businesses can view routing for their projects" ON project_routing
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_routing.project_id
    AND projects.business_id = auth.uid()
  ));

CREATE POLICY "Businesses can invite vendors to their projects" ON project_routing
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.business_id = auth.uid()
  ));

-- 4. Fix RLS for vendor_responses to allow businesses to accept bids
-- The previous policy only allowed vendors to update their bids
DROP POLICY IF EXISTS "Vendors can update their bids" ON vendor_responses;

CREATE POLICY "Vendors and businesses can update bids" ON vendor_responses
  FOR UPDATE TO authenticated
  USING (
    vendor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.business_id = auth.uid())
  );

-- 5. Fix RLS for project_activity (missing policies)
DROP POLICY IF EXISTS "Anyone involved in project can view activity" ON project_activity;
DROP POLICY IF EXISTS "Anyone involved can insert activity" ON project_activity;

CREATE POLICY "Anyone involved in project can view activity" ON project_activity
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND (p.business_id = auth.uid() OR p.selected_vendor_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM project_routing pr
      WHERE pr.project_id = project_id AND pr.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Anyone involved can insert activity" ON project_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 6. Fix RLS for project_messages (missing policies)
DROP POLICY IF EXISTS "Anyone involved in project can view messages" ON project_messages;
DROP POLICY IF EXISTS "Anyone involved can insert messages" ON project_messages;

CREATE POLICY "Anyone involved in project can view messages" ON project_messages
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND (p.business_id = auth.uid() OR p.selected_vendor_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM project_routing pr
      WHERE pr.project_id = project_id AND pr.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Anyone involved can insert messages" ON project_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- 7. Fix RLS for projects (allow admins to manage)
DROP POLICY IF EXISTS "Businesses can update their own projects" ON projects;
CREATE POLICY "Businesses and admins can update projects" ON projects
  FOR UPDATE TO authenticated
  USING (business_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Businesses can delete their own projects" ON projects;
CREATE POLICY "Businesses and admins can delete projects" ON projects
  FOR DELETE TO authenticated
  USING (business_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 8. Fix RLS for profiles (allow admins to manage)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 9. Grant access to service_categories and coverage_areas
DROP POLICY IF EXISTS "Authenticated users can view service categories" ON service_categories;
CREATE POLICY "Authenticated users can view service categories" ON service_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view coverage areas" ON coverage_areas;
CREATE POLICY "Authenticated users can view coverage areas" ON coverage_areas
  FOR SELECT TO authenticated USING (true);
