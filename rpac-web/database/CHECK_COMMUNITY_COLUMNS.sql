-- Check what columns local_communities actually has
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'local_communities'
ORDER BY ordinal_position;

