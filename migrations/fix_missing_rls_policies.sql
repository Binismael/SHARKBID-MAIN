-- Fix RLS for project_routing (FINAL REFINED VERSION)
-- This migration fixes the "new row violates row-level security policy" error by providing explicit
-- permissions for SELECT, INSERT, and UPDATE which are required for Upsert operations.

-- 1. Ensure RLS is enabled
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all routing" ON project_routing;
DROP POLICY IF EXISTS "Admins_routing_all" ON project_routing;
DROP POLICY IF EXISTS "Vendors can view their own routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors_routing_select" ON project_routing;
DROP POLICY IF EXISTS "Vendors can insert their own interest" ON project_routing;
DROP POLICY IF EXISTS "Vendors_routing_insert" ON project_routing;
DROP POLICY IF EXISTS "Vendors can update their own routing" ON project_routing;
DROP POLICY IF EXISTS "Vendors_routing_update" ON project_routing;
DROP POLICY IF EXISTS "Businesses can view routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses_routing_select" ON project_routing;
DROP POLICY IF EXISTS "Businesses can invite vendors to their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses_routing_insert" ON project_routing;
DROP POLICY IF EXISTS "Businesses can update routing for their projects" ON project_routing;
DROP POLICY IF EXISTS "Businesses_routing_update" ON project_routing;
DROP POLICY IF EXISTS "Businesses can manage routing for their projects" ON project_routing;

-- 3. Define Admin Policies for project_routing (Robust: checks JWT and profiles table)
CREATE POLICY "Admins_routing_all" ON project_routing
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. Define Vendor Policies for project_routing
CREATE POLICY "Vendors_routing_select" ON project_routing
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors_routing_insert" ON project_routing
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors_routing_update" ON project_routing
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

-- 5. Define Business Policies for project_routing (Explicit Upsert support)
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

-- 6. Fix RLS for vendor_responses (accepting bids)
DROP POLICY IF EXISTS "Vendors can view their own bids" ON vendor_responses;
DROP POLICY IF EXISTS "Vendors can submit bids" ON vendor_responses;
DROP POLICY IF EXISTS "Vendors can update their bids" ON vendor_responses;
DROP POLICY IF EXISTS "Vendors and businesses can update bids" ON vendor_responses;
DROP POLICY IF EXISTS "Admins can manage all bids" ON vendor_responses;

CREATE POLICY "Responses_select" ON vendor_responses
  FOR SELECT TO authenticated
  USING (
    vendor_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Vendors_submit_responses" ON vendor_responses
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors_businesses_update_responses" ON vendor_responses
  FOR UPDATE TO authenticated
  USING (
    vendor_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- 7. Fix RLS for project_activity and project_messages
DROP POLICY IF EXISTS "Anyone involved in project can view activity" ON project_activity;
DROP POLICY IF EXISTS "Anyone involved can insert activity" ON project_activity;
DROP POLICY IF EXISTS "Anyone involved in project can view messages" ON project_messages;
DROP POLICY IF EXISTS "Anyone involved can insert messages" ON project_messages;

CREATE POLICY "Activity_select" ON project_activity
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM project_routing WHERE project_id = project_activity.project_id AND vendor_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Activity_insert" ON project_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Messages_select" ON project_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE business_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM project_routing WHERE project_id = project_messages.project_id AND vendor_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Messages_insert" ON project_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- 8. Fix RLS for projects
DROP POLICY IF EXISTS "Businesses can view their own projects" ON projects;
DROP POLICY IF EXISTS "Businesses can create projects" ON projects;
DROP POLICY IF EXISTS "Businesses can update their own projects" ON projects;
DROP POLICY IF EXISTS "Anyone involved in project can view" ON projects;
DROP POLICY IF EXISTS "Businesses and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Businesses and admins can delete projects" ON projects;

CREATE POLICY "Projects_select" ON projects
  FOR SELECT TO authenticated
  USING (
    business_id = auth.uid() OR
    selected_vendor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_routing WHERE project_id = projects.id AND vendor_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (
    business_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- 9. Fix RLS for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p2 WHERE p2.user_id = auth.uid() AND p2.role = 'admin'));

-- 10. Grant access to metadata tables
DROP POLICY IF EXISTS "Authenticated users can view service categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can view coverage areas" ON coverage_areas;
CREATE POLICY "Metadata_services_select" ON service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Metadata_coverage_select" ON coverage_areas FOR SELECT TO authenticated USING (true);
