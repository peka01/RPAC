-- =============================================
-- COMMUNITY HOMESPACE FEATURE
-- Public-facing community pages with customizable content
-- =============================================

-- Community homespaces table (one per community)
CREATE TABLE IF NOT EXISTS community_homespaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES local_communities(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Content sections (customizable by admin)
  about_text TEXT,
  membership_criteria TEXT,
  
  -- Visual customization
  custom_banner_url TEXT,
  banner_pattern VARCHAR(50) DEFAULT 'olive-gradient' CHECK (banner_pattern IN ('olive-gradient', 'olive-mesh', 'olive-waves', 'olive-geometric')),
  accent_color VARCHAR(7) DEFAULT '#5C6B47',
  
  -- Visibility settings (what's public vs. members-only)
  show_resources_public BOOLEAN DEFAULT true,
  show_preparedness_score_public BOOLEAN DEFAULT true,
  show_member_activities BOOLEAN DEFAULT false,
  show_admin_contact BOOLEAN DEFAULT true,
  show_skills_public BOOLEAN DEFAULT true,
  
  -- Publishing
  published BOOLEAN DEFAULT false,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Meta
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_community_homespace UNIQUE(community_id)
);

-- Activity log for homespace (shows recent community events)
CREATE TABLE IF NOT EXISTS homespace_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES local_communities(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('member_joined', 'resource_added', 'milestone', 'exercise', 'custom')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '📰', -- emoji or icon name
  
  -- Visibility
  visible_public BOOLEAN DEFAULT true,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_homespaces_slug ON community_homespaces(slug);
CREATE INDEX IF NOT EXISTS idx_homespaces_published ON community_homespaces(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_homespaces_community ON community_homespaces(community_id);
CREATE INDEX IF NOT EXISTS idx_activity_community ON homespace_activity_log(community_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON homespace_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_public ON homespace_activity_log(visible_public) WHERE visible_public = true;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

ALTER TABLE community_homespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE homespace_activity_log ENABLE ROW LEVEL SECURITY;

-- Public can view published homespaces
DROP POLICY IF EXISTS "Public can view published homespaces" ON community_homespaces;
CREATE POLICY "Public can view published homespaces"
  ON community_homespaces FOR SELECT
  USING (published = true);

-- Community creators/admins can view and manage their homespace
DROP POLICY IF EXISTS "Admins can manage their homespace" ON community_homespaces;
CREATE POLICY "Admins can manage their homespace"
  ON community_homespaces FOR ALL
  USING (
    community_id IN (
      SELECT id FROM local_communities
      WHERE created_by = auth.uid()
    )
  );

-- Members can view unpublished homespaces of their communities
DROP POLICY IF EXISTS "Members can view their community homespace" ON community_homespaces;
CREATE POLICY "Members can view their community homespace"
  ON community_homespaces FOR SELECT
  USING (
    published = true OR
    community_id IN (
      SELECT community_id FROM community_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Public can view public activity log entries for published homespaces
DROP POLICY IF EXISTS "Public can view public activities" ON homespace_activity_log;
CREATE POLICY "Public can view public activities"
  ON homespace_activity_log FOR SELECT
  USING (
    visible_public = true AND
    community_id IN (
      SELECT community_id FROM community_homespaces WHERE published = true
    )
  );

-- Community admins can manage activity log
DROP POLICY IF EXISTS "Admins can manage activity log" ON homespace_activity_log;
CREATE POLICY "Admins can manage activity log"
  ON homespace_activity_log FOR ALL
  USING (
    community_id IN (
      SELECT id FROM local_communities
      WHERE created_by = auth.uid()
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to generate unique slug from community name
CREATE OR REPLACE FUNCTION generate_community_slug(p_community_name TEXT, p_community_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(p_community_name);
  base_slug := regexp_replace(base_slug, '[åä]', 'a', 'g');
  base_slug := regexp_replace(base_slug, 'ö', 'o', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current community)
  WHILE EXISTS (
    SELECT 1 FROM community_homespaces 
    WHERE slug = final_slug AND community_id != p_community_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create homespace when community is created
CREATE OR REPLACE FUNCTION auto_create_homespace()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  default_about TEXT;
BEGIN
  -- Generate slug
  new_slug := generate_community_slug(NEW.community_name, NEW.id);
  
  -- Default about text template
  default_about := format(
    E'# Välkommen till %s!\n\nVi är ett lokalt beredskapssamhälle i %s som arbetar tillsammans för att stärka vår gemensamma motståndskraft.\n\n## Våra värderingar\n- Ömsesidig hjälp och respekt\n- Lokal självförsörjning\n- Transparent resursdelning\n- Svenskt krisberedskapstänk enligt MSB\n\n## Vad vi gör tillsammans\n- Dela resurser och kompetenser\n- Planera för självförsörjning\n- Träna för krislägen\n- Stödja varandra i vardagen\n\n*Redigera denna text för att berätta om just ert samhälle.*',
    NEW.community_name,
    COALESCE(NEW.county, 'Sverige')
  );
  
  -- Create homespace
  INSERT INTO community_homespaces (
    community_id,
    slug,
    about_text,
    membership_criteria,
    published
  ) VALUES (
    NEW.id,
    new_slug,
    default_about,
    E'## Vem kan gå med?\n- Boende i närområdet\n- Engagerad i lokal beredskap\n- Dela våra värderingar om ömsesidig hjälp',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create homespace
DROP TRIGGER IF EXISTS trigger_auto_create_homespace ON local_communities;
CREATE TRIGGER trigger_auto_create_homespace
  AFTER INSERT ON local_communities
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_homespace();

-- Function to log activity when members join
CREATE OR REPLACE FUNCTION log_member_joined()
RETURNS TRIGGER AS $$
DECLARE
  community_name TEXT;
  show_activities BOOLEAN;
BEGIN
  -- Get community name and visibility setting
  SELECT lc.community_name, ch.show_member_activities
  INTO community_name, show_activities
  FROM local_communities lc
  JOIN community_homespaces ch ON ch.community_id = lc.id
  WHERE lc.id = NEW.community_id;
  
  -- Only log if community has homespace and setting is enabled
  IF show_activities THEN
    INSERT INTO homespace_activity_log (
      community_id,
      activity_type,
      title,
      description,
      icon,
      visible_public
    ) VALUES (
      NEW.community_id,
      'member_joined',
      'Ny medlem välkommen',
      'En ny medlem har gått med i samhället',
      '👥',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log member joins
DROP TRIGGER IF EXISTS trigger_log_member_joined ON community_memberships;
CREATE TRIGGER trigger_log_member_joined
  AFTER INSERT ON community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_member_joined();

-- =============================================
-- BACKFILL EXISTING COMMUNITIES
-- =============================================

-- Create homespaces for existing communities that don't have one
DO $$
DECLARE
  community_record RECORD;
  new_slug TEXT;
  default_about TEXT;
BEGIN
  FOR community_record IN 
    SELECT lc.* 
    FROM local_communities lc
    LEFT JOIN community_homespaces ch ON ch.community_id = lc.id
    WHERE ch.id IS NULL
  LOOP
    -- Generate slug
    new_slug := generate_community_slug(community_record.community_name, community_record.id);
    
    -- Default about text
    default_about := format(
      E'# Välkommen till %s!\n\nVi är ett lokalt beredskapssamhälle i %s som arbetar tillsammans för att stärka vår gemensamma motståndskraft.\n\n## Våra värderingar\n- Ömsesidig hjälp och respekt\n- Lokal självförsörjning\n- Transparent resursdelning\n- Svenskt krisberedskapstänk enligt MSB\n\n## Vad vi gör tillsammans\n- Dela resurser och kompetenser\n- Planera för självförsörjning\n- Träna för krislägen\n- Stödja varandra i vardagen\n\n*Redigera denna text för att berätta om just ert samhälle.*',
      community_record.community_name,
      COALESCE(community_record.county, 'Sverige')
    );
    
    -- Create homespace
    INSERT INTO community_homespaces (
      community_id,
      slug,
      about_text,
      membership_criteria,
      published
    ) VALUES (
      community_record.id,
      new_slug,
      default_about,
      E'## Vem kan gå med?\n- Boende i närområdet\n- Engagerad i lokal beredskap\n- Dela våra värderingar om ömsesidig hjälp',
      false
    );
  END LOOP;
END $$;

-- =============================================
-- RPC FUNCTION: INCREMENT VIEW COUNT
-- =============================================

-- Function to increment view count (called from public page)
CREATE OR REPLACE FUNCTION increment_homespace_views(homespace_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_homespaces
  SET views_count = views_count + 1
  WHERE id = homespace_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_homespace_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_homespace_views(UUID) TO authenticated;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE community_homespaces IS 'Public-facing homepages for communities, customizable by admins';
COMMENT ON TABLE homespace_activity_log IS 'Activity feed for community homespaces showing recent events';
COMMENT ON COLUMN community_homespaces.slug IS 'URL-friendly slug for beready.se/[slug]';
COMMENT ON COLUMN community_homespaces.published IS 'Whether homespace is visible to public';
COMMENT ON COLUMN community_homespaces.show_resources_public IS 'Show resource category counts publicly';
COMMENT ON COLUMN community_homespaces.show_preparedness_score_public IS 'Show aggregate preparedness score publicly';
COMMENT ON COLUMN homespace_activity_log.visible_public IS 'Whether this activity is shown to non-members';

