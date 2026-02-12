-- Enable RLS on project_assignments table if not already enabled
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admins_manage_assignments" ON project_assignments;
DROP POLICY IF EXISTS "users_view_assignments" ON project_assignments;
DROP POLICY IF EXISTS "creators_view_own_assignments" ON project_assignments;

-- Allow admins to do anything with assignments
CREATE POLICY "admins_manage_assignments"
  ON project_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow clients to view assignments for their own projects
CREATE POLICY "clients_view_own_assignments"
  ON project_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Allow creators to view assignments for their own projects
CREATE POLICY "creators_view_own_assignments"
  ON project_assignments
  FOR SELECT
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.client_id = auth.uid()
    )
  );
