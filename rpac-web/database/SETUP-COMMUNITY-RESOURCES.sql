-- =============================================
-- SETUP COMMUNITY RESOURCES - COMPLETE SETUP
-- =============================================
-- Run this ENTIRE file in Supabase SQL Editor
-- This creates all necessary tables and policies
-- =============================================

-- =============================================
-- STEP 1: Create community_resources table
-- =============================================

CREATE TABLE IF NOT EXISTS community_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('equipment', 'facility', 'skill', 'information')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools', 'other')),
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'broken')),
  location VARCHAR(255),
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  usage_instructions TEXT,
  booking_required BOOLEAN DEFAULT FALSE,
  notes TEXT,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: Create resource_bookings table
-- =============================================

CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: Add columns to resources table
-- =============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'is_shareable'
  ) THEN
    ALTER TABLE resources ADD COLUMN is_shareable BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE resources ADD COLUMN photo_url TEXT;
  END IF;
END $$;

-- =============================================
-- STEP 4: Create indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_community_resources_community_id ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_category ON community_resources(category);
CREATE INDEX IF NOT EXISTS idx_community_resources_status ON community_resources(status);
CREATE INDEX IF NOT EXISTS idx_community_resources_responsible ON community_resources(responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_resource_bookings_community_resource ON resource_bookings(community_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_user ON resource_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_status ON resource_bookings(status);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_times ON resource_bookings(start_time, end_time);

-- =============================================
-- STEP 5: Enable RLS
-- =============================================

ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: Create RLS policies
-- =============================================

-- Community resources policies
DROP POLICY IF EXISTS "Community members can view community resources" ON community_resources;
CREATE POLICY "Community members can view community resources"
  ON community_resources FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Community admins can insert community resources" ON community_resources;
CREATE POLICY "Community admins can insert community resources"
  ON community_resources FOR INSERT
  WITH CHECK (
    community_id IN (
      SELECT community_id FROM community_memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Community admins can update community resources" ON community_resources;
CREATE POLICY "Community admins can update community resources"
  ON community_resources FOR UPDATE
  USING (
    community_id IN (
      SELECT community_id FROM community_memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Community admins can delete community resources" ON community_resources;
CREATE POLICY "Community admins can delete community resources"
  ON community_resources FOR DELETE
  USING (
    community_id IN (
      SELECT community_id FROM community_memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Resource bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON resource_bookings;
CREATE POLICY "Users can view their own bookings"
  ON resource_bookings FOR SELECT
  USING (
    user_id = auth.uid() OR
    community_resource_id IN (
      SELECT cr.id FROM community_resources cr
      INNER JOIN community_memberships cm ON cr.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users can create bookings" ON resource_bookings;
CREATE POLICY "Users can create bookings"
  ON resource_bookings FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    community_resource_id IN (
      SELECT cr.id FROM community_resources cr
      INNER JOIN community_memberships cm ON cr.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own bookings" ON resource_bookings;
CREATE POLICY "Users can update their own bookings"
  ON resource_bookings FOR UPDATE
  USING (
    user_id = auth.uid() OR
    community_resource_id IN (
      SELECT cr.id FROM community_resources cr
      INNER JOIN community_memberships cm ON cr.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users can delete their own bookings" ON resource_bookings;
CREATE POLICY "Users can delete their own bookings"
  ON resource_bookings FOR DELETE
  USING (
    user_id = auth.uid() OR
    community_resource_id IN (
      SELECT cr.id FROM community_resources cr
      INNER JOIN community_memberships cm ON cr.community_id = cm.community_id
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

-- =============================================
-- STEP 7: Create updated_at trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_community_resources_updated_at ON community_resources;
CREATE TRIGGER update_community_resources_updated_at 
  BEFORE UPDATE ON community_resources 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_bookings_updated_at ON resource_bookings;
CREATE TRIGGER update_resource_bookings_updated_at 
  BEFORE UPDATE ON resource_bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION: Check setup
-- =============================================

DO $$
DECLARE
  table_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_resources'
  ) INTO table_exists;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'community_resources';

  -- Output results
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Table exists: %', CASE WHEN table_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'RLS policies created: % policies', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now add community resources!';
  RAISE NOTICE '👉 Go to: Lokal → Samhällets resurser';
  RAISE NOTICE '👉 Click: "Lägg till resurs"';
  RAISE NOTICE '===========================================';
END $$;

-- Show your admin status
SELECT 
  '✅ YOUR ADMIN STATUS' as info,
  lc.community_name,
  cm.role,
  CASE 
    WHEN cm.role IN ('admin', 'moderator') THEN '✅ CAN ADD RESOURCES'
    ELSE '❌ NEED ADMIN ROLE'
  END as permission
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
WHERE cm.user_id = auth.uid();

