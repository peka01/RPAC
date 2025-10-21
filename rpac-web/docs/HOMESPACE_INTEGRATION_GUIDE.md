# 🏡 Homespace Integration Guide

## Quick Start: Adding Homespace to Your Community

This guide shows how to integrate the Homespace feature into the existing community pages.

## Step 1: Run Database Migration

```bash
# Navigate to rpac-web directory
cd rpac-web

# Run the migration in Supabase SQL Editor
# Copy contents of: database/add-community-homespace.sql
# Paste into Supabase SQL Editor and run
```

This will:
- ✅ Create `community_homespaces` and `homespace_activity_log` tables
- ✅ Set up RLS policies for security
- ✅ Create auto-generation triggers
- ✅ Backfill existing communities

## Step 2: Add Admin Card to Community Dashboard

In your community page component (e.g., `community-hub-enhanced.tsx`):

```tsx
import { useState, useEffect } from 'react';
import HomespaceAdminCard from '@/components/homespace-admin-card';
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export function CommunityHubEnhanced({ user }: Props) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [showHomespaceEditor, setShowHomespaceEditor] = useState(false);
  const [homespaceData, setHomespaceData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Load homespace data
  useEffect(() => {
    if (activeCommunityId && user) {
      loadHomespaceData();
    }
  }, [activeCommunityId, user]);

  const loadHomespaceData = async () => {
    // Check if user is admin
    const { data: community } = await supabase
      .from('local_communities')
      .select('user_id')
      .eq('id', activeCommunityId)
      .single();
    
    setIsAdmin(community?.user_id === user.id);

    // Load homespace
    const { data: homespace } = await supabase
      .from('community_homespaces')
      .select('*')
      .eq('community_id', activeCommunityId)
      .single();
    
    setHomespaceData(homespace);
  };

  return (
    <div>
      {/* Your existing community content */}
      
      {/* Add Homespace Admin Card */}
      {isAdmin && homespaceData && !showHomespaceEditor && (
        <div className="mb-6">
          <HomespaceAdminCard
            communityId={activeCommunityId}
            communityName={community.name}
            homespaceSlug={homespaceData.slug}
            isPublished={homespaceData.published}
            onEditClick={() => setShowHomespaceEditor(true)}
          />
        </div>
      )}

      {/* Show Editor When Opened */}
      {showHomespaceEditor && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <HomespaceEditorWrapper
            communityId={activeCommunityId}
            userId={user.id}
            onClose={() => {
              setShowHomespaceEditor(false);
              loadHomespaceData(); // Reload data after editing
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## Step 3: Test the Integration

### As Community Admin:

1. **Navigate to your community page** (`/local`)
2. **Look for the Homespace admin card** (green card with globe icon)
3. **Click "Redigera hemsida"** (Edit homepage)
4. **Edit content:**
   - Update "Om vårt samhälle" section
   - Customize membership criteria
   - Choose banner pattern
   - Configure privacy settings
5. **Toggle "Publicera"** to make it live
6. **Click "Visa offentlig sida"** to see the public view

### As Public Visitor:

1. **Visit** `beready.se/[your-community-slug]`
2. **Verify sections show correctly:**
   - Hero with community name
   - About section
   - Resources (if enabled)
   - Preparedness score (if enabled)
   - Activities
   - Skills (if enabled)
   - Membership info
3. **Test CTAs:**
   - "Ansök om medlemskap"
   - "Kontakta administratör"

## Step 4: Customize Default Template (Optional)

If you want to change the default template text, modify the trigger function in the migration file:

```sql
-- In: database/add-community-homespace.sql
-- Find the auto_create_homespace() function
-- Edit the default_about text template
```

## Common Integration Points

### Add Link to Navigation Menu

```tsx
// In side-menu.tsx or navigation component
{isAdmin && (
  <Link href="/local?view=homespace">
    <Globe className="mr-3" size={20} />
    Samhällets hemsida
  </Link>
)}
```

### Add to Community Settings

```tsx
// In community settings page
<div className="bg-white rounded-2xl p-6 shadow-lg">
  <h3 className="text-xl font-bold mb-4">Offentlig hemsida</h3>
  <p className="text-gray-600 mb-4">
    Anpassa hur ditt samhälle presenteras för allmänheten
  </p>
  <button
    onClick={() => navigate('/local?view=homespace')}
    className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold"
  >
    Hantera hemsida
  </button>
</div>
```

### Add to Onboarding Flow

When a user creates a new community, prompt them to customize their homespace:

```tsx
// After community creation
{newCommunity && (
  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mt-6">
    <h3 className="text-xl font-bold text-green-900 mb-2">
      🎉 Samhälle skapat!
    </h3>
    <p className="text-green-700 mb-4">
       Vill du anpassa din samhälles offentliga hemsida?
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => openHomespaceEditor(newCommunity.id)}
        className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Ja, anpassa nu
      </button>
      <button
        onClick={() => setNewCommunity(null)}
        className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border"
      >
        Gör det senare
      </button>
    </div>
  </div>
)}
```

## Mobile Integration

For mobile views, you can add a similar card or menu item:

```tsx
// In mobile navigation or community mobile view
{isAdmin && (
  <button
    onClick={() => setShowHomespaceEditor(true)}
    className="w-full bg-gradient-to-r from-[#5C6B47] to-[#3D4A2B] text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <Globe size={24} />
      <div className="text-left">
         <div className="font-bold">Samhällets hemsida</div>
        <div className="text-sm text-white/80">
          {homespace?.published ? 'Publicerad' : 'Utkast'}
        </div>
      </div>
    </div>
    <ChevronRight size={20} />
  </button>
)}
```

## Troubleshooting

### Homespace not auto-created for existing community

```sql
-- Run this SQL to manually create homespace
INSERT INTO community_homespaces (
  community_id,
  slug,
  about_text,
  published
)
SELECT 
  id,
  lower(regexp_replace(community_name, '[^a-zA-Z0-9]', '-', 'g')),
  'Default about text...',
  false
FROM local_communities
WHERE id = 'YOUR_COMMUNITY_ID'
AND NOT EXISTS (
  SELECT 1 FROM community_homespaces WHERE community_id = local_communities.id
);
```

### User can't access editor (not admin)

Check if user is the community creator:

```sql
SELECT lc.community_name, lc.user_id, u.email
FROM local_communities lc
JOIN auth.users u ON u.id = lc.user_id
WHERE lc.id = 'YOUR_COMMUNITY_ID';
```

### Public URL not working

1. **Check if published:**
   ```sql
   SELECT slug, published FROM community_homespaces WHERE community_id = 'YOUR_COMMUNITY_ID';
   ```

2. **Verify Next.js route exists:**
   - File should exist: `src/app/[samhalle]/page.tsx`

3. **Test with direct access:**
   ```
   http://localhost:3000/[your-slug]
   ```

### Slug conflicts

If two communities have the same name, the system auto-appends `-2`, `-3`, etc.

To manually fix:

```sql
UPDATE community_homespaces 
SET slug = 'your-unique-slug'
WHERE community_id = 'YOUR_COMMUNITY_ID';
```

## Testing Checklist

- [ ] Admin can see Homespace card in community dashboard
- [ ] Admin can open editor by clicking "Redigera"
- [ ] Editor loads with default template
- [ ] Changes are saved (check auto-save after 30s)
- [ ] Toggle publish status works
- [ ] Public URL is accessible when published
- [ ] Public URL shows 404 when unpublished
- [ ] Non-admins cannot access editor
- [ ] Privacy toggles work (resources, preparedness, etc.)
- [ ] Mobile view is responsive
- [ ] Markdown renders correctly in About section
- [ ] All text is in Swedish (no hardcoded English)

## Next Steps

Once integrated:

1. **Announce to community admins** that they can customize their homespace
2. **Share example homespace URLs** to show what's possible
3. **Collect feedback** on editor usability
4. **Monitor usage** via `views_count` in database
5. **Plan Phase 2 features** (image uploads, analytics, etc.)

## Support

For issues or questions:
- Check `docs/HOMESPACE_FEATURE.md` for full documentation
- Review database schema in `database/add-community-homespace.sql`
- Inspect component code in `src/components/`
- Test with sample data in development

---

**Happy integrating!** 🏡✨

