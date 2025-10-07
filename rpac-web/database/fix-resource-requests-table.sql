-- =============================================
-- FIX RESOURCE REQUESTS TABLE - HANDLE EXISTING POLICIES
-- =============================================
-- This script handles the case where policies already exist
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view requests for their shared resources" ON resource_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON resource_requests;
DROP POLICY IF EXISTS "Users can create requests" ON resource_requests;
DROP POLICY IF EXISTS "Resource owners can update requests" ON resource_requests;
DROP POLICY IF EXISTS "Requesters can update their own requests" ON resource_requests;

-- Create resource_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS resource_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_resource_id UUID REFERENCES resource_sharing(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_quantity DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed', 'cancelled')),
  message TEXT, -- Optional message from requester
  response_message TEXT, -- Optional response from resource owner
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_resource_requests_shared_resource ON resource_requests(shared_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requester ON resource_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requested_at ON resource_requests(requested_at);

-- Enable RLS
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view requests for their shared resources" ON resource_requests
  FOR SELECT USING (
    shared_resource_id IN (
      SELECT id FROM resource_sharing WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own requests" ON resource_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create requests" ON resource_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Resource owners can update requests" ON resource_requests
  FOR UPDATE USING (
    shared_resource_id IN (
      SELECT id FROM resource_sharing WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Requesters can update their own requests" ON resource_requests
  FOR UPDATE USING (requester_id = auth.uid());

-- Add trigger to update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS trigger_update_resource_requests_updated_at ON resource_requests;
DROP FUNCTION IF EXISTS update_resource_requests_updated_at();

CREATE OR REPLACE FUNCTION update_resource_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_requests_updated_at
  BEFORE UPDATE ON resource_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_requests_updated_at();
