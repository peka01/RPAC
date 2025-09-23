# RPAC – Arkitekturöversikt (Individ → Lokal → Regional nivå)

RPAC (Resilience & Preparedness AI Companion) är utvecklad för att fungera **offline-först** och fungera som ett krisverktyg som fortsätter att vara fullt funktionellt även när internet och elnätet är nere. Systemet är byggt för att stödja tre olika nivåer:

1. **Individnivå** – Personlig beredskap och odlingsstöd anpassat för svenska förhållanden.
2. **Lokalt nätverk** – Resursinventering, optimering och kommunikation inom samhället.
3. **Regional nivå** – Sammanställd och anonymiserad data som kopplar ihop lokala nätverk för ömsesidig hjälp.

All kommunikation och AI-interaktion sker på **svenska** och är kulturellt anpassad. Engelska används bara som reservalternativ vid regional interaktion.

---

## Arkitekturdiagram

```
┌───────────────────────────────────────────────────┐
│                 REGIONAL HUB                      │
│───────────────────────────────────────────────────│
│ Sammanställd och anonymiserad data från lokala nätverk│
│ Regional resurskarta med bristidentifiering         │
│ AI-matchning av överskott och brist                  │
│ Beredskapsövningar och koordinationspanel           │
│ Säker dataöverföring endast vid internet             │
└─────────────────────────▲─────────────────────────┘
                          │
              Säker online-synk (endast sammanställd data)
            ┌───────────────────────────────────────────┼──────────────────────────────────────────────┐
            │                    LOKALT SAMHÄLLSNÄTVERK (Offline-först)                                 │
            │──────────────────────────────────────────────────────────────────────────────────────────│
            │ GEMENSAM RESURSINVENTERING            KOMMUNIKATIONSMODUL                                 │
            │ - Sammanställning av resurser ┌───────────────┐  - Text-/röstmeddelanden                      │
            │ - Varningar för brist/överskott│  MÄNNISKOLIK  │  - AI-sammanfattning och realtidsöversättning │
            │ - Offlinekarta (OSM cache)     │ KOMMUNIKATION │  - Tonmoderering med empati                   │
            │ - AI för resursoptimering      │     AI        │  - Mesh/Wi-Fi Direct/LoRa offline-nät         │
            │──────────────────────────────────────────────────────────────────────────────────────────│
            │ Mesh via Bluetooth mellan enheter, LoRa som alternativ för landsbygd,                     │
            │ integritetsskydd med konfigurerbar kartprecision                                            │
            └────────▲──────────────────────────────────────────────────────────────────────────────────┘
                     │ Offline P2P-synk mellan användare
                     │
┌─────────┴──────────────────────────────────────────────────────────────────────┐
│                          INDIVIDNOD                                             │
│────────────────────────────────────────────────────────────────────────────────│
│ PERSONLIG BEREDSKAPSMODUL                                                       │
│ - Grow-at-Home AI-guide med platsbaserade odlingsplaner och krisgrödor          │
│ - Visuell växtdiagnos via AI                                                    │
│ - Offline steg-för-steg guider                                                  │
│ - Personlig resursinventering (mat, vatten, medicin, energi)                    │
│                                                                                  │
│ LOKAL KOMMUNIKATION                                                              │
│ - Anslutning till lokalt mesh                                                    │
│ - Inventarieuppdateringar skickas/mottas                                        │
│                                                                                  │
│ AI-ASSISTENTER                                                                   │
│ - Kontextmedveten odlingshjälp                                                   │
│ - Personlig beredskapscoach                                                      │
│ - Krisinfosammanfattning + handlingsförslag                                      │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Dataflöde

### Individnivå
All personlig data (inventarier, odlingsstatus, guider) lagras lokalt i SQLite för att säkerställa funktion offline. AI-moduler körs direkt på enheten (offline) och rapporterar vid samtycke sammanställd data till det lokala nätverket.

### Lokalt nätverk
Mesh-baserad kommunikation (Bluetooth/Wi-Fi Direct, eventuellt LoRa) synkroniserar inventarier och meddelanden mellan deltagare. AI för resursoptimering analyserar den sammanställda inventeringen och ger realtidsförslag för omfördelning och prioritering. Offlinekartor visar resurser och infrastrukturläge med konfigurerbara integritetsnivåer.

### Regional nivå
När internet är tillgängligt skickas sammanställd, anonymiserad data till regional hub. Huben kan matcha överskott i en kommun med brist i en annan, hålla beredskapsövningar digitalt och visa beredskapspoäng på regional karta.

---

## Teknisk Stapel

- **Frontend:** Flutter med `intl` för språkstöd (svenska som standard, engelska som reservalternativ).
- **Backend:** Python (FastAPI/Django) eller Node.js med modulära API-tjänster.
- **Databas:** SQLite för individ och lokalt nätverk; PostgreSQL i regional hub.
- **Kartor:** Offline OpenStreetMap med tile-cache för låg datastorlek.
- **AI:** TensorFlow Lite / PyTorch Mobile för växtdiagnos; svenska NLP-modeller (finetunad GPT eller KB-BERT) för kommunikation, sammanfattning, översättning och tonkontroll.
- **Nätverk:** libp2p/Briar mesh via Bluetooth/Wi-Fi Direct; LoRa (som alternativ).
- **Säkerhet:** End-to-end kryptering; hashade enhets-ID för anonymitet.

---

## Krisanpassning

RPAC är byggt för att:

- Alltid fungera utan internet, med full funktionalitet offline.
- Kunna köras på lågeffektsenheter (sol- och batteridrivna enheter).
- Vara robust vid strömavbrott och nätavbrott.
- Inkludera lokalt lagrade guider och AI-funktioner på svenska.
- Ge integritetskontroller på individ-, lokal- och regionalnivå.

---

## Utbyggnadspotential

Även med fokus på individ → lokal → regional kan följande läggas till senare:

- Nationell/global integration via API-moduler.
- Anslutning till humanitära databaser utan ombyggnation.
- IoT-sensorer (vatten, energi, jordmätning) integreras i befintliga moduler.
- Språkstöd utökas genom att lägga till nya JSON-filer och träna AI på fler språk.

---

## Slutsats

RPAC:s arkitektur kombinerar **offline-funktionalitet**, **svenskspråkig och empatisk AI-kommunikation**, och **modulär skalbarhet** från individnivå till regional samordning. Systemet är krisoptimerat från grunden och kan byggas ut efter behov, utan att riskera kärnfunktionerna vid avbrott.