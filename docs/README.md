# RPAC Dokumentation

## 📚 Dokumentationsöversikt

Denna mapp innehåller all projektdokumentation för **RPAC** (Resilience & Preparedness AI Companion).

### Kärnfiler (MÅSTE läsas)

1. **[`charter.md`](charter.md)** - Projektets vision, mission och strategiska mål
2. **[`architecture.md`](architecture.md)** - Teknisk arkitektur och designbeslut  
3. **[`roadmap.md`](roadmap.md)** - Utvecklingsplan och Sprint-prioriteringar
4. **[`conventions.md`](conventions.md)** - Utvecklingsregler och UX-principer
5. **[`llm_instructions.md`](llm_instructions.md)** - AI-kontextguide för LLM-interaktioner

### Utvecklingshistorik

- **[`dev_notes.md`](dev_notes.md)** - Utvecklingslogg och tekniska beslut

### Teknisk Setup (se även `/rpac-web/`)

- **[`/rpac-web/README.md`](../rpac-web/README.md)** - Teknisk snabbstart
- **[`/rpac-web/ENVIRONMENT_SETUP.md`](../rpac-web/ENVIRONMENT_SETUP.md)** - Miljökonfiguration
- **[`/rpac-web/SUPABASE_SETUP.md`](../rpac-web/SUPABASE_SETUP.md)** - Databas och autentisering
- **[`/rpac-web/DATABASE_SETUP.md`](../rpac-web/DATABASE_SETUP.md)** - Schema och datastruktur

## 🎯 Projektfokus (Januari 2025)

### Nuvarande Status
- ✅ **Kommunikationssystem** - Real-time meddelanden och extern kommunikation
- ✅ **Odlingskalender & Planering** - Komplett med AI-integration
- ✅ **Supabase-migrering** - Fullständig databasintegration
- ✅ **AI-integration** - Cloudflare Worker API med OpenAI GPT-4
- ✅ **Påminnelser-system** - Full CRUD-funktionalitet med AI-kontext
- ✅ **Tip Deduplication** - Intelligent förhindring av upprepade tips

### Utvecklingsfaser
- **Fas 1**: Stabilisering & Individnivå (MVP)
- **Fas 2**: Lokal Samhällsfunktionalitet  
- **Fas 3**: Regional Koordination
- **Fas 4**: Avancerade Funktioner (IoT, AR/VR)

## 🔄 Dokumentationsprocess

### För utvecklare
1. Läs alltid `charter.md`, `architecture.md` och `roadmap.md` före utveckling
2. Kontrollera aktuella Sprint-prioriteringar i `roadmap.md`
3. Följ UX-principer och utvecklingsregler i `conventions.md`
4. Dokumentera nya funktioner i `dev_notes.md`

### För LLM/AI-assistenter
- Ladda automatiskt alla kärnfiler för kontext
- Följ svenska-först principer enligt `llm_instructions.md`
- Respektera roadmap-prioriteringar vid förslag på förändringar

## 📋 Dokumentationsstandarder

### Språk
- **Svenska** för all användarfacering dokumentation
- **Engelska** endast för tekniska kommentarer eller externa API:er
- **Krisanpassad ton** - tydlig, empatisk och handlingsinriktad kommunikation

### Struktur
- Alla dokument ska vara läsbara som standalone
- Använd interna länkar för korsreferenser
- Inkludera datum för senaste uppdatering
- Följ konsekventa formatting-regler

### Uppdateringsprocess
- Uppdatera `dev_notes.md` vid varje större feature
- Synkronisera `roadmap.md` vid Sprint-förändringar
- Referera alltid till aktuell arkitektur och konventioner

---

**Senast uppdaterad:** September 2025  
**Nästa review:** Vid varje milstolpe i roadmap
