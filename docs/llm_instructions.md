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

## Current Status (October 3, 2025)

**Phase 1 (Individual Level)**: ✅ COMPLETE
**Phase 2 (Local Community Function)**: ✅ COMPLETE
- Geographic integration with GeoNames database
- Real-time messaging system
- Community management (create/join/leave/edit/delete)
- Member count tracking and user presence

**Phase 3 (Regional Coordination)**: 📋 PLANNED

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

## Latest Development Patterns (2025-01-28)

### Phase 1 - Individual Level ✅ COMPLETED
**MAJOR MILESTONE ACHIEVED**: Complete individual preparedness system with AI integration, database persistence, and professional UX!

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

### Phase 2 - Local Community Features 🔄 IN PROGRESS
**CURRENT PRIORITY**: Complete community hub integration with geographic features and resource sharing

#### Immediate Next Steps (2025-01-28)
1. **Complete AI Integration** - Replace remaining mock implementations with OpenAI GPT-4
   - Plant diagnosis (currently mock)
   - Personal AI coach for daily preparedness tips
   - Swedish language optimization for crisis communication
2. **Push Notifications** - Critical alerts and cultivation reminders
3. **Community Hub Integration** - Full geographic and resource sharing functionality
4. **Geographic Integration** - Postcode-based community detection
5. **Resource Sharing System** - Community-wide resource inventory and sharing

#### Phase 3 - Regional Coordination 📋 PLANNED
**READY FOR IMPLEMENTATION**: Basic structure exists, awaiting Phase 2 completion

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