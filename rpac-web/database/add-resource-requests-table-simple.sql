-- =============================================
-- RESOURCE REQUESTS TABLE - SIMPLIFIED VERSION
-- =============================================
-- This table tracks who requested which shared resources
-- Simplified version without complex RPC functions
-- =============================================

-- Create resource_requests table
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_requests_shared_resource ON resource_requests(shared_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requester ON resource_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requested_at ON resource_requests(requested_at);

-- Add RLS policies
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see requests for their shared resources
CREATE POLICY "Users can view requests for their shared resources" ON resource_requests
  FOR SELECT USING (
    shared_resource_id IN (
      SELECT id FROM resource_sharing WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can see their own requests
CREATE POLICY "Users can view their own requests" ON resource_requests
  FOR SELECT USING (requester_id = auth.uid());

-- Policy: Users can create requests
CREATE POLICY "Users can create requests" ON resource_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Policy: Resource owners can update requests for their resources
CREATE POLICY "Resource owners can update requests" ON resource_requests
  FOR UPDATE USING (
    shared_resource_id IN (
      SELECT id FROM resource_sharing WHERE user_id = auth.uid()
    )
  );

-- Policy: Requesters can update their own requests (cancel, etc.)
CREATE POLICY "Requesters can update their own requests" ON resource_requests
  FOR UPDATE USING (requester_id = auth.uid());

-- Add trigger to update updated_at
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
