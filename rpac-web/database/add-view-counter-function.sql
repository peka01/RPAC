-- =============================================
-- ADD VIEW COUNTER FUNCTION FOR HOMESPACE
-- =============================================
-- Run this in Supabase SQL Editor

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

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION increment_homespace_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_homespace_views(UUID) TO authenticated;

