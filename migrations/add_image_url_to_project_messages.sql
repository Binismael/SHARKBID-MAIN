-- Migration: Add image_url column to project_messages table
-- Description: Allows storing image URLs in project messages

ALTER TABLE project_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN project_messages.image_url IS 'URL to image attachment for this message';
