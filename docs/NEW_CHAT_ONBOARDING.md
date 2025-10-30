# 🚀 RPAC - New Chat Onboarding Guide

**Purpose:** This guide ensures every new AI chat session starts with complete context.

---

## 📋 Essential Context Files (Read These First)

When starting a new chat, **ALWAYS** read these files in this order:

### 1. **Core Project Understanding**
```
📖 docs/charter.md - Project vision, mission, and goals
📖 docs/architecture.md - Technical architecture and design decisions
📖 docs/roadmap.md - Current priorities and sprint focus
```

### 2. **Development Standards**
```
📖 docs/conventions.md - Development rules, UX principles, color palette, mobile standards
📖 docs/llm_instructions.md - AI context, current status, component standards
📖 .cursorrules - Quick reference rules (points to the above docs)
```

### 3. **Development History** (Optional - for context on specific features)
```
📖 docs/dev_notes.md - Complete development history (append-only log)
```

---

## 🎯 Quick Start Summary

### Project Identity
- **Name:** BeReady - Resilience & Preparedness AI Companion
- **Language:** Swedish-first (all UI text in `rpac-web/src/lib/locales/sv.json`)
- **Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Supabase
- **Focus:** Offline-first crisis preparedness for Swedish users

### Current Phase Status
- ✅ **Phase 1 (Individual):** COMPLETE - Full preparedness system with AI integration
- ✅ **Phase 2 (Local Community):** COMPLETE - Complete community ecosystem
  - Community discovery and management
  - Resource sharing (shared, owned, help requests)
  - Real-time messaging (community & direct)
  - Activity feed and notifications
  - Community homespace (public pages)
  - Admin tools and analytics
- 🔄 **Phase 3 (Regional):** IN PROGRESS - Basic structure, needs cross-community features

### Critical Development Server Info
```bash
# ALWAYS run from rpac-web subdirectory (NOT root)
cd rpac-web
npm run dev

# DO NOT run "npm run build" after every change
# Development server hot-reloads automatically
```

---

## 🎨 Design System Essentials

### Color Palette (Olive Green - NOT Blue!)
```typescript
Primary: #3D4A2B    // Main actions, navigation
Dark: #2A331E       // Hover states, emphasis  
Light: #5C6B47      // Secondary elements
Gray: #4A5239       // Backgrounds, cards
Muted: #707C5F      // Text, icons
```

**❌ FORBIDDEN:** Any blue colors (`bg-blue-*`, `text-blue-*`, `border-blue-*`)

### Text Standards (ZERO TOLERANCE)
```tsx
// ❌ WRONG - Hardcoded Swedish
<h1>Hitta lokala samhällen</h1>

// ✅ CORRECT - Always use t() function
<h1>{t('community.find_local')}</h1>
```

**Rule:** ALL user-facing text MUST use `t()` from `rpac-web/src/lib/locales/sv.json`

### UX Philosophy
- **Visual Design:** Semi-military (clean, professional, olive green)
- **Text Content:** Everyday Swedish (warm, accessible, NO military jargon)

**Examples:**
- ✅ Good: "Laddar ditt hem" (Loading your home)
- ❌ Bad: "Initialiserar beredskapssystem" (Initializing system)

---

## 📱 Mobile-First Requirements

**MANDATORY Pattern:**
```
component-name.tsx              ← Desktop version
component-name-mobile.tsx       ← Mobile version  
component-name-responsive.tsx   ← Wrapper (switches at 768px)
```

**Touch Targets:**
- Minimum: 44px × 44px
- Preferred: 48px × 48px
- Important actions: 56px × 56px

**Required Classes:**
```tsx
className="touch-manipulation active:scale-98 transition-all"
```

---

## 🧩 Standard Components (MUST USE)

### ResourceListView - Universal List Component
**Location:** `rpac-web/src/components/resource-list-view.tsx`

**USE FOR:**
- ✅ All resource lists (shared, owned, inventory)
- ✅ All user/member lists
- ✅ All task lists
- ✅ Any data shown as cards or tables
- ✅ Any list with search/filter

**❌ DO NOT:**
- Build custom table components
- Create custom search/filter UI
- Duplicate list functionality

**Quick Example:**
```tsx
import { ResourceListView } from '@/components/resource-list-view';

<ResourceListView
  items={data}
  columns={tableColumns}
  cardRenderer={CardComponent}
  searchPlaceholder="Sök..."
/>
```

---

## 🗄️ Database & Supabase

**Schema Reference:** `rpac-web/database/supabase-schema-complete.sql`

**Migration Rules:**
- ❌ NO `CREATE POLICY IF NOT EXISTS` (PostgreSQL doesn't support it)
- ✅ USE `DROP POLICY IF EXISTS` then `CREATE POLICY`
- ✅ Wrap conditional logic in `DO $$ ... END $$` blocks
- ✅ Always verify table/column names in schema before creating migrations

---

## 📚 Documentation Standards

### Where to Document What

1. **New Features:** Add to `docs/dev_notes.md` (append-only, dated entries)
2. **Development Patterns:** Update `docs/conventions.md`
3. **Architecture Changes:** Update `docs/architecture.md`
4. **Priority Changes:** Update `docs/roadmap.md`

**❌ DO NOT:**
- Create separate `FEATURE_COMPLETE_*.md` files
- Create separate `SESSION_*.md` files
- Create separate `FIX_*.md` files
- Create separate `BUGFIX_*.md` files

**Single source of truth:** Core docs + `dev_notes.md` for history

---

## ✅ Pre-Commit Checklist

Before finishing ANY task:

- [ ] No hardcoded Swedish text (search for åäöÅÄÖ in .tsx files)
- [ ] Using olive green colors (#3D4A2B family), NOT blue
- [ ] All text uses t() function from sv.json
- [ ] Mobile-optimized (44px+ touch targets)
- [ ] Follows proven UX patterns
- [ ] Updated dev_notes.md with changes
- [ ] Matches existing visual styles

---

## 🎯 Current Priorities (October 30, 2025)

Check `docs/roadmap.md` for latest, but as of Oct 30, 2025:

**Recently Completed:**
- ✅ Community messaging system (community & direct) - COMPLETE
- ✅ Resource sharing & help requests - COMPLETE
- ✅ AI integration (OpenAI GPT-4) - COMPLETE
- ✅ Navigation system (Professional collapsible sidebar) - COMPLETE
- ✅ Notification center (State-of-the-art realtime system) - COMPLETE
- ✅ Community homespace (Public pages with custom URLs) - COMPLETE
- ✅ Super Admin system (User/community management) - COMPLETE
- ✅ Activity feed (Real-time community activity) - COMPLETE
- ✅ Help request system (Request & response workflow) - COMPLETE
- ✅ Security hardening (Input validation, sanitization) - COMPLETE
- ✅ Production polish (Removed all debug logging) - COMPLETE

**Current Focus:**
- 🔄 Regional coordination features (cross-community)
- 📋 Advanced community analytics
- 📋 Push notifications for mobile
- 📋 Enhanced crisis coordination
- 📋 License/payment integration (Stripe/Swish)

---

## �️ Quick Route Reference

**Main Routes:**
- `/` or `/dashboard` - Main overview with preparedness score
- `/individual` - Personal preparedness (add `?section=resources|cultivation|knowledge|coach`)
- `/local` - Community hub (add `?tab=home|activity|resources|messages|admin`)
- `/regional` - Regional coordination and official resources
- `/settings` - User settings and profile management

**Community Sub-Routes:**
- `/local/discover` - Find and join communities
- `/local/messages/community` - Community group chat (all members)
- `/local/messages/direct` - Direct messaging (1-on-1)
- `/local?tab=resources&resourceTab=shared|owned|help` - Resource management

**Special Routes:**
- `/[samhalle]` - Public community pages (e.g., `/nykulla`, `/vasastan-stockholm`)
- `/invite/[code]` - Community invitation acceptance
- `/super-admin` - Admin dashboard (super_admin tier only)
- `/auth/callback` - Supabase auth callback

**API Routes:**
- `/api/weather` - SMHI weather data
- `/api/admin/*` - Admin-only endpoints (protected)

---

## �🚫 Common Mistakes to Avoid

1. ❌ Using blue colors instead of olive green
2. ❌ Hardcoding Swedish text instead of t()
3. ❌ Creating separate documentation markdown files
4. ❌ Technical/military jargon in user-facing text
5. ❌ Not following mobile-first design
6. ❌ Running `npm run dev` from project root instead of `rpac-web/`
7. ❌ Running `npm run build` after every code change
8. ❌ Creating custom list components instead of using ResourceListView

---

## 💡 When in Doubt

1. Look at existing similar components
2. Check `docs/conventions.md` for the rule
3. Check `docs/dev_notes.md` for implementation history
4. For SQL: Check `supabase-schema-complete.sql` for table/column names
5. Match existing patterns, don't create new ones

---

## 🎓 Exemplary Reference Components

Study these for best practices:

**Mobile:**
- `individual-mobile-nav.tsx` - Navigation patterns
- `stunning-dashboard-mobile.tsx` - Score displays
- `simple-cultivation-manager-mobile.tsx` - CRUD operations
- `community-hub-mobile-enhanced.tsx` - Swipeable navigation

**Desktop:**
- `community-resource-hub.tsx` - Tabbed lists with ResourceListView
- `unified-profile-settings.tsx` - Form handling, progressive disclosure
- `messaging-system-v2.tsx` - Real-time updates, clean UI
- `simple-cultivation-manager.tsx` - Plan management, nutrition analysis

---

## 📞 Getting Started Commands

```bash
# 1. Navigate to correct directory
cd rpac-web

# 2. Install dependencies (if first time)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

---

## 🎯 Success Criteria

You're onboarded when you can answer:

- ✅ What colors does RPAC use? (Olive green, NOT blue)
- ✅ Where does all Swedish text go? (sv.json via t() function)
- ✅ What's the UX philosophy? (Military visual + everyday Swedish text)
- ✅ What component do I use for lists? (ResourceListView)
- ✅ What's the mobile pattern? (Separate `-mobile.tsx` components)
- ✅ Where do I run `npm run dev`? (rpac-web/ subdirectory)
- ✅ Where do I document features? (dev_notes.md, NOT separate files)

---

**Remember:** BeReady = Professional capability (military visual design) + Human warmth (everyday Swedish text)

**Last Updated:** October 9, 2025

