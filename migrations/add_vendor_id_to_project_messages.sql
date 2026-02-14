-- Add vendor_id to project_messages to better track conversations
ALTER TABLE project_messages 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN project_messages.vendor_id IS 'The vendor this message thread is associated with';

-- Update existing messages to set vendor_id based on vendor_response_id
UPDATE project_messages pm
SET vendor_id = vr.vendor_id
FROM vendor_responses vr
WHERE pm.vendor_response_id = vr.id
AND pm.vendor_id IS NULL;
