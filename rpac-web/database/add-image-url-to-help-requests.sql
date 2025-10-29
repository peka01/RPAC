-- Add image_url column to help_requests table for photo attachments

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='help_requests' 
        AND column_name='image_url'
    ) THEN
        ALTER TABLE help_requests 
        ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Create storage bucket for help request images if it doesn't exist
-- Note: This needs to be run via Supabase Dashboard > Storage, not SQL
-- Bucket name: help-request-images
-- Settings: Public bucket, allow image uploads

-- Add RLS policy for storage bucket (run this after creating bucket in Dashboard)
-- CREATE POLICY "Public read access" ON storage.objects 
-- FOR SELECT USING (bucket_id = 'help-request-images');

-- CREATE POLICY "Authenticated users can upload" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'help-request-images' 
--   AND auth.role() = 'authenticated'
-- );

-- CREATE POLICY "Users can delete own images" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'help-request-images'
--   AND auth.uid() = owner
-- );

-- Verify column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'help_requests'
  AND column_name = 'image_url';
