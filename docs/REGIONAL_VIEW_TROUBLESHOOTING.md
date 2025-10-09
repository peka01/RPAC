# Regional View Troubleshooting - "0 aktiva samhällen"

## Issue

The regional view shows "0 aktiva samhällen" (0 active communities) even though there are active communities in the database.

## Root Cause

Existing communities in the database were created **before** the `county` field was added to the `local_communities` table, or they have `NULL` or empty string values in the `county` column.

The regional view queries communities by county:
```sql
SELECT * FROM local_communities 
WHERE county = 'Stockholm' 
  AND is_public = true;
```

If communities don't have their `county` field populated, they won't match any county filter.

## How Communities Get County Data

When creating new communities (after the county field was added), the code correctly sets the county:

```typescript
// In community-discovery.tsx (line 232-242)
const locationInfo = geographicService.parsePostalCode(userPostalCode);

const newCommunity = await communityService.createCommunity({
  community_name: createForm.name.trim(),
  location: locationInfo.city || locationInfo.county,
  postal_code: userPostalCode,
  county: locationInfo.county,  // ← County is set here
  is_public: createForm.isPublic,
  created_by: user.id
});
```

## Solution: Backfill County Data

### Option 1: Run SQL Migration (Recommended)

Execute the migration script to automatically populate county data for existing communities based on their postal codes:

**File:** `rpac-web/database/backfill-community-counties.sql`

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `backfill-community-counties.sql`
4. Click "Run"

**What it does:**
- Creates a PostgreSQL function `get_county_from_postal_code()`
- Maps postal code ranges to Swedish counties
- Updates all communities that have `postal_code` but no `county`
- Shows statistics of communities by county

### Option 2: Manual Update via Supabase Dashboard

If you prefer manual updates:

1. Open Supabase Dashboard → Table Editor
2. Select `local_communities` table
3. For each community without a county:
   - Look at the `postal_code` field
   - Determine the county from the postal code
   - Update the `county` field

**Postal Code to County Mapping:**
```
10-19: Stockholm
20-26: Skåne
27-28: Blekinge
29: Gotland
30-31: Halland
32-39: Jönköping/Kronoberg
40-49: Västra Götaland
50-59: Östergötland
60-64: Jönköping
65-69: Kronoberg
70-74: Örebro
75-77: Södermanland
78-79: Värmland
80-83: Gävleborg
84-86: Västernorrland
87-89: Jämtland
90-94: Västerbotten
95-98: Norrbotten
```

### Option 3: Verify Current State

To see which communities are missing county data:

```sql
-- Check communities without county
SELECT 
  id,
  community_name,
  location,
  postal_code,
  county,
  member_count,
  created_at
FROM local_communities
WHERE county IS NULL OR county = ''
ORDER BY created_at DESC;

-- Check communities by county (to see current distribution)
SELECT 
  county,
  COUNT(*) as community_count,
  SUM(member_count) as total_members
FROM local_communities
WHERE county IS NOT NULL
GROUP BY county
ORDER BY community_count DESC;
```

## Debugging Tools Added

The regional service now includes console logging to help debug county issues:

```typescript
console.log('[RegionalService] Fetching statistics for county:', county);
console.log('[RegionalService] Found communities:', communities?.length || 0, communities);
```

**To view logs:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to the Regional view (`/regional`)
4. Check the console output to see:
   - Which county is being queried
   - How many communities were found
   - The actual community data returned

## Verification Steps

After running the migration:

1. **Check the Database:**
   ```sql
   SELECT county, COUNT(*) as count
   FROM local_communities
   GROUP BY county
   ORDER BY count DESC;
   ```

2. **Refresh the Regional View:**
   - Navigate to `/regional` in your app
   - You should now see communities grouped by county

3. **Check Console Logs:**
   - Open browser console (F12)
   - Look for `[RegionalService]` logs
   - Verify communities are being found

4. **Test Different Counties:**
   - Update your user profile with different postal codes
   - Verify the regional view shows communities for that county

## Expected Results

After backfilling county data, the regional view should show:

### Statistics Cards
- **Aktiva samhällen**: Number of communities in the county
- **Totalt antal medlemmar**: Sum of all members across communities
- **Beredskapspoäng**: Average preparedness (currently 7.5 placeholder)
- **Aktiva hjälpbehov**: Count of pending/approved help requests

### Communities List
Each community with:
- Community name
- Location
- Member count
- Shared resources count
- Active help requests count

### Activity Feed
Recent events:
- New community registrations
- Resource sharing activities
- Help requests posted

## Future Prevention

All new communities created after this fix will automatically have their county field populated because the code in `community-discovery.tsx` and `community-discovery-mobile.tsx` correctly sets the county from the postal code.

The issue only affects **existing** communities created before the county field was properly implemented.

## Related Files

- **Migration script**: `rpac-web/database/backfill-community-counties.sql`
- **Regional service**: `rpac-web/src/lib/regional-service.ts`
- **Community creation**: `rpac-web/src/components/community-discovery.tsx`
- **Geographic parsing**: `rpac-web/src/lib/geographic-service.ts`

## Additional Notes

If you continue to see "0 aktiva samhällen" after running the migration:

1. **Verify your user's county**: Check your user profile to see which county is set
2. **Check if communities exist in that county**: Communities might exist but in a different county
3. **Verify postal codes**: Make sure communities have valid Swedish postal codes
4. **Check console logs**: Browser console will show exactly what's being queried

---

**Last Updated:** October 9, 2025  
**Status:** Migration script ready to run

