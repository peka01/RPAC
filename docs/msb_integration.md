# MSB-Integration: "Om krisen eller kriget kommer" i RPAC

## Översikt

Detta dokument beskriver hur innehållet från MSB:s (Myndigheten för samhällsskydd och beredskap) officiella krisprepareringsguide "Om krisen eller kriget kommer" har integrerats i RPAC-applikationen för att säkerställa att alla beredskapsfunktioner följer svenska myndigheters officiella riktlinjer.

## MSB-Innehållsområden Integrerade i RPAC

### 1. 🏛️ Totalförsvar och Medborgerlig Beredskapsplikt
**MSB-Källa**: Kapitel om totalförsvarsplikt
**RPAC-Integration**: 
- Informationssektion i Personal Dashboard om medborgerlig beredskapsplikt
- Automatiska påminnelser om beredskapsansvar
- Länkar till officiella MSB-resurser och Krisinformation.se

**Komponenter som påverkas**:
- `personal-dashboard.tsx` - Beredskapspliktinformation
- `preparedness-overview.tsx` - Officiella beredskapsmål

### 2. 🧠 Psykologiskt Försvar
**MSB-Källa**: Riktlinjer för mental motståndskraft
**RPAC-Integration**:
- Andningstekniker och stress-hanteringsverktyg
- Informationsverifiering och källkritik
- Community-stöd för mental hälsa

**Komponenter som påverkas**:
- `crisis-cultivation.tsx` - Stress-reduktion genom odling
- `community-hub.tsx` - Psykologiskt stöd från grannar
- `personal-dashboard.tsx` - Mental hälsoindikatorer

### 3. 🔒 Digital Säkerhet  
**MSB-Källa**: Kapitel om digital säkerhet och säker kommunikation
**RPAC-Integration**:
- Säkra kommunikationsprotokoll
- Verifiering av informationskällor
- Skydd mot desinformation

**Komponenter som påverkas**:
- `external-communication.tsx` - Säkra kommunikationslänkar
- `messaging-system.tsx` - Krypterad kommunikation
- Alla informationskällor - Källverifiering

### 4. ⚠️ Skydd mot Luftangrepp och Kärnvapen
**MSB-Källa**: Specifika råd för luftangrepp och kärnvapenscenarier
**RPAC-Integration**:
- Snabba varningssystem
- Skyddsrumsinformation
- Evakueringsplaner

**Komponenter som påverkas**:
- `external-communication.tsx` - Officiella varningssystem
- `preparedness-overview.tsx` - Skyddsåtgärder
- `community-hub.tsx` - Kollektiva skyddsplaner

### 5. 💧 Vattenförsörjning och Sanitation
**MSB-Källa**: Råd för vattenbrist och sanitära behov
**RPAC-Integration**:
- Vattenreningsmetoder
- Sanitära lösningar vid vattenbrist  
- Hygienprotokoll under kriser

**Komponenter som påverkas**:
- `supabase-resource-inventory.tsx` - Vattenlagringsspårning
- `preparedness-overview.tsx` - Vattenförsörjningspoäng
- `ai-cultivation-advisor.tsx` - Vatteneffektiv odling

### 6. 🐕 Husdjur och Djurberedskap
**MSB-Källa**: Riktlinjer för djurvård under kriser
**RPAC-Integration**:
- Djurmatlagring och spårning
- Veterinärkontakter
- Evakueringsplaner med djur

**Komponenter som påverkas**:
- `supabase-resource-inventory.tsx` - Djurmatresurser
- `preparedness-overview.tsx` - Djurberedskapspoäng
- `community-hub.tsx` - Veterinärnätverk

## Teknisk Implementation

### Lokalisering och Språk
```json
// Nya strängar i sv.json för MSB-innehåll
"msb": {
  "official_guidance": "Officiella MSB-riktlinjer",
  "total_defense": "Totalförsvar",
  "digital_security": "Digital säkerhet",
  "psychological_defense": "Psykologiskt försvar",
  "nuclear_protection": "Kärnvapenskydd",
  "water_sanitation": "Vatten och sanitation",
  "pet_preparedness": "Husdjursberedskap"
}
```

### Datastrukturer
```typescript
interface MSBGuideline {
  id: string;
  title: string;
  category: 'total_defense' | 'psychological' | 'digital_security' | 'nuclear' | 'water' | 'pets';
  content: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  officialSource: string;
}
```

### API-Integration
- **MSB-feeds**: Automatisk uppdatering från MSB:s officiella kanaler
- **Varningssystem**: Integration med VMA (Viktigt Meddelande till Allmänheten)
- **Regional information**: Automatisk lokalisering av närliggande skyddsrum och resurser

## Prioriterad Implementering

### Fas 1: Grundläggande MSB-Integration ⭐️
- [x] Uppdatera dokumentation med MSB-referenser
- [ ] Lägg till MSB-schecklistor i preparedness-overview
- [ ] Integrera officiella vattenförsörjningsriktlinjer
- [ ] Lägg till digital säkerhetsinformation

### Fas 2: Avancerad MSB-Integration  
- [ ] Psykologiskt försvar-verktyg
- [ ] Kärnvapen- och luftangreppsinformation  
- [ ] Husdjursberedskap-spårning
- [ ] Real-time MSB-feeds

### Fas 3: MSB-Certifiering
- [ ] Validering av innehåll med MSB
- [ ] Officiell certifiering av beredskapsfunktioner
- [ ] Integration med nationella varningssystem

## Kvalitetssäkring

### MSB-Innehållsvalidering
- **Källverifiering**: Allt innehåll måste referera till officiella MSB-publikationer
- **Uppdateringsrutiner**: Automatisk kontroll av nya MSB-versioner av "Om krisen eller kriget kommer"
- **Expertgranskning**: Validering med beredskapsexperter före implementation

### Användarupplevelse
- **Tydliga referenser**: Alla MSB-baserade råd märkta som officiella riktlinjer
- **Lokala anpassningar**: MSB-innehåll anpassat till specifika svenska regioner
- **Tillgänglighet**: MSB-information tillgänglig på svenska och i enkelt språk

## Framtida MSB-Integrationer

### Planerade Funktioner
- **MSB-API**: Direkt integration med MSB:s informationssystem
- **Krisinformation.se Integration**: Automatisk uppdatering från den officiella nationella kriskommunikationskanalen
- **Regionala MSB-kontakter**: Automatisk koppling till lokala beredskapsansvariga
- **MSB-certifierade övningar**: Digitala beredskapsövningar baserade på MSB-scenarier
- **Officiell rapportering**: Möjlighet att rapportera beredskapsstatus till myndigheter

### Teknisk Roadmap
1. **Q1 2025**: Grundläggande MSB-innehållsintegration
2. **Q2 2025**: Real-time MSB-varningssystem
3. **Q3 2025**: Avancerade MSB-verktyg och övningar
4. **Q4 2025**: Officiell MSB-certifiering och partnerskap

## Slutsats

Genom att integrera "Om krisen eller kriget kommer" och andra MSB-riktlinjer säkerställer RPAC att svenska användare får tillgång till den mest auktoritativa och uppdaterade beredskapsinformationen. Detta stärker applikationens trovärdighet och praktiska användbarhet i verkliga krisситуationer.

**MSB-integration är en grund för RPAC:s svenska legitimitet och användbarhet som officiellt kristödjpunkt för svenska medborgare.**
