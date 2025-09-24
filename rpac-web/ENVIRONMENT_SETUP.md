# Environment Setup Guide

## Quick Start (Demo Mode)

För att snabbt komma igång utan Supabase-konfiguration:

1. **Skapa .env.local fil**:
   ```bash
   # I rpac-web mappen
   copy env.example .env.local
   ```

2. **Redigera .env.local**:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   ```

3. **Starta utvecklingsservern**:
   ```bash
   npm run dev
   ```

## Full Supabase Setup

För att använda riktig databas:

1. **Skapa Supabase-projekt**:
   - Gå till [supabase.com](https://supabase.com)
   - Skapa nytt projekt
   - Välj region (Stockholm rekommenderat)

2. **Konfigurera databas**:
   - Kör `supabase-schema.sql` i SQL Editor
   - Aktivera Row Level Security

3. **Hämta API-nycklar**:
   - Gå till Settings → API
   - Kopiera Project URL och anon key

4. **Skapa .env.local**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_DEMO_MODE=false
   ```

5. **Starta servern**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### "Loading" screen
- Kontrollera att .env.local finns
- Verifiera att miljövariablerna är korrekt formaterade
- Starta om utvecklingsservern efter ändringar

### Supabase connection errors
- Kontrollera att URL och API-nyckel är korrekta
- Verifiera att projektet är aktivt
- Kontrollera nätverksanslutning

### Demo mode not working
- Säkerställ att `NEXT_PUBLIC_DEMO_MODE=true`
- Kontrollera att inga Supabase-variabler är satta
- Starta om servern
