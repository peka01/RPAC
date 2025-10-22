-- =============================================
-- LICENSE HISTORY TABLE MIGRATION
-- =============================================
-- Purpose: Track license purchases and renewals for future business model
-- License Types: free (default), individual (paid user), community_manager (paid premium)
-- Date: 2025-10-21

-- Create license_history table
CREATE TABLE IF NOT EXISTS license_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('individual', 'community_manager')),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  price_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'SEK',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  payment_provider VARCHAR(50), -- 'stripe', 'swish', 'manual'
  is_active BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for license management
CREATE INDEX IF NOT EXISTS idx_license_history_user_id 
  ON license_history(user_id);

CREATE INDEX IF NOT EXISTS idx_license_history_active 
  ON license_history(user_id, is_active, end_date);

-- Index for expiring licenses (removed NOW() to avoid immutability error)
CREATE INDEX IF NOT EXISTS idx_license_history_expiring 
  ON license_history(end_date, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_license_history_type 
  ON license_history(license_type, is_active);

-- Enable RLS
ALTER TABLE license_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own license history" ON license_history;
CREATE POLICY "Users can view own license history" 
  ON license_history FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can manage all licenses" ON license_history;
CREATE POLICY "Super admins can manage all licenses" 
  ON license_history FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_tier = 'super_admin'
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_license_history_updated_at 
  BEFORE UPDATE ON license_history
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ License history table created successfully!';
END $$;

