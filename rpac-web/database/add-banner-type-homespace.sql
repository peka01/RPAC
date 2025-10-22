-- ================================================================
-- ADD BANNER_TYPE COLUMN TO COMMUNITY_HOMESPACES
-- ================================================================
-- Created: 2024-10-22
-- Purpose: Add banner_type column to support gradient, image, and shield banner types
-- ================================================================

-- Add banner_type column with default 'gradient'
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS banner_type VARCHAR(20) DEFAULT 'gradient' 
CHECK (banner_type IN ('gradient', 'image', 'shield'));

-- First, update any existing rows with old pattern values to valid new ones
UPDATE community_homespaces
SET banner_pattern = 'olive-gradient'
WHERE banner_pattern IS NOT NULL 
  AND banner_pattern NOT IN ('olive-gradient', 'dark-olive', 'warm-olive', 'olive-mesh', 'olive-waves');

-- Update existing banner_pattern check constraint to include new patterns
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_homespaces_banner_pattern_check'
  ) THEN
    ALTER TABLE community_homespaces DROP CONSTRAINT community_homespaces_banner_pattern_check;
  END IF;

  -- Add updated check constraint with new patterns
  ALTER TABLE community_homespaces 
  ADD CONSTRAINT community_homespaces_banner_pattern_check 
  CHECK (banner_pattern IN ('olive-gradient', 'dark-olive', 'warm-olive', 'olive-mesh', 'olive-waves'));
END $$;

COMMENT ON COLUMN community_homespaces.banner_type IS 'Type of banner: gradient (color patterns), image (custom uploaded), or shield (BeReady logo)';
COMMENT ON COLUMN community_homespaces.banner_pattern IS 'Gradient pattern name when banner_type is gradient';

