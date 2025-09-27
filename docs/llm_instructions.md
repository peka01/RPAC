# LLM Integration Guidelines

## Project Identity

Detta projekt är **RPAC - Resilience & Preparedness AI Companion**, fokuserat på svenskspråkiga, offline-redo kris- och beredskapsverktyg.

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

## Latest Development Patterns (2025-01-27)

### Enhanced Cultivation Planning System ✅ COMPLETED
- **5-Step Progressive Flow**: Profile → Nutrition → Crops → Plan → Gaps analysis
- **AI Integration**: OpenAI GPT-4 for personalized cultivation plan generation
- **Plan Management**: Save, load, edit, and delete multiple named plans
- **Real-time Calculations**: Live updates of space, cost, and nutrition
- **URL Parameter Handling**: useSearchParams for direct navigation to specific sections
- **Dual Storage Strategy**: Supabase + localStorage for offline capability and performance
- **Error Recovery**: Graceful fallbacks when AI services are unavailable
- **Backward Compatibility**: Support for legacy data formats during system evolution

### Key Technical Achievements
- **Database Integration**: Full Supabase integration with RLS policies and foreign keys
- **Component Architecture**: Modular design with clear separation of concerns
- **State Management**: Efficient React state updates with proper dependencies
- **Performance Optimization**: Smart useEffect dependencies and component key props
- **Swedish Localization**: All text properly externalized to t() function system

## Current Development Focus

Se `/docs/roadmap.md` för:
- Aktuella prioriteringar och Sprint-fokus
- Implementerade funktioner vs planerade
- Tekniska milstolpar och leveranser
- Nuvarande fokus: Enhanced Cultivation Planning & AI Integration ✅ COMPLETED

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