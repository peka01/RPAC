-- ============================================
-- CULTIVATION DATABASE CLEANUP
-- ============================================
-- This script removes obsolete cultivation-related tables and data
-- that are no longer used by the current SimpleCultivationManager system
-- 
-- SAFE TO RUN: Only removes obsolete tables, keeps active cultivation_plans
-- 
-- Last Updated: 2025-10-09
-- ============================================

-- ============================================
-- STEP 1: Remove obsolete cultivation tables
-- ============================================

-- Remove old cultivation calendar system (replaced by cultivation_plans)
DROP TABLE IF EXISTS cultivation_calendar CASCADE;

-- Remove crisis cultivation plans (feature removed)
DROP TABLE IF EXISTS crisis_cultivation_plans CASCADE;

-- Remove garden layouts (feature removed)
DROP TABLE IF EXISTS garden_layouts CASCADE;

-- Remove nutrition calculations (moved to cultivation_plans JSONB)
DROP TABLE IF EXISTS nutrition_calculations CASCADE;

-- Remove plant diagnoses (feature removed)
DROP TABLE IF EXISTS plant_diagnoses CASCADE;

-- ============================================
-- STEP 2: Remove obsolete functions
-- ============================================

-- Remove old cultivation calendar function
DROP FUNCTION IF EXISTS get_user_cultivation_calendar(UUID, VARCHAR);

-- Remove old user stats function (references removed tables)
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- ============================================
-- STEP 3: Clean up obsolete indexes
-- ============================================

-- These indexes are automatically removed when tables are dropped
-- but listed here for reference:
-- - idx_cultivation_calendar_user_id
-- - idx_cultivation_calendar_month  
-- - idx_cultivation_calendar_activity
-- - idx_cultivation_calendar_completed
-- - idx_garden_layouts_user_id
-- - idx_crisis_plans_user_id
-- - idx_nutrition_calculations_user_id
-- - idx_plant_diagnoses_user_id

-- ============================================
-- STEP 4: Clean up obsolete policies
-- ============================================

-- These policies are automatically removed when tables are dropped
-- but listed here for reference:
-- - "Users can manage own cultivation data" ON cultivation_calendar
-- - "Users can manage own garden layouts" ON garden_layouts  
-- - "Users can manage own crisis plans" ON crisis_cultivation_plans
-- - "Users can manage own nutrition calculations" ON nutrition_calculations
-- - "Users can manage own plant diagnoses" ON plant_diagnoses

-- ============================================
-- STEP 5: Clean up obsolete triggers
-- ============================================

-- These triggers are automatically removed when tables are dropped
-- but listed here for reference:
-- - update_cultivation_calendar_updated_at
-- - update_garden_layouts_updated_at
-- - update_crisis_plans_updated_at
-- - update_nutrition_calculations_updated_at
-- - update_plant_diagnoses_updated_at

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify remaining cultivation tables
DO $$
BEGIN
  RAISE NOTICE 'Cultivation Database Cleanup Complete!';
  RAISE NOTICE 'Remaining cultivation tables:';
  RAISE NOTICE '- cultivation_plans (ACTIVE - used by SimpleCultivationManager)';
  RAISE NOTICE '- cultivation_reminders (ACTIVE - used by reminder system)';
  RAISE NOTICE 'Removed obsolete tables: cultivation_calendar, crisis_cultivation_plans, garden_layouts, nutrition_calculations, plant_diagnoses';
END $$;
