-- =============================================
-- RESOURCE REQUESTS TABLE
-- =============================================
-- This table tracks who requested which shared resources
-- Enables proper request management workflow
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

-- Add function to get request details with user info
CREATE OR REPLACE FUNCTION get_resource_request_details(request_uuid UUID)
RETURNS TABLE (
  request_id UUID,
  shared_resource_id UUID,
  requester_id UUID,
  requester_name TEXT,
  requester_email TEXT,
  requested_quantity DECIMAL(10,2),
  status VARCHAR(20),
  message TEXT,
  response_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  resource_name TEXT,
  resource_category VARCHAR(20),
  resource_unit VARCHAR(20),
  sharer_name TEXT,
  sharer_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.shared_resource_id,
    rr.requester_id,
    up_requester.display_name,
    u_requester.email,
    rr.requested_quantity,
    rr.status,
    rr.message,
    rr.response_message,
    rr.requested_at,
    rr.responded_at,
    rr.completed_at,
    r.name,
    r.category,
    r.unit,
    up_sharer.display_name,
    u_sharer.email
  FROM resource_requests rr
  JOIN resource_sharing rs ON rr.shared_resource_id = rs.id
  JOIN resources r ON rs.resource_id = r.id
  JOIN auth.users u_requester ON rr.requester_id = u_requester.id
  JOIN auth.users u_sharer ON rs.user_id = u_sharer.id
  LEFT JOIN user_profiles up_requester ON rr.requester_id = up_requester.user_id
  LEFT JOIN user_profiles up_sharer ON rs.user_id = up_sharer.user_id
  WHERE rr.id = request_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get all requests for a shared resource
CREATE OR REPLACE FUNCTION get_shared_resource_requests(shared_resource_uuid UUID)
RETURNS TABLE (
  request_id UUID,
  requester_id UUID,
  requester_name TEXT,
  requester_email TEXT,
  requested_quantity DECIMAL(10,2),
  status VARCHAR(20),
  message TEXT,
  response_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.requester_id,
    COALESCE(up.display_name, 'Okänd användare'),
    u.email,
    rr.requested_quantity,
    rr.status,
    rr.message,
    rr.response_message,
    rr.requested_at,
    rr.responded_at,
    rr.completed_at
  FROM resource_requests rr
  JOIN auth.users u ON rr.requester_id = u.id
  LEFT JOIN user_profiles up ON rr.requester_id = up.user_id
  WHERE rr.shared_resource_id = shared_resource_uuid
  ORDER BY rr.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to approve a request
CREATE OR REPLACE FUNCTION approve_resource_request(request_uuid UUID, response_message TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
  shared_resource_record RECORD;
BEGIN
  -- Get request details
  SELECT * INTO request_record FROM resource_requests WHERE id = request_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get shared resource details
  SELECT * INTO shared_resource_record FROM resource_sharing WHERE id = request_record.shared_resource_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's enough quantity available
  IF request_record.requested_quantity > shared_resource_record.shared_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE resource_requests 
  SET 
    status = 'approved',
    response_message = response_message,
    responded_at = NOW()
  WHERE id = request_uuid;
  
  -- Update shared resource status
  UPDATE resource_sharing 
  SET 
    status = 'taken',
    updated_at = NOW()
  WHERE id = request_record.shared_resource_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to deny a request
CREATE OR REPLACE FUNCTION deny_resource_request(request_uuid UUID, response_message TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE resource_requests 
  SET 
    status = 'denied',
    response_message = response_message,
    responded_at = NOW()
  WHERE id = request_uuid;
  
  -- Reset shared resource status to available
  UPDATE resource_sharing 
  SET 
    status = 'available',
    updated_at = NOW()
  WHERE id = (SELECT shared_resource_id FROM resource_requests WHERE id = request_uuid);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to mark request as completed
CREATE OR REPLACE FUNCTION complete_resource_request(request_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE resource_requests 
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = request_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
