# RPAC – Arkitekturöversikt (Individ → Lokal → Regional nivå)

RPAC (Resilience & Preparedness AI Companion) är designad för att fungera i **offline-först** läge och användas som ett krisverktyg som fortsatt är fullt operativt även vid avbrott i internet och elnät. Arkitekturen är uppbyggd för att stödja tre nivåer:

1. **Individ** – Personlig beredskap och odlingsstöd i svensk kontext.
2. **Lokalt nätverk** – Samhällsintern resursinventering, optimering och kommunikation.
3. **Regionalt samband** – Aggregerad och anonymiserad data som kopplar ihop lokala nätverk för ömsesidig hjälp.

Standardkommunikation och AI-interaktion sker på **svenska** och är kulturellt anpassad. Engelska används endast som fallback vid behov för regional interaktion.

---

## Arkitekturdiagram

```
┌───────────────────────────────────────────────────┐
│                 REGIONAL HUB                      │
│───────────────────────────────────────────────────│
│ Aggregerad och anonymiserad data från lokala nätverk│
│ Regional resurskarta med bristidentifiering         │
│ AI-matchning av överskott och brist                  │
│ Beredskapsövningar och koordinationspanel           │
│ Säker dataöverföring endast vid internet             │
└─────────────────────────▲─────────────────────────┘
                          │
              Säker online-synk (endast aggregerad data)
            ┌───────────────────────────────────────────┼──────────────────────────────────────────────┐
            │                    LOKALT SAMHÄLLSNÄTVERK (Offline-först)                                 │
            │──────────────────────────────────────────────────────────────────────────────────────────│
            │ GEMENSAM RESURSINVENTERING            KOMMUNIKATIONSMODUL                                 │
            │ - Summering av resurser   ┌───────────────┐  - Text-/röstmeddelanden                      │
            │ - Brist-/överskottsvarning│  MÄNNISKOLIK  │  - AI-summering och realtidsöversättning       │
            │ - Offlinekarta (OSM cache)│ KOMMUNIKATION │  - Tonmodering med empati                      │
            │ - Resursoptimerande AI    │     AI        │  - Mesh/Wi-Fi Direct/LoRa offline-nät          │
            │──────────────────────────────────────────────────────────────────────────────────────────│
            │ Mesh via Bluetooth mellan enheter, LoRa som tillval för landsbygd,                          │
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
│ - Krisinfosummering + handlingsförslag                                           │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Dataflöde

### Individnivå
All personlig data (inventarier, odlingsstatus, guider) lagras lokalt i SQLite för att säkerställa funktion offline. AI-moduler körs på enheten (offline) och rapporterar vid samtycke summerad data till det lokala nätverket.

### Lokalt nätverk
Mesh-baserad kommunikation (Bluetooth/Wi-Fi Direct, ev. LoRa) synkar inventarier och meddelanden mellan deltagare. Resursoptimerings-AI analyserar sammanställd inventering och ger realtidsförslag för omfördelning och prioritering. Offlinekartor visar resurser och infrastrukturläge med konfigurerbara integritetsnivåer.

### Regional nivå
När internet finns tillgängligt skickas aggregerad, anonymiserad data till regional hub. Huben kan matcha överskott i en kommun med brist i annan, hålla beredskapsövningar digitalt och visa beredskapspoäng på regional karta.

---

## Teknisk Stapel

- **Frontend:** Flutter med `intl` för språkstöd (svenska default, engelska fallback).
- **Backend:** Python (FastAPI/Django) eller Node.js med modulära API-tjänster.
- **Databas:** SQLite för individ och lokalt nätverk; PostgreSQL i regional hub.
- **Kartor:** Offline OpenStreetMap med tile-cache för låg datastorlek.
- **AI:** TensorFlow Lite / PyTorch Mobile för växtdiagnos; svenska NLP-modeller (finetunad GPT eller KB-BERT) för kommunikation, summering, översättning och tonkontroll.
- **Nätverk:** libp2p/Briar mesh via Bluetooth/Wi-Fi Direct; LoRa (tillval).
- **Säkerhet:** End-to-end kryptering; hashade enhets-ID för anonymitet.

---

## Krisanpassning

RPAC är byggt för att:

- Alltid fungera utan internet, med full funktion offline.
- Kunna köras på lågeffektsenheter (sol- och batteridrivna enheter).
- Vara robust vid strömavbrott och nätavbrott.
- Inkludera lokalt lagrade guider och AI-funktioner på svenska.
- Ge integritetskontroller på individ-, lokal- och regionalnivå.

---

## Utbyggnadspotential

Även med fokus på individ → lokal → regional kan:

- Nationell/global integration läggas till senare via API-moduler.
- Humanitära databaser anslutas utan ombyggnation.
- IoT-sensorer (vatten, energi, jordmätning) integreras i befintliga moduler.
- Språkstöd utökas genom att lägga till nya JSON-filer och träna AI på fler språk.

---

## Slutsats

RPAC:s arkitektur kombinerar **offline-funktionalitet**, **svenskspråkig och empatisk AI-kommunikation**, och **modulär skalbarhet** från individnivå till regional samordning. Den är krisoptimerad från grunden och kan byggas ut efter behov, utan att riskera kärnfunktionerna vid avbrott.