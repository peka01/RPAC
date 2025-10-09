-- Diagnostic script to check current display_name values
-- Run this to see what's actually in the database

-- Check user_profiles display names
SELECT 
  up.id as profile_id,
  up.user_id,
  up.display_name as current_display_name,
  au.email,
  CASE 
    WHEN up.display_name IS NULL THEN 'NULL'
    WHEN trim(up.display_name) = '' THEN 'EMPTY'
    WHEN up.display_name SIMILAR TO 'Medlem [0-9]+' THEN 'GENERIC (Medlem X)'
    WHEN up.display_name = 'Användare' THEN 'GENERIC (Användare)'
    ELSE 'OK'
  END as status
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY status, up.display_name;

-- Summary count
SELECT 
  CASE 
    WHEN display_name IS NULL THEN 'NULL'
    WHEN trim(display_name) = '' THEN 'EMPTY'
    WHEN display_name SIMILAR TO 'Medlem [0-9]+' THEN 'GENERIC (Medlem X)'
    WHEN display_name = 'Användare' THEN 'GENERIC (Användare)'
    ELSE 'OK'
  END as status,
  COUNT(*) as count
FROM user_profiles
GROUP BY 
  CASE 
    WHEN display_name IS NULL THEN 'NULL'
    WHEN trim(display_name) = '' THEN 'EMPTY'
    WHEN display_name SIMILAR TO 'Medlem [0-9]+' THEN 'GENERIC (Medlem X)'
    WHEN display_name = 'Användare' THEN 'GENERIC (Användare)'
    ELSE 'OK'
  END
ORDER BY status;

