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

## Current Development Focus

Se `/docs/roadmap.md` för:
- Aktuella prioriteringar och Sprint-fokus
- Implementerade funktioner vs planerade
- Tekniska milstolpar och leveranser
- Nuvarande fokus: Odlingskalender & kommunikation

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