# {{krister.context_help.local_activity.title}}



{{krister.context_help.local_activity.description}}

Aktivitetsflödet visar:
- Nya medlemmar som gått med
- Resurser som delats
- Hjälpförfrågningar
- Svar på hjälpförfrågningar
- Viktiga händelser

Allt uppdateras i **realtid** via Supabase Realtime!

## Steg-för-steg

### 1. Öppna aktivitetsflödet
- Från {{navigation.local}}: Klicka "Aktivitet"
- Eller navigera till `/local?tab=activity`
- Eller `/local/activity` för dedicerad sida

### 2. Förstå aktivitetstyperna

#### 👋 Ny medlem
- **Vem**: Medlemsnamn (eller visningsnamn)
- **När**: Tidsstämpel
- **Åtgärd**: Välkomna personen i chatten!

#### 📦 Resurs delad
- **Vad**: Resursnamn (t.ex. "Ris, 5 kg")
- **Vem**: Medlemmen som delade
- **Kategori**: Mat, Verktyg, etc.
- **Åtgärd**: Klicka för att se detaljer

#### 🆘 Hjälp efterfrågad
- **Vad**: Hjälpbehovet
- **Vem**: Medlemmen som behöver hjälp
- **Prioritet**: Hög/Normal/Låg
- **Åtgärd**: Klicka för att erbjuda hjälp

#### ✅ Hjälp erbjuden
- **Vem**: Hjälpte vem
- **Vad**: Typ av hjälp
- **Status**: Accepterad/Väntar

### 3. Interagera med aktiviteter

#### Klicka på aktivitet för detaljer
- Öppnar relevant sida (resurs, hjälpförfrågan, profil)
- Direkt åtgärder tillgängliga

#### Filtrera aktiviteter (framtida feature)
- Efter typ (medlemmar, resurser, hjälp)
- Efter datum
- Efter medlem

### 4. Förstå tidsstämplar
- "Just nu" = mindre än 1 minut sedan
- "5 min sedan"
- "2 tim sedan"
- "Idag kl 14:30"
- "Igår kl 09:15"
- "12 okt kl 16:45"

## Tips

{{krister.context_help.local_activity.tips.0}}

{{krister.context_help.local_activity.tips.1}}

{{krister.context_help.local_activity.tips.2}}

## Vanliga frågor

**Q: Uppdateras aktivitetsflödet automatiskt?**
A: Ja! Använder Supabase Realtime för live-uppdateringar. Ingen sidladdning krävs.

**Q: Hur långt tillbaka visas aktiviteter?**
A: Standard 50 senaste aktiviteterna. Scrollning laddar fler (framtida feature).

**Q: Kan jag dölja vissa typer av aktiviteter?**
A: Inte just nu, men filterfunktion planerad.

**Q: Varför syns inte min aktivitet?**
A: Kontrollera att du är medlem i samhället. Vissa aktiviteter (privata meddelanden) syns inte här.

**Q: Kan jag ta bort en aktivitet?**
A: Nej, aktivitetsloggen är permanent. Endast admins kan radera (vid missbruk).

## Relaterade sidor
- [Local - Home](/help/local/home.md) - Samhällsöversikt
- [Local - Shared Resources](/help/local/resources-shared.md) - Dela resurser
- [Local - Help Requests](/help/local/resources-help.md) - Be om hjälp
