# 🏡 Community Homespace Feature

## Overview
The Community Homespace feature provides each samhälle with a public-facing website that can be customized by community administrators. Think of it as a "digital community board" or "community storefront" that builds transparency and trust.

## 🎯 Goals
- **Transparency**: Show community strength without exposing vulnerabilities
- **Recruitment**: Make it easy for potential members to discover and learn about communities
- **Trust**: Build credibility through visible preparedness capabilities
- **Network Effects**: Enable inter-community discovery and collaboration

## 📐 Architecture

### URL Structure
```
beready.se/[samhalle-slug]

Examples:
- beready.se/vasastan-stockholm
- beready.se/lund-centrum
- beready.se/goteborg-majorna
```

### Database Schema

**Tables:**
1. `community_homespaces` - Main homespace data and settings
2. `homespace_activity_log` - Activity feed for community events

**Key Features:**
- Auto-created when community is created (via trigger)
- Unique slug generation from community name
- Granular privacy controls
- View count tracking
- SEO optimization

### Components

**Public Components:**
- `community-homespace.tsx` - Public-facing homespace page
- `[samhalle]/page.tsx` - Dynamic route handler
- `[samhalle]/not-found.tsx` - 404 page

**Admin Components:**
- `homespace-editor.tsx` - Full-featured editor interface
- `homespace-editor-wrapper.tsx` - Access control wrapper
- `homespace-admin-card.tsx` - Dashboard card for admins

## 🎨 Features

### Public Sections (Customizable Visibility)

1. **Hero Section**
   - Community name and location
   - Member count
   - Founded year
   - CTA buttons (Apply, Contact)

2. **About Section**
   - Rich text/Markdown support
   - Community values and description
   - What the community does together

3. **Resources Section**
   - Category-based resource counts
   - Visual icons for each category
   - Privacy: Show counts publicly, details to members only

4. **Preparedness Score**
   - Aggregate community preparedness (0-100)
   - Category breakdown (Food, Water, Energy, etc.)
   - Status labels (Strong, Good, Developing, Needs Improvement)

5. **Activity Feed**
   - Recent community events
   - Member joins (optional)
   - Resource additions
   - Milestones and exercises

6. **Skills Section**
   - Available competencies (VVS, Elarbete, etc.)
   - Aggregate view (not individual names)
   - Skill badges/tags

7. **Membership Section**
   - Who can join criteria
   - Admin contact (optional)
   - Apply for membership CTA

### Editor Features

**Content Management:**
- Rich text editor for "About" section
- Membership criteria editor
- Markdown support
- Auto-save every 30 seconds

**Visual Customization:**
- 4 banner patterns (olive gradients)
- Custom banner image upload (planned)
- URL slug customization
- Accent color picker (planned)

**Privacy Controls:**
- Toggle resource visibility
- Toggle preparedness score visibility
- Toggle member activity visibility
- Toggle admin contact visibility
- Toggle skills visibility

**Publishing:**
- Draft/Published status toggle
- Live preview mode
- Public link copy
- SEO metadata auto-generated

## 🔐 Security & Privacy

### Access Control
- **Public**: Anyone can view published homespaces
- **Members**: See enhanced details (resource specifics, member directory)
- **Admins**: Full edit access via RLS policies

### Privacy-First Design
- **Aggregate Data Only**: Show counts, not specifics
- **Optional Visibility**: Admin controls what's public
- **Safe Defaults**: Conservative privacy settings by default
- **No Personal Data**: Individual names/addresses never shown publicly

### RLS Policies
```sql
-- Public can view published homespaces
CREATE POLICY "Public can view published homespaces"
  ON community_homespaces FOR SELECT
  USING (published = true);

-- Admins can manage their homespace
CREATE POLICY "Admins can manage their homespace"
  ON community_homespaces FOR ALL
  USING (
    community_id IN (
      SELECT lc.id FROM local_communities lc
      WHERE lc.user_id = auth.uid()
    )
  );
```

## 🚀 Usage

### For Community Administrators

1. **Access Editor:**
   ```tsx
   // In community dashboard
   <HomespaceAdminCard
     communityId={community.id}
     communityName={community.name}
     homespaceSlug={homespace.slug}
     isPublished={homespace.published}
     onEditClick={() => setShowEditor(true)}
   />
   ```

2. **Edit Content:**
   - Navigate to editor via admin card
   - Edit "About" and "Membership Criteria" sections
   - Choose visual customization
   - Configure privacy settings
   - Save changes (auto-saved every 30s)

3. **Publish:**
   - Toggle "Published" status
   - Copy public link
   - Share on social media, local bulletin boards, etc.

### For Developers

**Add homespace editor to community page:**
```tsx
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import HomespaceAdminCard from '@/components/homespace-admin-card';

// In your community component
{isAdmin && (
  <HomespaceAdminCard
    communityId={community.id}
    communityName={community.name}
    homespaceSlug={homespace?.slug}
    isPublished={homespace?.published}
    onEditClick={() => setShowHomespaceEditor(true)}
  />
)}

{showHomespaceEditor && (
  <HomespaceEditorWrapper
    communityId={community.id}
    userId={user.id}
    onClose={() => setShowHomespaceEditor(false)}
  />
)}
```

**Fetch homespace data:**
```typescript
const { data: homespace } = await supabase
  .from('community_homespaces')
  .select(`
    *,
    communities:local_communities (
      community_name,
      county,
      member_count
    )
  `)
  .eq('community_id', communityId)
  .single();
```

## 📊 Analytics (Future)

Planned analytics for community admins:
- View count tracking ✅ (implemented)
- Membership applications from homespace
- External traffic sources
- Most viewed sections
- Time on page
- Conversion rate (visitors → members)

## 🎯 Future Enhancements

### Phase 2 Features
- [ ] Custom banner image upload
- [ ] Advanced accent color picker
- [ ] Activity log manual entries
- [ ] Photo galleries
- [ ] Embedded maps showing community area
- [ ] QR code generator for offline sharing

### Phase 3 Features
- [ ] Analytics dashboard
- [ ] Public community directory/search
- [ ] Comparison mode (compare multiple communities)
- [ ] Embed widgets for external websites
- [ ] Social media preview card customization
- [ ] Multi-language support

## 🐛 Testing Checklist

- [ ] Create new community → Homespace auto-created
- [ ] Edit homespace as admin → Changes saved
- [ ] Toggle publish status → Visibility changes
- [ ] Access as non-admin → Permission denied
- [ ] Visit public URL → Homespace loads correctly
- [ ] Visit invalid URL → 404 page shows
- [ ] Auto-save works after 30 seconds
- [ ] Privacy toggles work correctly
- [ ] Markdown renders correctly
- [ ] Mobile responsive design
- [ ] SEO metadata generated correctly

## 📝 Localization

All strings are in `rpac-web/src/lib/locales/sv.json` under the `homespace` key:

```json
{
  "homespace": {
    "title": "Samhällets hemsida",
    "edit": "Redigera hemsida",
    "preview": "Förhandsgranska",
    ...
  }
}
```

## 🎨 Design Principles

Following RPAC conventions:
- ✅ Olive green color palette (#3D4A2B, #5C6B47)
- ✅ Everyday Swedish text (not military jargon)
- ✅ Semi-military visual design (clean, professional)
- ✅ Mobile-first responsive design
- ✅ All text via t() function
- ✅ Touch-optimized (44px+ targets)
- ✅ Privacy-first approach

## 🔗 Related Files

**Database:**
- `rpac-web/database/add-community-homespace.sql`

**Components:**
- `rpac-web/src/components/community-homespace.tsx`
- `rpac-web/src/components/homespace-editor.tsx`
- `rpac-web/src/components/homespace-editor-wrapper.tsx`
- `rpac-web/src/components/homespace-admin-card.tsx`

**Routes:**
- `rpac-web/src/app/[samhalle]/page.tsx`
- `rpac-web/src/app/[samhalle]/not-found.tsx`

**Localization:**
- `rpac-web/src/lib/locales/sv.json` (homespace section)

## 📚 References

- Design inspiration: "Digital Samhällstavla" (Community Board)
- UX philosophy: Transparency builds trust
- Privacy approach: Show strength, not vulnerabilities
- Goal: Make preparedness visible and attractive

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Complete - Ready for integration and testing

