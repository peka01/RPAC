# LLM Integration Guidelines

## Project Identity

Detta projekt är **RPAC - Resilience & Preparedness AI Companion**, fokuserat på svenskspråkiga, offline-redo kris- och beredskapsverktyg.

## ⚠️ CRITICAL: Development Server Location

**ALWAYS start the development server from the `rpac-web` directory!**

```bash
# ❌ WRONG - Do NOT run from project root
cd C:\Users\Per Karlsson\code\RPAC
npm run dev  # ERROR: Cannot find package.json

# ✅ CORRECT - Always run from rpac-web subdirectory
cd C:\Users\Per Karlsson\code\RPAC\rpac-web
npm run dev  # SUCCESS!
```

**Common Mistake**: Running `npm run dev` from the root `RPAC` directory will fail because `package.json` is located in the `rpac-web` subdirectory.

### ⚡ Build vs Development Server

**FOR AI ASSISTANTS**: Do NOT run `npm run build` after every code change!

- **During development**: Use `npm run dev` only (hot reload handles updates)
- **Build ONLY when**: Testing production build, pre-deployment, or verifying build passes
- **Development workflow**: Start dev server once, make changes, browser auto-refreshes

```bash
# ✅ Typical workflow
cd rpac-web
npm run dev              # Start once
# Make changes to code...
# Changes appear automatically in browser!

# ❌ Do NOT do this unnecessarily
npm run build            # Only for production testing!
```

## Current Status (October 30, 2025)

**Phase 1 (Individual Level)**: ✅ COMPLETE
- Personal resource inventory with MSB guidelines
- Cultivation planning system with AI integration
- Personal preparedness dashboard
- Individual profile and settings

**Phase 2 (Local Community Function)**: ✅ COMPLETE
- Geographic integration with GeoNames database
- Real-time messaging system (community & direct messages)
- Community management (create/join/leave/edit/delete)
- Member count tracking and user presence
- Complete resource sharing system with status management
- Help request system with responses
- Community activity feed
- Community homespace (public-facing pages at `/[samhalle]`)
- **Database cleanup completed** - Removed obsolete cultivation tables and migration files
- **Professional navigation system with collapsible sidebar** - See "Navigation System Changes" below
- State-of-the-art notification center with realtime updates
- **Super Admin system** - User management, license system, community oversight
- **Business model implementation** - Free/Premium/Manager tiers

**Phase 3 (Regional Coordination)**: 🔄 IN PROGRESS
- Regional overview with county-based organization
- Links to official crisis resources (MSB, Krisinformation.se, Länsstyrelsen)

## 🎨 Navigation System Changes (October 30, 2025) - IMPORTANT FOR USER GUIDANCE

### Overview
The side navigation has been completely redesigned with a collapsible sidebar and flyout menus.

### Complete Route Map

#### **Main Application Routes**

**1. Dashboard (`/` or `/dashboard`)**
- Operational overview with preparedness score
- Quick access cards to all major sections
- Weather widget, AI coach, and notifications
- Mobile: Bottom navigation with Home icon

**2. Individual Level (`/individual`)**
- Base route with query parameters for sections:
  - `/individual?section=resources` - Personal resource inventory (default)
  - `/individual?section=cultivation` - Cultivation planning system
  - `/individual?section=knowledge` - MSB guidelines and knowledge base
  - `/individual?section=coach` - AI personal preparedness coach
- Fully integrated resource management with MSB categories
- Cultivation plans with AI-generated recommendations

**3. Local Community (`/local`)**
- Base `/local` route shows community dashboard (if member) or discovery (if not)
- Query parameters for tabs:
  - `/local?tab=home` - Community dashboard overview (default)
  - `/local?tab=activity` - Community activity feed
  - `/local?tab=resources&resourceTab=shared` - Shared community resources
  - `/local?tab=resources&resourceTab=owned` - Community-owned resources
  - `/local?tab=resources&resourceTab=help` - Help requests and responses
  - `/local?tab=messages` - Community messages (redirects to sub-route)
  - `/local?tab=admin` - Community administration (admins only)
- Separate sub-routes:
  - `/local/discover` - Find and join communities
  - `/local/activity` - Dedicated activity feed page
  - `/local/messages/community` - Community group chat
  - `/local/messages/direct` - Direct messaging with members
  - `/local/messages/resources` - Resource-related messages

**4. Regional Level (`/regional`)**
- County-based regional overview
- Official crisis resource links (MSB, Krisinformation.se, Länsstyrelsen)
- Regional statistics and coordination
- Cross-community resource sharing (planned)

**5. Settings (`/settings`)**
- User profile management (name, display name, postal code)
- Avatar upload to Supabase Storage
- Account settings and preferences
- Privacy controls
- Theme customization

**6. Authentication Routes (`/auth`)**
- `/auth/callback` - Supabase auth callback handler
- `/auth/reset-password` - Password reset flow
- Login/signup handled in modals, not separate pages

**7. Special Routes**

- `/[samhalle]` - **Dynamic community homespace** (public-facing)
  - Examples: `/nykulla`, `/vasastan-stockholm`, `/lund-centrum`
  - Public community pages with custom URL slugs
  - Shows community info, resources (anonymized), members, contact
  - Fully customizable by community admins
  
- `/invite/[code]` - **Invitation acceptance**
  - Dynamic route for community invitations
  - Validates invitation code and adds user to community
  
- `/super-admin` - **Super Admin Dashboard**
  - `/super-admin/login` - Super admin authentication
  - `/super-admin/users` - User management (upgrade/downgrade tiers)
  - `/super-admin/communities` - Community oversight
  - `/super-admin/licenses` - License/subscription management
  - Restricted to users with `user_tier = 'super_admin'`

**8. API Routes (`/api`)**
- `/api/weather` - Weather data from SMHI API
- `/api/admin/[...]` - Admin-only API endpoints
- Edge runtime for all dynamic routes

### Key Changes for User Experience:

#### 1. **Default Collapsed State**
- All navigation sections start **collapsed** (closed) on first load
- Users see only the top-level icons initially
- Click to expand sections and see child items
- Cleaner, less overwhelming initial view

#### 2. **Collapsible Sidebar**
- **Toggle button** at the bottom of sidebar (subtle chevron)
- Click to collapse sidebar to just **icons** (96px width)
- Click again to expand back to full width (320px)
- Smooth 300ms animation

#### 3. **Flyout Menus (When Collapsed)**
- When sidebar is collapsed, clicking an icon with children shows a **compact flyout menu**
- Flyout appears right next to the clicked icon (not full-height)
- Shows all submenu items with icons
- Click submenu item to navigate
- Click outside to close flyout
- Flyout is small and contextual (224px wide, auto-height)

#### 4. **Active State Highlighting**
- **NEW**: Gradient background with ring border (no more left border "parenthesis")
- Active items have:
  - Subtle gradient background (`from-[#5C6B47]/20 to-[#5C6B47]/10`)
  - Ring border (`ring-2 ring-[#5C6B47]/30`)
  - Enhanced shadow
  - Thin accent bar (1px left border)
- Much clearer visual feedback

#### 5. **Removed Features**
- ❌ Emergency messages section deleted (was unused)
- ❌ "Resurser" parent menu removed (children promoted to top level)

### For KRISter (AI Guide):
When helping users navigate:
- **Explain the collapsed state**: "All menus start closed. Click to expand and see options."
- **Mention the toggle**: "You can minimize the sidebar using the small chevron at the bottom."
- **Describe flyouts**: "When sidebar is minimized, click icons to see a popup menu."
- **Guide on active states**: "The current page is highlighted with a green background and border."
- **Navigation paths updated**:
  - "Gemensamma resurser" is now directly under "Lokalt" (no "Resurser" parent)
  - "Delade resurser" is directly under "Lokalt"
  - "Hjälpförfrågningar" is directly under "Lokalt"
  - No more "Nödsituationer" - removed entirely
  - Community messages: `/local/messages/community`
  - Direct messages: `/local/messages/direct`

### Technical Details:
- Sidebar state persists during session (not across page reloads)
- Flyout position calculated dynamically based on icon location
- Click-outside detection closes flyouts
- Mobile navigation unchanged (separate responsive component)
- URL parameters drive active states for tabs within pages

## Scope

Lokaliserat för Sverige. Stöder **individ → lokal → regional** nätverk.

Offline-först, svenska-först — se `/docs/charter.md` och `/docs/architecture.md`.

## Language

Använd svenska för:

- UI-strängar
- AI-kommunikation
- Dokumentation om inte annat begärts

Engelska bara för externa anslutningar eller som reservalternativ.

## Files to Always Load for Context

1. `/docs/charter.md` (#RPAC-charter)
2. `/docs/architecture.md` (#RPAC-architecture)
3. `/docs/roadmap.md` (#RPAC-roadmap)

## Development Rules

- **Mobile-först design** - Alla komponenter måste fungera perfekt på mobila enheter med touch-optimering.
- Offline-först design i alla komponenter.
- Använd enkel, beprövad teknologi.
- Respektera integritetsstandarder.
- Modulär kod för framtida integration.
- Följ prioriteringar och milstolpar från roadmap.md.

### ⚡ Standard Components (MUST USE)

#### **ResourceListView** - Universal List Component
**MANDATORY**: Use `ResourceListView` component for ALL list displays in the app.

**Location**: `rpac-web/src/components/resource-list-view.tsx`

**Use for:**
- ✅ Any list of items (resources, users, tasks, messages, etc.)
- ✅ All tables and card grids
- ✅ Any view that needs search/filter functionality
- ✅ Any list that should have table/card toggle

**Benefits:**
- Built-in card/table toggle
- Built-in search and filters
- Consistent UX across app
- Mobile responsive
- -75% less code per list
- Single source of truth

**Quick Example:**
```typescript
import { ResourceListView } from '@/components/resource-list-view';

<ResourceListView
  items={data}
  columns={[
    { key: 'name', label: 'Namn', render: (item) => <b>{item.name}</b> },
    { key: 'quantity', label: 'Antal', render: (item) => item.quantity }
  ]}
  cardRenderer={(item) => <YourCard item={item} />}
  searchPlaceholder="Sök..."
  categories={categoryFilters}
/>
```

**Documentation:**
- Full API: `docs/COMPONENT_RESOURCE_LIST_VIEW.md`
- Migration guide: `docs/MIGRATION_EXAMPLE_RESOURCE_LIST_VIEW.md`

**DO NOT:**
- ❌ Create custom list implementations
- ❌ Duplicate search/filter UI
- ❌ Manually implement card/table toggle
- ❌ Build custom table components

**Exception:** Only skip if extremely specialized needs that component cannot support.

## Latest Development Patterns (2025-10-09)

### Phase 1 - Individual Level ✅ COMPLETED
**MAJOR MILESTONE ACHIEVED**: Complete individual preparedness system with AI integration, database persistence, and professional UX!

### Phase 2 - Local Community Level ✅ COMPLETED
**MAJOR MILESTONE ACHIEVED**: Complete community ecosystem with resource sharing, messaging, and coordination!

#### Enhanced Cultivation Planning System ✅ COMPLETED
- **5-Step Progressive Flow**: Profile → Nutrition → Crops → Plan → Gaps analysis
- **AI Integration**: OpenAI GPT-4 for personalized cultivation plan generation
- **Plan Management**: Save, load, edit, and delete multiple named plans
- **Real-time Calculations**: Live updates of space, cost, and nutrition
- **URL Parameter Handling**: useSearchParams for direct navigation to specific sections
- **Dual Storage Strategy**: Supabase + localStorage for offline capability and performance
- **Error Recovery**: Graceful fallbacks when AI services are unavailable
- **Backward Compatibility**: Support for legacy data formats during system evolution

#### Communication System ✅ COMPLETED
- **Real-time Messaging**: Supabase Realtime for live communication
- **External Communication**: Radio and web-based external communication channels
- **Emergency Messaging**: Prioritized system for crisis communication
- **Warning System**: Integrated warning system with official sources

#### MSB Integration ✅ COMPLETED
- **Official Guidelines**: "Om krisen eller kriget kommer" integration
- **Crisis Information**: Krisinformation.se as primary official channel
- **Resource Recommendations**: MSB-based preparedness lists
- **Swedish Crisis Culture**: Authentic Swedish crisis communication

### Key Technical Achievements
- **Database Integration**: Full Supabase integration with RLS policies and foreign keys
- **Component Architecture**: Modular design with clear separation of concerns
- **State Management**: Efficient React state updates with proper dependencies
- **Performance Optimization**: Smart useEffect dependencies and component key props
- **Swedish Localization**: All text properly externalized to t() function system
- **UX Breakthrough**: Perfect balance of professional design with warm Swedish communication

## Current Development Focus

### Phase 3 - Regional Coordination Features 🔄 IN PROGRESS
**CURRENT PRIORITY**: Regional coordination and advanced community features

#### Immediate Next Steps (2025-01-28)
1. **✅ Complete AI Integration** - All mock implementations replaced with OpenAI GPT-4
   - ✅ Plant diagnosis with Swedish plant database
   - ✅ Personal AI coach for daily preparedness tips
   - ✅ Swedish language optimization for crisis communication
2. **✅ Community Hub Integration** - Full geographic and resource sharing functionality
3. **✅ Geographic Integration** - Postcode-based community detection
4. **✅ Resource Sharing System** - Community-wide resource inventory and sharing
5. **✅ Navigation System** - Professional side menu and mobile navigation
6. **✅ Notification Center** - State-of-the-art notification system
7. **🔄 Regional Coordination** - Cross-community resource sharing and crisis coordination
8. **📋 Push Notifications** - Critical alerts and cultivation reminders
9. **📋 Advanced Community Analytics** - Community preparedness insights

#### Phase 3 - Regional Coordination 🔄 IN PROGRESS
**CURRENT FOCUS**: Building on completed Phase 2 foundation for regional coordination

Se `/docs/roadmap.md` för:
- Aktuella prioriteringar och Sprint-fokus
- Implementerade funktioner vs planerade
- Tekniska milstolpar och leveranser
- Nuvarande fokus: Community Hub Integration & AI Completion

## Mobile-First Design Requirements

- **Touch-optimering**: Alla interaktiva element måste ha minst 44px touch-targets.
- **Responsiv design**: Använd Tailwind breakpoints (sm:, md:, lg:, xl:) för alla komponenter.
- **Mobile navigation**: Användare ska kunna navigera enkelt på små skärmar.
- **Touch-manipulation**: Lägg till `touch-manipulation` CSS-klass för bättre touch-upplevelse.
- **Mobile user menu**: Ska vara synlig och användbar på alla skärmstorlekar.
- **Progressive disclosure**: Dölj mindre viktig information på mobila enheter.

## Output Preferences

- Tydlig, kommenterad kod.
- Använd svenska i variabelnamn/UI när möjligt.
- Alla nya funktioner dokumenterade i `/docs/dev_notes.md`.
- **Mobile-först**: Alla nya komponenter måste testas på mobila enheter.