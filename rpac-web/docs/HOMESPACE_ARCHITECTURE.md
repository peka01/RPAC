# 🏗️ Homespace Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMMUNITY HOMESPACE SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC ACCESS                            │
│                                                                   │
│  👤 Public Visitor                                               │
│      │                                                            │
│      └─> beready.se/[samhalle-slug]                             │
│                │                                                  │
│                ▼                                                  │
│         Next.js Dynamic Route                                    │
│         (/app/[samhalle]/page.tsx)                              │
│                │                                                  │
│                ▼                                                  │
│         Fetch from Supabase                                      │
│         (WHERE published = true)                                 │
│                │                                                  │
│                ▼                                                  │
│      CommunityHomespace Component                                │
│      ┌─────────────────────────┐                                │
│      │ • Hero Section          │                                │
│      │ • About                 │                                │
│      │ • Resources (counts)    │                                │
│      │ • Preparedness Score    │                                │
│      │ • Activity Feed         │                                │
│      │ • Skills                │                                │
│      │ • Membership Info       │                                │
│      └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN ACCESS                              │
│                                                                   │
│  👨‍💼 Community Admin                                              │
│      │                                                            │
│      └─> /local (Community Dashboard)                           │
│                │                                                  │
│                ▼                                                  │
│      HomespaceAdminCard Component                                │
│      ┌─────────────────────────┐                                │
│      │ • Status (Published)    │                                │
│      │ • Edit Button           │                                │
│      │ • View Public Button    │                                │
│      └─────────────────────────┘                                │
│                │                                                  │
│        [Click "Edit"]                                            │
│                │                                                  │
│                ▼                                                  │
│      HomespaceEditorWrapper                                      │
│      (Access Control Check)                                      │
│                │                                                  │
│                ▼                                                  │
│      HomespaceEditor Component                                   │
│      ┌─────────────────────────────────┐                        │
│      │ Editor Tab │ Preview Tab        │                        │
│      ├─────────────────────────────────┤                        │
│      │ • Content Editor                │                        │
│      │   - About Text (Markdown)       │                        │
│      │   - Membership Criteria         │                        │
│      │                                 │                        │
│      │ • Visual Customization          │                        │
│      │   - Banner Patterns (4)         │                        │
│      │   - URL Slug                    │                        │
│      │                                 │                        │
│      │ • Privacy Settings              │                        │
│      │   - Show Resources Public       │                        │
│      │   - Show Preparedness Public    │                        │
│      │   - Show Activities             │                        │
│      │   - Show Admin Contact          │                        │
│      │   - Show Skills Public          │                        │
│      │                                 │                        │
│      │ • Actions                       │                        │
│      │   - Save (Auto every 30s)       │                        │
│      │   - Publish/Unpublish Toggle    │                        │
│      │   - View Public                 │                        │
│      │   - Reset to Template           │                        │
│      └─────────────────────────────────┘                        │
│                │                                                  │
│        [Save Changes]                                            │
│                │                                                  │
│                ▼                                                  │
│         Supabase Update                                          │
│         (community_homespaces)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE TABLES                             │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────┐
│ local_communities     │
├───────────────────────┤
│ id (PK)              │◄────────┐
│ user_id              │         │ One-to-One
│ community_name       │         │
│ county               │         │
│ member_count         │         │
└───────────────────────┘         │
                                  │
                                  │
┌───────────────────────────────┐ │
│ community_homespaces          │ │
├───────────────────────────────┤ │
│ id (PK)                      │ │
│ community_id (FK, UNIQUE) ───┘
│ slug (UNIQUE)                │
│                              │
│ -- Content                   │
│ about_text                   │
│ membership_criteria          │
│                              │
│ -- Visual                    │
│ custom_banner_url            │
│ banner_pattern               │
│ accent_color                 │
│                              │
│ -- Privacy Settings          │
│ show_resources_public        │
│ show_preparedness_public     │
│ show_member_activities       │
│ show_admin_contact           │
│ show_skills_public           │
│                              │
│ -- Publishing                │
│ published                    │
│                              │
│ -- Analytics                 │
│ views_count                  │
│ last_viewed_at               │
│                              │
│ -- Meta                      │
│ created_at                   │
│ last_updated                 │
└───────────────────────────────┘
         │
         │ One-to-Many
         │
         ▼
┌───────────────────────────────┐
│ homespace_activity_log        │
├───────────────────────────────┤
│ id (PK)                      │
│ community_id (FK)            │
│ activity_type                │
│ title                        │
│ description                  │
│ icon                         │
│ visible_public               │
│ created_at                   │
└───────────────────────────────┘
```

## Data Flow

### Community Creation Flow

```
1. User creates community
   └─> local_communities table INSERT
       │
       ▼
2. Trigger: auto_create_homespace()
   └─> Generates slug from community name
       │
       ▼
3. community_homespaces table INSERT
   └─> Default template populated
       └─> published = false (draft)
           └─> Ready for admin customization
```

### Member Join Flow (Activity Log)

```
1. User joins community
   └─> community_memberships table INSERT
       │
       ▼
2. Trigger: log_member_joined()
   └─> Check: show_member_activities = true?
       │
       ├─> YES: Create activity log entry
       │   └─> homespace_activity_log INSERT
       │       └─> visible_public = true
       │
       └─> NO: Skip (privacy setting)
```

### Public View Flow

```
1. Visitor navigates to beready.se/[slug]
   │
   ▼
2. Next.js dynamic route: [samhalle]/page.tsx
   │
   ▼
3. Server-side query:
   SELECT * FROM community_homespaces
   WHERE slug = '[slug]' 
   AND published = true
   │
   ├─> Found: Render homespace
   │   │
   │   ├─> Increment views_count (async)
   │   │
   │   └─> Return CommunityHomespace component
   │
   └─> Not found: Return 404 page
```

### Edit & Publish Flow

```
1. Admin clicks "Edit" in dashboard
   │
   ▼
2. HomespaceEditorWrapper
   └─> Access check: user_id = community.user_id?
       │
       ├─> YES: Load HomespaceEditor
       │   │
       │   ├─> Fetch current homespace data
       │   │
       │   ├─> Admin makes changes
       │   │
       │   ├─> Auto-save every 30s
       │   │   └─> UPDATE community_homespaces
       │   │
       │   └─> Manual save
       │       └─> UPDATE community_homespaces
       │           └─> last_updated = NOW()
       │
       └─> NO: Show "Not Admin" error
           └─> Redirect to community page
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY (RLS)                      │
└─────────────────────────────────────────────────────────────────┘

community_homespaces policies:

1. "Public can view published homespaces"
   FOR SELECT
   USING (published = true)
   
   → Anyone can read published homespaces
   → Unpublished homespaces are hidden

2. "Admins can manage their homespace"
   FOR ALL
   USING (
     community_id IN (
       SELECT id FROM local_communities 
       WHERE user_id = auth.uid()
     )
   )
   
   → Community creators can CRUD their homespace
   → Non-creators cannot modify

3. "Members can view their community homespace"
   FOR SELECT
   USING (
     published = true OR
     community_id IN (
       SELECT community_id FROM community_memberships
       WHERE user_id = auth.uid()
     )
   )
   
   → Members can preview unpublished homespace
   → Non-members cannot

homespace_activity_log policies:

1. "Public can view public activities"
   FOR SELECT
   USING (
     visible_public = true AND
     community_id IN (
       SELECT community_id FROM community_homespaces 
       WHERE published = true
     )
   )
   
   → Only public activities shown
   → Only for published homespaces

2. "Admins can manage activity log"
   FOR ALL
   USING (
     community_id IN (
       SELECT lc.id FROM local_communities lc
       WHERE lc.user_id = auth.uid()
     )
   )
   
   → Admins can create/edit/delete activities
```

## Component Hierarchy

```
Public View:
┌─────────────────────────────────────┐
│ [samhalle]/page.tsx (Route)        │
│  └─> CommunityHomespace            │
│       ├─> Hero Section              │
│       ├─> About Section             │
│       │    └─> ReactMarkdown        │
│       ├─> Resources Section         │
│       │    └─> Category Cards       │
│       ├─> Preparedness Section      │
│       │    └─> Score Bars           │
│       ├─> Activity Feed             │
│       │    └─> Activity Items       │
│       ├─> Skills Section            │
│       │    └─> Skill Badges         │
│       └─> Membership Section        │
│            └─> Contact Form Modal   │
└─────────────────────────────────────┘

Admin View:
┌──────────────────────────────────────┐
│ Community Dashboard                  │
│  └─> HomespaceAdminCard             │
│       │                              │
│       [Click "Edit"]                 │
│       │                              │
│       ▼                              │
│  HomespaceEditorWrapper             │
│   └─> HomespaceEditor               │
│        ├─> Editor Tab                │
│        │    ├─> Content Section      │
│        │    │    ├─> About Textarea  │
│        │    │    └─> Criteria Textarea│
│        │    ├─> Visual Section       │
│        │    │    ├─> Banner Picker   │
│        │    │    └─> Slug Input      │
│        │    └─> Privacy Section      │
│        │         └─> Toggle Switches │
│        │                              │
│        └─> Preview Tab               │
│             └─> CommunityHomespace   │
│                  (isPreview=true)    │
└──────────────────────────────────────┘
```

## URL Routing Strategy

```
Public URLs (SEO-friendly):
beready.se/vasastan-stockholm    ✅ Published homespace
beready.se/lund-centrum          ✅ Published homespace
beready.se/invalid-slug          ❌ 404 Not Found

Admin URLs (authenticated):
/local                           → Community dashboard
/local?communityId=xxx           → Specific community
                                    (shows HomespaceAdminCard)

Editor URLs (future improvement):
/local/homespace/edit?id=xxx     → Direct editor access
/local/homespace/analytics?id=xxx → Analytics dashboard
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE STRATEGIES                         │
└─────────────────────────────────────────────────────────────────┘

1. Static Generation (ISR)
   - Next.js generateStaticParams()
   - Pre-render published homespaces
   - Revalidate every hour (3600s)
   
2. Database Indexing
   - CREATE INDEX idx_homespaces_slug ON community_homespaces(slug)
   - CREATE INDEX idx_homespaces_published WHERE published = true
   - Fast lookups by slug
   
3. Auto-save Throttling
   - Save every 30 seconds (not on every keystroke)
   - Prevents database spam
   - Non-blocking async saves
   
4. View Count Tracking
   - Fire-and-forget async update
   - Doesn't block page render
   - Batched updates possible (future)
   
5. Image Optimization (future)
   - Next.js Image component
   - Automatic WebP conversion
   - Responsive image sizing
```

## Scalability Considerations

```
Current Scale:
- Up to 1000 communities: ✅ No issues
- Up to 10,000 communities: ✅ With proper indexing
- Up to 100,000 communities: ⚠️ May need caching layer

Future Optimizations:
1. Redis caching for frequently viewed homespaces
2. CDN caching for static assets
3. Database read replicas for heavy read load
4. Incremental Static Regeneration (ISR) for all pages
5. GraphQL for efficient data fetching
```

---

**Architecture Status:** ✅ Production-ready  
**Last Updated:** October 21, 2025  
**Review Next:** When implementing Phase 2 features

