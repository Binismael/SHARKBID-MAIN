-- ULTIMATE RLS FIX
-- Run this in Supabase SQL Editor to resolve the 403 (Forbidden) error on invitations

-- 1. SCHEMA FIX: Add missing column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected_vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Ensure RLS is enabled for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- 3. Clean up ALL existing policies on these tables to prevent conflicts
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'projects', 'project_routing', 'vendor_responses', 'project_activity', 'project_messages', 'service_categories', 'coverage_areas'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 4. PROFILES: Allow everyone to read, but only owner or admin to modify
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_write_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. PROJECTS: Allow business owner, assigned vendor, or admin to read/write
CREATE POLICY "projects_select_access" ON projects FOR SELECT TO authenticated
USING (
  business_id = auth.uid() OR
  selected_vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM project_routing WHERE project_id = projects.id AND vendor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "projects_insert_access" ON projects FOR INSERT TO authenticated
WITH CHECK (business_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "projects_update_access" ON projects FOR UPDATE TO authenticated
USING (business_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- 6. PROJECT_ROUTING: Crucial fix for "Invite to Project"
-- Allows Businesses to manage routing for their projects, Vendors to see their leads, and Admins to see all
CREATE POLICY "routing_all_access" ON project_routing FOR ALL TO authenticated
USING (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 7. VENDOR_RESPONSES: Bids management
CREATE POLICY "bids_all_access" ON vendor_responses FOR ALL TO authenticated
USING (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 8. ACTIVITY & MESSAGES
CREATE POLICY "activity_access" ON project_activity FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "messages_access" ON project_messages FOR ALL TO authenticated
USING (
  sender_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND business_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 9. METADATA: Read-only access for all authenticated users
CREATE POLICY "meta_select_services" ON service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "meta_select_coverage" ON coverage_areas FOR SELECT TO authenticated USING (true);

-- 10. FINAL GRANTS (Ensures the database roles have permission to execute the queries)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
