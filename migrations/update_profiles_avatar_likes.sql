-- Migration: Add avatar_url and likes to profiles
-- Description: Adds avatar_url and likes_count to profiles table, and creates profile_likes table

-- 1. Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Create profile_likes table
CREATE TABLE IF NOT EXISTS profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, profile_id)
);

-- 3. Enable RLS on profile_likes
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for profile_likes
CREATE POLICY "Users can view all likes" ON profile_likes FOR SELECT USING (true);
CREATE POLICY "Users can like profiles" ON profile_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike profiles" ON profile_likes FOR DELETE USING (auth.uid() = user_id);

-- 5. Create function and trigger to sync likes_count
CREATE OR REPLACE FUNCTION update_profile_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET likes_count = likes_count + 1 WHERE id = NEW.profile_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET likes_count = likes_count - 1 WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_like_added
  AFTER INSERT ON profile_likes
  FOR EACH ROW EXECUTE PROCEDURE update_profile_likes_count();

CREATE TRIGGER on_profile_like_removed
  AFTER DELETE ON profile_likes
  FOR EACH ROW EXECUTE PROCEDURE update_profile_likes_count();
