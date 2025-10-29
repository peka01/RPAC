-- Quick fix: Make category nullable temporarily so existing code works
-- Then you can run the full migration to remove it

ALTER TABLE help_requests ALTER COLUMN category DROP NOT NULL;

RAISE NOTICE '✅ Category column is now nullable - app should work now!';
RAISE NOTICE 'ℹ️  Next step: Run simplify-help-requests-remove-category.sql to fully remove the column';
