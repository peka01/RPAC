# Min Odling - Expert Workshop Analysis & Redesign

## Workshop Participants
- **Cultivation Expert**: Specialized in Swedish growing conditions, crop selection, and seasonal planning
- **Nutrition Expert**: Focused on family nutrition needs, crisis preparedness, and dietary requirements
- **Crisis Management Expert**: Emergency preparedness, resource planning, and resilience strategies
- **Software Development Expert**: User experience, data flow, and technical implementation

## Current State Analysis

### Existing Flow Issues
1. **Manual Nutrition Input**: Users must manually enter nutrition data instead of auto-calculating from profile
2. **Generic Crop Selection**: No location-based crop suggestions
3. **Disconnected Profile**: Profile data not fully integrated with cultivation planning
4. **Limited Gap Analysis**: Basic grocery gap without comprehensive cost analysis
5. **Sequential Steps**: Linear flow instead of integrated planning

### Profile Data Available
- Location (county, city, postal code)
- Household size
- Family composition (children, elderly, pets)
- Medical conditions/allergies
- Emergency contacts

## New Redesigned Flow: "Min Odling"

### 1. Profile-Driven Nutrition Planning
**Auto-calculate nutrition needs based on:**
- Household size and composition
- Age groups (children, adults, elderly)
- Activity levels
- Special dietary needs (allergies, medical conditions)
- Crisis preparedness requirements (3-6 month supply)

**Implementation:**
```typescript
interface NutritionProfile {
  householdSize: number;
  ageGroups: {
    children: number;
    adults: number;
    elderly: number;
  };
  activityLevel: 'sedentary' | 'moderate' | 'active';
  specialNeeds: string[];
  crisisMode: boolean;
  targetSelfSufficiency: number; // percentage
}
```

### 2. Location-Based Crop Suggestions
**Automatic crop recommendations based on:**
- Climate zone (Götaland, Svealand, Norrland)
- Growing season length
- Soil conditions
- Local weather patterns
- Historical success rates

**Implementation:**
```typescript
interface CropRecommendation {
  crop: string;
  suitability: 'excellent' | 'good' | 'moderate' | 'challenging';
  season: string[];
  yield: number; // kg per m²
  nutritionValue: NutritionalData;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  localTips: string[];
}
```

### 3. Integrated Planning Results
**Comprehensive cultivation plan including:**
- Seasonal timeline
- Space allocation
- Resource requirements
- Expected yields
- Nutrition contribution
- Cost-benefit analysis

### 4. Advanced Gap Analysis
**Detailed analysis of:**
- Nutritional gaps not covered by cultivation
- Required grocery purchases
- Cost estimations with price tracking
- Alternative sourcing strategies
- Crisis scenario planning

## New Component Structure

### Main Flow Components
1. **Profile Integration** - Auto-load user data
2. **Nutrition Calculator** - Profile-driven calculations
3. **Crop Selector** - Location-based suggestions
4. **Plan Generator** - AI-powered comprehensive planning
5. **Gap Analyzer** - Detailed cost and nutrition analysis
6. **Timeline Manager** - Seasonal planning and reminders

### Enhanced Profile Page
- **Cultivation Preferences** section
- **Nutrition Goals** settings
- **Crisis Preparedness** level
- **Garden Specifications** (size, type, conditions)
- **Experience Level** assessment

## Technical Implementation Plan

### Phase 1: Profile Enhancement
- Add cultivation-specific profile fields
- Implement auto-nutrition calculation
- Create location-based crop database

### Phase 2: Smart Crop Selection
- Build crop recommendation engine
- Integrate with climate data
- Add difficulty and yield predictions

### Phase 3: Advanced Planning
- Enhanced AI planning with profile integration
- Comprehensive gap analysis
- Cost tracking and optimization

### Phase 4: Crisis Integration
- Emergency scenario planning
- Resource stockpiling recommendations
- Community coordination features

## Expected Outcomes
1. **Streamlined User Experience**: Profile-driven automation
2. **Accurate Planning**: Location and family-specific recommendations
3. **Cost Optimization**: Detailed financial analysis
4. **Crisis Readiness**: Emergency preparedness integration
5. **Community Integration**: Local resource sharing

## Success Metrics
- Reduced setup time (from 30+ minutes to 5 minutes)
- Improved plan accuracy (location-specific)
- Better cost predictions (±10% accuracy)
- Increased user engagement (profile completion)
- Enhanced crisis preparedness scores
