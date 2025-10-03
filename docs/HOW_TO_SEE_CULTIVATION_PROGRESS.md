# How to See the Cultivation Calendar Progress on Dashboard

**Issue**: "Can't see the cultivation progress card on my dashboard?"

**Answer**: The cultivation progress card **only displays when you have cultivation calendar entries**.

---

## Why You Can't See It

The card has a conditional display:
```typescript
{cultivationProgress.total > 0 && (
  // Card content
)}
```

This means it will **only show** if you have at least one cultivation task in your calendar.

---

## How to Make It Appear

### Step 1: Create a Cultivation Plan

1. Navigate to **Individual** → **Min odling** (Cultivation section)
2. Click **Odlingsplanering** (Cultivation Planning)
3. Fill out your profile information (or click "Generera plan" if already filled)
4. Generate an AI cultivation plan
5. **Important**: Click **"Spara plan"** (Save Plan) button

### Step 2: Verify Calendar Entries Were Created

When you save a cultivation plan, it should automatically create calendar entries via the `saveToCalendarEntries()` function in CultivationPlanner.tsx.

Check the browser console for:
```
Saving to calendar entries...
Successfully saved X calendar entries
```

### Step 3: View Your Dashboard

1. Navigate back to **Individual** → **Home** (Hemstatus)
2. The cultivation progress card should now appear!

---

## Troubleshooting

### Card Still Not Showing?

#### Check 1: Do you have a user ID?
The query requires `user.id`:
```typescript
.eq('user_id', user.id)
```

**Solution**: Make sure you're logged in (not just viewing as anonymous)

#### Check 2: Check Database Directly

Open Supabase dashboard and check the `cultivation_calendar` table:
```sql
SELECT * FROM cultivation_calendar WHERE user_id = 'your-user-id';
```

If the table is empty, the calendar entries weren't saved.

#### Check 3: Check Browser Console

Look for errors when loading the dashboard:
- `Error loading calendar:`
- `Error updating item:`
- Database permission errors

#### Check 4: RLS Policies

The `cultivation_calendar` table needs proper Row Level Security policies:
```sql
-- Users can view own calendar entries
CREATE POLICY "Users can view own calendar entries" 
  ON cultivation_calendar FOR SELECT 
  USING (auth.uid() = user_id);
```

---

## Quick Test: Add a Manual Entry

If you want to test the card immediately, add a test entry directly:

```sql
INSERT INTO cultivation_calendar (
  user_id,
  crop_name,
  crop_type,
  month,
  activity,
  climate_zone,
  garden_size,
  is_completed,
  notes
) VALUES (
  'your-user-id-here',
  'Tomat',
  'vegetable',
  'Maj',
  'sowing',
  'Svealand',
  '50',
  false,
  'Så tomater inomhus'
);
```

Then refresh your dashboard - the card should appear!

---

## What the Card Shows

Once visible, you'll see:

```
┌─────────────────────────────────────────────┐
│ 🌱 Odlingskalender framsteg          0%    │
│                                   0 av 12   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ⏱ Kom igång med dina odlingsuppgifter     │
│                         [📅 Visa kalender]  │
└─────────────────────────────────────────────┘
```

As you complete tasks in the cultivation calendar, the progress updates automatically!

---

## Expected Flow

1. **Create cultivation plan** → Generates monthly tasks
2. **Save plan** → Creates calendar entries (via `saveToCalendarEntries()`)
3. **View dashboard** → Progress card appears (if total > 0)
4. **Complete tasks** → Progress percentage increases
5. **Dashboard updates** → Shows current progress

---

## Current Limitation

⚠️ **The card only shows if you have created and saved a cultivation plan first.**

This is by design to avoid showing an empty card to users who haven't engaged with the cultivation features yet.

---

## Future Enhancement Ideas

To make the card more visible for new users:

1. **Show a placeholder card** with "Create your first cultivation plan"
2. **Add a getting started button** linking directly to cultivation planner
3. **Display seasonal recommendations** even without saved plans
4. **Show community progress** as motivation

---

## Developer Notes

### Where the Data Comes From

```typescript
// PersonalDashboard component loads data:
const { data, error } = await supabase
  .from('cultivation_calendar')
  .select('is_completed')
  .eq('user_id', user.id);

// Calculates progress:
const total = data?.length || 0;
const completed = data?.filter(item => item.is_completed).length || 0;
const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
```

### Where Calendar Entries Are Created

In `CultivationPlanner.tsx`, the `saveToCalendarEntries()` function:
1. Deletes existing entries for the user (to avoid duplicates)
2. Loops through `gardenPlan.monthlyTasks`
3. Creates a calendar entry for each task
4. Inserts all entries in one batch

### Why It Might Not Save

- User is not authenticated
- `gardenPlan.monthlyTasks` is empty or undefined
- Database permissions issue
- RLS policy blocking insert

---

**TL;DR**: Create and save a cultivation plan first, then the progress card will appear on your dashboard! 🌱

