-- =============================================
-- ADD COMMUNITY RESOURCES & BOOKINGS TABLES
-- =============================================
-- This migration adds community-owned resources separate from shared individual resources
-- Created: 2025-10-04
-- Purpose: Enable community inventory management with bookings and maintenance tracking

-- =============================================
-- COMMUNITY OWNED RESOURCES TABLE
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
-- RESOURCE BOOKINGS TABLE
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
-- ENHANCE EXISTING RESOURCES TABLE
-- =============================================

-- Add shareability columns to individual resources table
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
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Community resources indexes
CREATE INDEX IF NOT EXISTS idx_community_resources_community_id ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_category ON community_resources(category);
CREATE INDEX IF NOT EXISTS idx_community_resources_status ON community_resources(status);
CREATE INDEX IF NOT EXISTS idx_community_resources_responsible ON community_resources(responsible_user_id);

-- Resource bookings indexes
CREATE INDEX IF NOT EXISTS idx_resource_bookings_community_resource ON resource_bookings(community_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_user ON resource_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_status ON resource_bookings(status);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_times ON resource_bookings(start_time, end_time);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;

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
-- HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_resource_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for community_resources
DROP TRIGGER IF EXISTS update_community_resources_updated_at ON community_resources;
CREATE TRIGGER update_community_resources_updated_at
  BEFORE UPDATE ON community_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_community_resource_updated_at();

-- Trigger for resource_bookings
DROP TRIGGER IF EXISTS update_resource_bookings_updated_at ON resource_bookings;
CREATE TRIGGER update_resource_bookings_updated_at
  BEFORE UPDATE ON resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_community_resource_updated_at();

-- =============================================
-- VALIDATION FUNCTION
-- =============================================

-- Function to check booking time conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM resource_bookings
    WHERE community_resource_id = NEW.community_resource_id
    AND status NOT IN ('rejected', 'cancelled')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
      (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
      (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Booking conflict: Resource is already booked for this time period';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate bookings
DROP TRIGGER IF EXISTS validate_booking_time ON resource_bookings;
CREATE TRIGGER validate_booking_time
  BEFORE INSERT OR UPDATE ON resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_conflict();

-- =============================================
-- COMPLETION LOG
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: community_resources and resource_bookings tables created with RLS policies';
END $$;

