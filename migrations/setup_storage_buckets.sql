-- Migration: Setup storage bucket 'assets' and RLS policies
-- Description: Creates the 'assets' bucket and configures access control

-- 1. Ensure the 'assets' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for the 'assets' bucket

-- Allow public read access to all objects in the 'assets' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Allow authenticated users to upload objects to the 'assets' bucket
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update or delete their own objects in the 'assets' bucket
CREATE POLICY "Owner Update and Delete Access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'assets' AND 
  auth.uid() = owner
);
