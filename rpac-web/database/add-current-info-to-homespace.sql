-- Add "Aktuell information" (Current Information) section to community homespaces
-- This allows community admins to post timely updates, announcements, or important information

-- Add the current_info column
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS current_info TEXT;

-- Add a timestamp for when current_info was last updated
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS current_info_updated_at TIMESTAMP WITH TIME ZONE;

-- Add a visibility toggle for current_info
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS show_current_info_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN community_homespaces.current_info IS 'Current announcements, updates, or important information (supports markdown)';
COMMENT ON COLUMN community_homespaces.current_info_updated_at IS 'When the current_info was last updated';
COMMENT ON COLUMN community_homespaces.show_current_info_public IS 'Whether to show current_info on the public homepage';

