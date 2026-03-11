-- Create activity_logs table for audit and user activity feeds
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL, -- e.g., 'profile_updated', 'project_created', 'bid_submitted'
  entity_type VARCHAR(100) NOT NULL, -- e.g., 'profile', 'project', 'bid', 'account'
  entity_id UUID, -- Optional: ID of the entity affected
  description TEXT, -- Human readable description
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert logs (since we use supabaseAdmin on server-side or auth.uid() on client-side)
CREATE POLICY "Users can insert their own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
