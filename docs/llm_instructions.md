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

## Output Preferences

- Tydlig, kommenterad kod.
- Använd svenska i variabelnamn/UI när möjligt.
- Alla nya funktioner dokumenterade i `/docs/dev_notes.md`.