# RPAC Utvecklingsroadmap

*Prioriteringsbaserad utveckling i egen takt*

## Projektöversikt

**RPAC** (Resilience & Preparedness AI Companion) är ett svenskspråkigt kris- och beredskapsverktyg som fokuserar på tre nivåer: Individ → Lokal → Regional. Projektet bygger på modern web-först arkitektur med Next.js, Supabase och AI-integration.

## Nuvarande Status (Fas 0 - Grundfundament ✅)

### ✅ Implementerat
- **Teknisk infrastruktur**: Next.js 14 + TypeScript + Tailwind CSS
- **Autentisering**: Supabase-baserad auth med demo-användare
- **Grundläggande UI**: Navigation, temahantering, responsiv design
- **Individuell nivå (partiell)**:
  - Personal Dashboard med beredskapspoäng
  - Växtdiagnos (mock AI-implementation)
  - Resursinventering (localStorage-baserad)
  - Preparedness Overview
  - Quick Actions för växtscanning
- **Kommunikationssystem** ✅:
  - Real-time meddelanden mellan användare
  - Direktchatt och gruppkommunikation
  - Nödmeddelandefunktioner
  - Radio- och webbaserad extern kommunikation
  - Integrerat varningssystem
- **Lokaliseringsstöd**: Svenska t() funktioner
- **PWA-grund**: Manifest och grundläggande offline-stöd

### 🔧 Delvis implementerat
- **Community Hub**: Grundstruktur finns men behöver integration
- **Lokal nivå**: Komponenter finns men saknar backend-integration
- **Regional nivå**: Bara sidstruktur, ingen funktionalitet

### 🌱 Nästa prioritet
- **Odlingskalender & Planering**: Komplett system för självförsörjning
  - Svenska klimat- och säsongsanpassning
  - AI-driven personlig odlingsrådgivning
  - Smart påminnelsesystem
  - Krisanpassad matproduktion

## Utvecklingsfaser

---

## Fas 1: Stabilisering & Individnivå
*Mål: Fullt fungerande individverktyg med databaspersistens*

### Sprint 1.1: Database & Persistens
**Prioritet: Hög**

- [ ] **Supabase schema design**
  - Användarprofiler med beredskapsdata
  - Resursinventering-tabeller
  - Växtdiagnos-historik
  - Mål och uppföljning

- [ ] **Migrera från localStorage till Supabase**
  - Resursinventering → databas
  - Användarinställningar → profiltabell
  - Beredskapspoäng → beräkning från real data

- [ ] **Real-time uppdateringar**
  - Live-synkning av beredskapspoäng
  - Instant uppdatering vid resursändringar

### Sprint 1.2: AI-integration
**Prioritet: Hög**

- [ ] **OpenAI GPT-4 integration**
  - Svenska språkmodell för beredskapstips
  - Personaliserade råd baserat på användarprofil
  - Kontextuell hjälp och vägledning

- [ ] **Växtdiagnos med riktig AI**
  - Computer Vision API för växtanalys
  - Svensk växtdatabas och rekommendationer
  - Rapportgenerering och historik

- [ ] **Personlig AI-coach**
  - Dagliga beredskapstips på svenska
  - Situationsspecifika råd
  - Progresstracking och motivation

### Sprint 1.3: Odlingskalender & Planering
**Prioritet: Hög** ⭐️

- [ ] **Svenska odlingskalendern**
  - Månadsvis sånings- och skördekalender för svenska förhållanden
  - Klimatzon-anpassning (Götaland, Svealand, Norrland)
  - Integration med svenska väderdata (SMHI)
  - Frost- och växtsäsongsdatum

- [ ] **Personlig odlingsplanering**
  - Individuell trädgårdsplanering baserat på yta och förutsättningar
  - Växtval för självförsörjning (potatis, kål, morötter, etc.)
  - Rotera-grödor för hållbar odling
  - Lagerutrymme och konserveringsplanering

- [ ] **AI-driven odlingsrådgivning**
  - Personaliserade förslag baserat på plats och erfarenhet
  - Optimering för näringsinnehåll och energi per kvadratmeter
  - Krisanpassade grödor med lång hållbarhet
  - Svenska språkstöd för alla växtnamn och instruktioner

- [ ] **Smart påminnelsesystem**
  - Push-notifikationer för såning, vattning, skörd
  - Väderbaserade anpassningar (regn = ingen vattning)
  - Säsongsberoende uppgifter och förberedelser
  - Integration med användarens resurskalender

- [ ] **Krisodling & beredskap**
  - Snabbväxande grödor för akuta situationer
  - Inomhusodling och hydroponiska system
  - Fröförråd och långtidslagring
  - Kompletterande näringsämnen under kriser

### Sprint 1.4: Krisscenarier & Simulering
**Prioritet: Medium**

- [ ] **Interaktiva krisövningar**
  - Scenariobaserade träningsmoduler
  - Beredskapstester med AI-feedback
  - Gamification av krisberedskap

- [ ] **Simulering av självförsörjning**
  - Matproduktions-kalkylatorer
  - Energibehov vs produktion
  - Scenarion för olika kristyper

---

## Fas 2: Lokal Samhällsfunktionalitet
*Mål: Fullt fungerande lokalt resursdelningssystem*

### Sprint 2.1: Samhällsregistrering
**Prioritet: Hög**

- [ ] **Geografisk integration**
  - PostNummer-baserad samhällsindelning
  - Kartintegration med offline-stöd
  - Närområdesdetektering

- [ ] **Samhällsadministration**
  - Samhällsgrupper och roller
  - Administratörsfunktioner
  - Inbjudningssystem

### Sprint 2.2: Resursdelning & Kommunikation
**Prioritet: Hög**

- [x] **Kommunikationssystem i appen** ✅
  - Real-time meddelanden mellan användare
  - Direktmeddelanden och gruppchatt
  - Nödmeddelandefunktioner
  - Voice & video-samtal integration

- [x] **Extern kommunikation** ✅
  - Radiofrekvens-integration
  - Webbaserade informationskällor
  - Myndighetskommunikation
  - Automatiska varningar och alerter

- [ ] **Gemensam resursinventering**
  - Samhällsövergripande resursöversikt
  - Överskott/brist-matchning
  - Resursförfrågningar och erbjudanden

- [ ] **Ömsesidig hjälp-system**
  - Begäran och erbjudande av hjälp
  - Kompetensmatching (VVS, el, trädgård, etc.)
  - Hjälphistorik och betygsystem

### Sprint 2.3: Lokala AI-tjänster
**Prioritet: Medium**

- [ ] **Samhällsanalys**
  - AI-driven samhällsberedskapsbedömning
  - Identifiering av kritiska brister
  - Förslag på förbättringsåtgärder

- [ ] **Resursoptimering**
  - Intelligent fördelning av resurser
  - Prediktiva analyser för behov
  - Kostnadseffektiva lösningar

---

## Fas 3: Regional Koordination
*Mål: Regional kriskoordination och resursmatchning*

### Sprint 3.1: Regional Infrastruktur
**Prioritet: Medium**

- [ ] **Hierarkisk datastruktur**
  - Individ → Samhälle → Region aggregering
  - Anonymiserad datadelning
  - GDPR-kompatibel implementering

- [ ] **Regional dashboard**
  - Översikt av regionala beredskapsnivåer
  - Identifiering av utsatta områden
  - Resursdistributionsplanering

### Sprint 3.2: Kriskoordination
**Prioritet: Medium**

- [ ] **Krisvarningssystem**
  - Integration med svenska myndigheter
  - Automatisk eskalering av varningar
  - Riktade meddelanden per område

- [ ] **Resursmobilisering**
  - Snabb omfördelning vid kriser
  - Transportkoordinering
  - Volontärkoordinering

### Sprint 3.3: Beredskapsträning
**Prioritet: Låg**

- [ ] **Regionala övningar**
  - Digitala krisövningar
  - Prestationsmätning och feedback
  - Samordning mellan samhällen

---

## Fas 4: Avancerade Funktioner
*Mål: IoT-integration och avancerad AI*

### Sprint 4.1: IoT & Sensorer
**Prioritet: Låg**

- [ ] **Trädgårdssensorer**
  - Jordfuktighet, temperatur, pH
  - Automatiska bevattningssystem
  - Skördeoptimering

- [ ] **Hem-monitoring**
  - Energiförbrukning och produktion
  - Vattenförråd-nivåer
  - Temperaturövervakning

### Sprint 4.2: Avancerad AI
**Prioritet: Låg**

- [ ] **Prediktiv analys**
  - Väderprognoser och påverkan
  - Riskbedömningar för lokala hot
  - Optimala tider för aktiviteter

- [ ] **AR/VR Training**
  - Immersiva krisscenarier
  - Virtuell träning i säkra miljöer
  - Gamification av beredskap

---

## Tekniska Prioriteringar

### Nuvarande prioriteringar
1. **Supabase Schema & Migrering** - Kritisk för att gå från demo till produktion
2. **Real AI-integration** - Ersätta mock-implementationer
3. **Förbättrad svenska lokalisering** - Alla strängar och AI-kommunikation
4. **Real-time kommunikation** ✅ - Supabase Realtime för live meddelanden
5. **Odlingskalender & Planering** ⭐️ - Prioriterad svensk självförsörjningsfunktion
6. **Push-notifikationer** - För kritiska varningar, odlingsråd och påminnelser

### Viktiga arkitekturåtgärder
- **Prestanda**: React Query för cachning och offline-stöd
- **Säkerhet**: Row Level Security i Supabase, audit logging
- **Skalbarhet**: Edge functions för AI-processer
- **Offline-funktionalitet**: Service Workers för kritiska funktioner

### Kvalitetssäkring
- **Testing**: Jest + React Testing Library
- **Type Safety**: Strängare TypeScript-config
- **Tillgänglighet**: WCAG 2.1 AA-compliance
- **Prestanda**: Lighthouse score >90

---

## Utvecklingsmilstolpar

### Fas 1 - MVP Individnivå
- ✅ Fullständig individuell beredskapslösning
- ✅ AI-driven växtdiagnos och odlingshjälp
- ✅ Databaspersistens och användarhantering
- ✅ **Odlingskalender & Planering** - Komplett självförsörjningssystem
- 🎯 **Framgång**: Användbar individuell beredskapsapp

### Fas 2 - Lokal Gemenskapsfunktion
- ✅ Fungerande resursdelning inom samhällen
- ✅ Kommunikation och ömsesidig hjälp
- ✅ Grundläggande kriskoordinering
- 🎯 **Framgång**: Aktiva lokala samhällen med resursdelning

### Fas 3 - Regional Koordination
- ✅ Regional översikt och koordination
- ✅ Avancerad krisvarning och resurshantering
- ✅ Integration med myndigheter
- 🎯 **Framgång**: Regional kriskoordination som fungerar

### Fas 4 - Avancerade Funktioner
- ✅ IoT-integration och sensorer
- ✅ Avancerad AI och prediktiv analys
- ✅ VR/AR-träningsfunktioner
- 🎯 **Framgång**: Komplett krisberedskapssystem

---

## Resursallokering

### Utvecklingsresurser (vid skalning)
- **Senior Fullstack** (Next.js + Supabase) - Grundfunktionalitet
- **AI/ML Specialist** (OpenAI integration + Computer Vision) - Vid AI-expansion
- **UX/UI Designer** (Svenska användarupplevelse) - För användarfokus
- **DevOps/Infrastructure** (Deployment + monitoring) - Vid produktionsskalning

*Nuvarande utveckling sker i egen takt utan tidspress*

---

## Riskhantering

### Tekniska risker
- **AI-integration komplexitet** → Börja med enklare mock-lösningar
- **Supabase-skalbarhet** → Planera för edge functions tidigt
- **Offline-synkronisering** → Implementera robust conflict resolution

### Användaracceptans-risker  
- **Komplexitetsgrad** → Fokus på enkelhet och svenska användarupplevelse
- **Integritetsoron** → Transparent datapolicy och lokalt-först approach
- **Teknologi-trötthet** → Betona praktisk nytta framför teknik

### Affärsrisker
- **Konkurrerande lösningar** → Unik fördel i svenskt fokus och AI-integration
- **Regulatoriska förändringar** → Nära samarbete med myndigheter
- **Finansiering** → Söka offentlig finansiering för krisberedskap

---

## Framtida Vision (2026+)

### Expansion
- **Nordiska länder**: Norge, Danmark, Finland
- **Rural/Urban balans**: Specialiserade lösningar för stad vs landsbygd
- **B2B-produkter**: Kommuner och företag som kunder

### Teknologisk utveckling
- **Blockchain för transparens**: Resurs-tracking och tillit
- **Satellitintegration**: Kommunikation när allt annat fallerar
- **Kvantum-säker krypto**: Framtidssäker dataskydd

---

## Slutsats

RPAC-projektet har en solid grund och tydlig vision. Denna roadmap prioriterar användbar funktionalitet framför tekniska experiment, med fokus på svenskt språk och kulturell anpassning.

**Nästa omedelba åtgärder:**
1. Slutför Supabase-schema och migrering från localStorage
2. Implementera riktig AI-integration för växtdiagnos
3. Förbättra svenska lokalisering i alla komponenter
4. ✅ Implementera kommunikationssystem (Real-time meddelanden & extern kommunikation)
5. **⭐️ Utveckla odlingskalender och planeringssystem** - Högsta nuvarande prioritet
6. Integrera push-notifikationer för kritiska varningar och odlingsråd
7. Testa med riktiga användare i pilot-community (fokus på trädgårdsodlare)

**Framgångsmått**: Inte bara antal användare, utan faktisk förbättring av beredskapsnivåer och samhällsresiliens i svenska sammanhang.

---

*Roadmap uppdaterad: 2025-01-27*  
*Nästa review: 2025-03-01*
