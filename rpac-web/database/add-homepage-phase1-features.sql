-- ================================================================
-- ADD HOMEPAGE PHASE 1 FEATURES
-- ================================================================
-- Created: 2024-10-22
-- Purpose: Add contact info, logo, gallery, events, and section ordering
-- ================================================================

-- Add new columns to community_homespaces
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_address TEXT,
ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_other TEXT,
ADD COLUMN IF NOT EXISTS show_contact_section BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '["current_info", "about", "gallery", "events", "resources", "preparedness", "activities", "skills", "membership"]'::jsonb;

-- Create gallery images table
CREATE TABLE IF NOT EXISTS community_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES local_communities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_community FOREIGN KEY (community_id) REFERENCES local_communities(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES local_communities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'weekly', 'monthly', etc.
  show_on_homepage BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_community FOREIGN KEY (community_id) REFERENCES local_communities(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_community ON community_gallery_images(community_id);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON community_gallery_images(community_id, display_order);
CREATE INDEX IF NOT EXISTS idx_events_community ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON community_events(community_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_homepage ON community_events(community_id, show_on_homepage) WHERE show_on_homepage = true;

-- Enable RLS on new tables
ALTER TABLE community_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

-- Gallery images policies
DROP POLICY IF EXISTS "Public can view gallery images" ON community_gallery_images;
CREATE POLICY "Public can view gallery images"
  ON community_gallery_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_homespaces ch
      WHERE ch.community_id = community_gallery_images.community_id
      AND ch.published = true
    )
  );

DROP POLICY IF EXISTS "Community admins can manage gallery" ON community_gallery_images;
CREATE POLICY "Community admins can manage gallery"
  ON community_gallery_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM local_communities lc
      WHERE lc.id = community_gallery_images.community_id
      AND lc.created_by = auth.uid()
    )
  );

-- Events policies
DROP POLICY IF EXISTS "Public can view published events" ON community_events;
CREATE POLICY "Public can view published events"
  ON community_events FOR SELECT
  USING (
    show_on_homepage = true AND
    EXISTS (
      SELECT 1 FROM community_homespaces ch
      WHERE ch.community_id = community_events.community_id
      AND ch.published = true
    )
  );

DROP POLICY IF EXISTS "Community admins can manage events" ON community_events;
CREATE POLICY "Community admins can manage events"
  ON community_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM local_communities lc
      WHERE lc.id = community_events.community_id
      AND lc.created_by = auth.uid()
    )
  );

-- Comments
COMMENT ON COLUMN community_homespaces.logo_url IS 'Community logo image URL (separate from banner)';
COMMENT ON COLUMN community_homespaces.contact_email IS 'Public contact email address';
COMMENT ON COLUMN community_homespaces.contact_phone IS 'Public contact phone number';
COMMENT ON COLUMN community_homespaces.contact_address IS 'Meeting location or community address';
COMMENT ON COLUMN community_homespaces.section_order IS 'JSON array defining the order of homepage sections';
COMMENT ON TABLE community_gallery_images IS 'Photo gallery images for community homepages';
COMMENT ON TABLE community_events IS 'Community events and meetings displayed on homepage';

