# Cultivation System Documentation

## Overview
The cultivation system in RPAC is designed to help users plan and manage their home gardening and food production. It uses a single-table architecture with JSON storage for flexibility and real-time calculations for nutrition and yield estimates.

## Database Structure

### Main Table: `cultivation_plans`
```sql
CREATE TABLE cultivation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  crops JSONB DEFAULT '[]'::jsonb,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
- `idx_cultivation_plans_user_id` - For quick user-specific queries
- `idx_cultivation_plans_is_primary` - For primary plan lookups

### Security
Row Level Security (RLS) policies ensure users can only:
- View their own plans
- Create plans for themselves
- Update their own plans
- Delete their own plans

## Core Components

### 1. SimpleCultivationManager
- Main component for plan management
- Supports multiple plans per user
- Primary plan designation
- Real-time nutrition calculations

### 2. cultivation-plan-service.ts
- Core service handling all plan operations
- CRUD operations for plans
- Nutrition calculations
- Monthly activity generation
- Yield estimates

### 3. CROP_LIBRARY
- Centralized crop data store
- Nutritional information
- Growing season details
- Yield estimates per plant/area

## Key Features

### Plan Management
- Create multiple plans
- Designate primary plan
- Add/remove crops
- Track nutritional contribution

### Calculations
- Expected yield per crop
- Nutritional value
- Self-sufficiency percentage
- Monthly activity planning

### Integration
- Dashboard overview
- Weather integration
- AI-assisted planning (via Gemini AI)
- Mobile-responsive interfaces

## Usage Examples

### Creating a Plan
```typescript
const newPlan: CultivationPlan = {
  plan_name: "Summer Garden 2025",
  description: "Mixed vegetables and herbs",
  crops: [],
  is_primary: true
};
await cultivationPlanService.createPlan(userId, newPlan);
```

### Calculating Nutrition
```typescript
const nutrition = calculatePlanNutrition(plan, householdSize, targetDays);
// Returns: totalKcal, kcalPerDay, percentOfTarget, etc.
```

### Generating Monthly Activities
```typescript
const activities = generateMonthlyActivities(plan.crops);
// Returns: Monthly breakdown of sowing, planting, harvesting
```

## Best Practices
1. Always use the `cultivation-plan-service.ts` for database operations
2. Calculate nutrition values client-side for responsiveness
3. Use real-time updates for plan modifications
4. Handle primary plan status changes carefully

## Migration Notes
- Previous `crisis_cultivation_plans` and `cultivation_calendar` tables have been deprecated
- All functionality consolidated into `cultivation_plans` with JSONB storage
- Activity tracking now handled through monthly activity generation