-- =============================================
-- BACKFILL COUNTY FIELD FOR EXISTING COMMUNITIES
-- =============================================
-- Purpose: Update existing communities with county information
-- based on their postal codes
-- Created: 2025-10-09

-- Function to derive county from postal code
CREATE OR REPLACE FUNCTION get_county_from_postal_code(postal_code TEXT)
RETURNS TEXT AS $$
DECLARE
  code_prefix INTEGER;
BEGIN
  -- Remove spaces and get first 2 digits
  code_prefix := SUBSTRING(REPLACE(postal_code, ' ', ''), 1, 2)::INTEGER;
  
  -- Map postal code ranges to counties
  CASE
    WHEN code_prefix BETWEEN 10 AND 19 THEN RETURN 'Stockholm';
    WHEN code_prefix BETWEEN 20 AND 26 THEN RETURN 'Skåne';
    WHEN code_prefix BETWEEN 27 AND 28 THEN RETURN 'Blekinge';
    WHEN code_prefix BETWEEN 29 AND 29 THEN RETURN 'Gotland';
    WHEN code_prefix BETWEEN 30 AND 31 THEN RETURN 'Halland';
    WHEN code_prefix BETWEEN 32 AND 34 THEN RETURN 'Jönköping';
    WHEN code_prefix BETWEEN 35 AND 39 THEN RETURN 'Kronoberg';
    WHEN code_prefix BETWEEN 40 AND 49 THEN RETURN 'Västra Götaland';
    WHEN code_prefix BETWEEN 50 AND 59 THEN RETURN 'Östergötland';
    WHEN code_prefix BETWEEN 60 AND 64 THEN RETURN 'Jönköping';
    WHEN code_prefix BETWEEN 65 AND 69 THEN RETURN 'Kronoberg';
    WHEN code_prefix BETWEEN 70 AND 74 THEN RETURN 'Örebro';
    WHEN code_prefix BETWEEN 75 AND 77 THEN RETURN 'Södermanland';
    WHEN code_prefix BETWEEN 78 AND 79 THEN RETURN 'Värmland';
    WHEN code_prefix BETWEEN 80 AND 83 THEN RETURN 'Gävleborg';
    WHEN code_prefix BETWEEN 84 AND 86 THEN RETURN 'Västernorrland';
    WHEN code_prefix BETWEEN 87 AND 89 THEN RETURN 'Jämtland';
    WHEN code_prefix BETWEEN 90 AND 94 THEN RETURN 'Västerbotten';
    WHEN code_prefix BETWEEN 95 AND 98 THEN RETURN 'Norrbotten';
    ELSE RETURN 'Stockholm'; -- Default fallback
  END CASE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Stockholm'; -- Error fallback
END;
$$ LANGUAGE plpgsql;

-- Update communities that have postal_code but no county
UPDATE local_communities
SET county = get_county_from_postal_code(postal_code)
WHERE postal_code IS NOT NULL
  AND (county IS NULL OR county = '');

-- Log results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM local_communities
  WHERE county IS NOT NULL;
  
  RAISE NOTICE 'Communities with county set: %', updated_count;
END $$;

-- Show communities by county (for verification)
SELECT 
  county,
  COUNT(*) as community_count,
  SUM(member_count) as total_members
FROM local_communities
WHERE county IS NOT NULL
GROUP BY county
ORDER BY community_count DESC;

