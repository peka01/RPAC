# {{krister.context_help.cultivation.title}}



{{krister.context_help.cultivation.description}}

Odlingsfunktionen hjälper dig att:
- Planera vad du ska odla varje månad
- Få AI-genererade rekommendationer (GPT-4)
- Beräkna näringsvärde och självförsörjningsgrad
- Spara och återanvända odlingsplaner

## Steg-för-steg

### 1. Öppna odlingsplaneraren
- Från {{navigation.individual}}: Välj "Min odling"
- Eller navigera till `/individual?section=cultivation`
- Klicka "Skapa ny plan" för att börja

### 2. Skapa en odlingsplan (5 steg)

#### Steg 1: Profil
1. Namn på planen (t.ex. "Vår 2025")
2. Antal personer i hushållet
3. Klimatzon:
   - Götaland (zon 1-3): Varmast, längst säsong
   - Svealand (zon 4-5): Måttlig
   - Norrland (zon 6-8): Kortast säsong
4. Klicka "Nästa steg"

#### Steg 2: Näring
1. Ange näringsbehov per vecka:
   - Kalorier (ca 14000 kcal/person/vecka)
   - Protein (ca 350g/person/vecka)
   - Fiber (ca 175g/person/vecka)
2. Justeras automatiskt baserat på antal personer
3. Klicka "Nästa steg"

#### Steg 3: Välj grödor
1. Lägg till grödor från biblioteket
2. Eller klicka "AI-rekommendation" för förslag
3. För varje gröda:
   - Antal plantor/rader
   - Uppskattad skörd (kg)
4. AI visar näringsvärde per gröda
5. Klicka "Nästa steg"

#### Steg 4: Generera plan (AI)
1. Klicka "Generera odlingsplan med AI"
2. AI (GPT-4) skapar:
   - Månad-för-månad schema
   - Såtider och skördetider
   - Specifika råd för din klimatzon
3. Vänta medan AI genererar (5-15 sek)
4. Klicka "Nästa steg"

#### Steg 5: Analys
- **Kostnadskalkyl**: Total kostnad för plantor/frön
- **Näringsanalys**: Täcker planen dina behov?
- **Självförsörjningsgrad**: % av årsbehovet
- Klicka "Spara plan"

### 3. Hantera sparade planer
- **Ladda plan**: Välj från dropdown → Klicka "Ladda"
- **Redigera**: Ladda plan → Gå igenom steg igen → Spara
- **Ta bort**: Klicka papperskorgen på planen

### 4. Redigera grödor i befintlig plan
1. Ladda planen
2. Scrolla till "Grödor i planen"
3. Klicka "Redigera" på en gröda
4. Ändra antal eller skörd
5. Klicka "Spara ändringar"

## Tips

{{krister.context_help.cultivation.tips.0}}

{{krister.context_help.cultivation.tips.1}}

{{krister.context_help.cultivation.tips.2}}

## Vanliga frågor

**Q: Vilka grödor rekommenderas för nybörjare?**
A: Potatis, morötter, sallad, rädisor, spenat. Fråga AI för specifika råd baserat på din zon.

**Q: Måste jag fylla i alla 5 steg?**
A: Ja, för att få en komplett AI-genererad plan. Men du kan hoppa över näringsanalys om du bara vill ha ett enkelt schema.

**Q: Kan jag ha flera planer?**
A: Ja! Skapa olika planer för olika scenarier (normal, kris, växthus, friland).

**Q: Varför syns inte AI-genererad plan?**
A: Kontrollera att du har internet och att Cloudflare Worker API är tillgänglig. Vid fel visas felmeddelande.

**Q: Hur vet jag min klimatzon?**
A: Baserat på län:
- Götaland: Skåne, Halland, Blekinge, Småland, Östergötland, Västra Götaland
- Svealand: Stockholm, Uppsala, Södermanland, Västmanland, Närke, Värmland, Dalarna
- Norrland: Gävleborg, Västernorrland, Jämtland, Västerbotten, Norrbotten

## Relaterade sidor
- [Individual - Resources](/help/individual/resources.md) - Komplettera med lagrade resurser
- [Dashboard](/help/dashboard.md) - Se odlingstips i AI-coach
