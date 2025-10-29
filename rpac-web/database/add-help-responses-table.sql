-- ADD HELP_RESPONSES TABLE
-- This migration creates the help_responses table to store responses to help requests

-- Create the help_responses table
CREATE TABLE IF NOT EXISTS help_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  help_request_id UUID NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  can_help BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_help_responses_request_id ON help_responses(help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_responses_responder_id ON help_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_help_responses_created_at ON help_responses(created_at);

-- Enable Row Level Security
ALTER TABLE help_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view responses to requests in their communities" ON help_responses;
DROP POLICY IF EXISTS "Users can create responses to help requests" ON help_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON help_responses;
DROP POLICY IF EXISTS "Admins can update any response" ON help_responses;
DROP POLICY IF EXISTS "Admins can delete any response" ON help_responses;

-- Policy: Users can view responses if they are:
-- 1. The requestor (owner of the help request)
-- 2. The responder (author of the response)
-- 3. A community admin
CREATE POLICY "Users can view responses to requests in their communities" ON help_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM help_requests hr
      WHERE hr.id = help_responses.help_request_id
      AND (
        -- User is the requestor
        hr.user_id = auth.uid()
        -- OR user is the responder
        OR help_responses.responder_id = auth.uid()
        -- OR user is a community admin
        OR EXISTS (
          SELECT 1 FROM community_memberships cm
          WHERE cm.community_id = hr.community_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('admin', 'moderator')
        )
      )
    )
  );

-- Policy: Authenticated users can create responses
CREATE POLICY "Users can create responses to help requests" ON help_responses
  FOR INSERT WITH CHECK (
    auth.uid() = responder_id
    AND EXISTS (
      SELECT 1 FROM help_requests hr
      INNER JOIN community_memberships cm ON cm.community_id = hr.community_id
      WHERE hr.id = help_responses.help_request_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'approved'
    )
  );

-- Policy: Users can update their own responses
CREATE POLICY "Users can update own responses" ON help_responses
  FOR UPDATE USING (
    auth.uid() = responder_id
  );

-- Policy: Community admins can update any response in their communities
CREATE POLICY "Admins can update any response" ON help_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM help_requests hr
      INNER JOIN community_memberships cm ON cm.community_id = hr.community_id
      WHERE hr.id = help_responses.help_request_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Policy: Community admins can delete any response in their communities
CREATE POLICY "Admins can delete any response" ON help_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM help_requests hr
      INNER JOIN community_memberships cm ON cm.community_id = hr.community_id
      WHERE hr.id = help_responses.help_request_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_help_responses_updated_at 
  BEFORE UPDATE ON help_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE help_responses IS 'Stores responses from helpers to help requests. Visibility is restricted to requestor, responder, and community admins.';
