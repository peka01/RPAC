# RPAC Database Setup Guide

Denna guide förklarar hur du sätter upp Supabase-databasen för RPAC-applikationen.

## Förutsättningar

1. **Supabase-konto**: Du behöver ett Supabase-konto
2. **Supabase-projekt**: Skapa ett nytt projekt i Supabase
3. **Miljövariabler**: Konfigurera miljövariabler för din applikation

## Steg 1: Skapa Supabase-projekt

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Klicka på "New Project"
3. Välj din organisation
4. Fyll i projektnamn: `rpac-web`
5. Välj en stark databaslösenord
6. Välj region (rekommenderat: Stockholm för svenska användare)
7. Klicka på "Create new project"

## Steg 2: Konfigurera databasschema

1. Gå till din Supabase-projekt dashboard
2. Klicka på "SQL Editor" i vänster meny
3. Klicka på "New query"
4. Kopiera innehållet från `supabase-schema.sql`
5. Klicka på "Run" för att köra skriptet

Detta kommer att skapa:
- `users` tabell för användarprofiler
- `resources` tabell för resursinventering
- `plant_diagnoses` tabell för växtdiagnoser
- `local_community` tabell för lokala samhällen
- `resource_sharing` tabell för resursdelning
- `help_requests` tabell för hjälpförfrågningar
- Row Level Security (RLS) policies
- Triggers för automatiska uppdateringar

## Steg 3: Konfigurera miljövariabler

1. Skapa en `.env.local` fil i `rpac-web` mappen
2. Lägg till följande variabler:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Hitta dina Supabase-uppgifter

1. Gå till din Supabase-projekt dashboard
2. Klicka på "Settings" → "API"
3. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Steg 4: Konfigurera autentisering

1. Gå till "Authentication" → "Settings" i Supabase dashboard
2. Under "Site URL", lägg till din applikations URL:
   - För utveckling: `http://localhost:3000`
   - För produktion: din domän
3. Under "Redirect URLs", lägg till:
   - `http://localhost:3000/auth/callback` (för utveckling)
   - `https://your-domain.com/auth/callback` (för produktion)

## Steg 5: Testa anslutningen

1. Starta utvecklingsservern:
   ```bash
   cd rpac-web
   npm run dev
   ```

2. Öppna `http://localhost:3000`
3. Försök skapa ett konto eller logga in
4. Kontrollera att data sparas i Supabase dashboard

## Databasschema översikt

### Users
- Lagrar användarprofiler som utökar Supabase auth.users
- Innehåller namn, e-post, plats

### Resources
- Individuell resursinventering
- Kategorier: mat, vatten, medicin, energi, verktyg
- Spårar kvantitet, enhet och hållbarhet

### Plant Diagnoses
- AI-genererade växtdiagnoser
- Innehåller hälsostatus, rekommendationer, bilder

### Local Community
- Lokala samhällsgrupper
- Innehåller namn, plats, beskrivning

### Resource Sharing
- Delning av resurser mellan samhällen
- Spårar tillgänglighet och status

### Help Requests
- Hjälpförfrågningar från samhället
- Kategoriserade efter typ och brådska

## Säkerhet

- **Row Level Security (RLS)** är aktiverat på alla tabeller
- Användare kan bara se och modifiera sina egna data
- Gemensamma resurser (samhällen, hjälpförfrågningar) är synliga för alla
- Alla API-anrop är säkra och validerade

## Felsökning

### Vanliga problem

1. **"Invalid API key"**
   - Kontrollera att `NEXT_PUBLIC_SUPABASE_ANON_KEY` är korrekt
   - Se till att nyckeln är från rätt projekt

2. **"Failed to fetch"**
   - Kontrollera att `NEXT_PUBLIC_SUPABASE_URL` är korrekt
   - Se till att projektet är aktivt

3. **"Row Level Security" fel**
   - Kontrollera att RLS-policies är korrekt konfigurerade
   - Se till att användaren är inloggad

4. **"Table doesn't exist"**
   - Kör `supabase-schema.sql` igen
   - Kontrollera att alla tabeller skapades korrekt

### Loggar och debugging

1. Öppna webbläsarens Developer Tools
2. Gå till Console-fliken
3. Kontrollera för felmeddelanden
4. Använd Network-fliken för att se API-anrop

## Nästa steg

När databasen är konfigurerad kan du:

1. **Testa funktionalitet**: Skapa användare, lägg till resurser, skapa samhällen
2. **Konfigurera deployment**: Uppdatera miljövariabler i din hosting-plattform
3. **Utöka funktionalitet**: Lägg till nya tabeller och funktioner efter behov

## Support

För problem med:
- **Supabase**: Kontrollera [Supabase dokumentation](https://supabase.com/docs)
- **RPAC**: Kontrollera projektets dokumentation i `/docs` mappen
