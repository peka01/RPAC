# Resilience & Preparedness AI Companion (RPAC) – Charter & Foundation Document

## 1. Vision Statement

> Att ge individer, lokala samhällen och regionala nätverk smarta, människocentrerade verktyg som möjliggör självförsörjning, ömsesidig hjälp och snabb respons under kriser – byggt på beprövad, modern teknik som även fungerar vid störningar i infrastruktur.

---

## 2. Mission & Scope

Vi ska:

- Bygga en **modulär, plattformsoberoende** applikation med fokus på:
  - **Individuell självförsörjning** inom mat, vatten, energi, hälsa.
  - **Lokalt samarbete** med resursinventering, optimering och kommunikation.
  - **Regional samordning** för ömsesidig hjälp och gemensam resiliensanalys.

- Designa för **offline-först** drift med sömlös synkronisering vid tillgång till nät.

- Utnyttja **stabil och beprövad teknologi** för att undvika systemåtergång.

- Integrera **människolik AI-kommunikation** som bygger tillit, empati och samarbete i stressade situationer.

**Begränsningar i första fasen:**

- Inga nationella eller globala integrationer i initial release.
- Ingen beroende av experimentell hårdvara.

---

## 3. Guiding Principles

1. **Resiliens genom design**  
   Systemet ska fungera vid strömavbrott, internetavbrott och störda försörjningskedjor.

2. **Människocentrerad kommunikation**  
   AI och gränssnitt ska ge klar, empatisk och lokalt kulturanpassad kommunikation.

3. **Lokalt först, expanderbart senare**  
   Användbarhet på individ- och samhällsnivå prioriteras, med arkitektur klar för utvidgning.

4. **Dataskydd & Tillit**  
   Resursdata är privat som standard; aggregerade summeringar delas regionalt med samtycke.

5. **Utnyttja beprövad teknik**  
   Meshnätverk, offline-kartor, lättviktig AI – inga beroenden till oprövad teknik.

6. **Handlingsinriktad intelligens**  
   AI-output måste vara praktisk och situationsspecifik.

---

## 4. Language & Cultural Adaptation Principle

RPAC kommer att prioritera fullständig svensk språkstöd i första releasecykeln, inklusive AI-instruktioner, kommunikationsgränssnitt och dokumentation. All kriskommunikation ska vara kulturellt anpassad till svenska normer, ton och kontext, med engelska endast som sekundärt alternativ.

Detta innebär:

- Svenska växtnamn och måttenheter (meter, liter, kilogram).
- Klimatanpassade grödförslag och krislistor för Sverige.
- AI-meddelanden i tydlig, empatisk svenska som standard.

---

## 5. Functional Pillars

### Individnivå

- **Grow-at-Home AI Guide** med personliga odlingsplaner och krisgrödor.
- **Visuell plantdiagnostik** via AI för hälsobedömning.
- Offline steg-för-steg guider.
- **Personlig resursinventering** (mat, vatten, medicin, energi).

### Lokal nivå

- **Gemensam resursinventering & kartläggning**.
- **Överskott-/bristvarning** i realtid.
- **AI för resursoptimering** och prioritetsfördelning.
- **Lokal kommunikation via mesh** – text, röst, översättning, tonmodering.

### Regional nivå

- **Regional synklager** med aggregerade summeringar och beredskapspoäng.
- **Ömsesidig hjälp-matchning** mellan samhällen.
- **Beredskapsövningar** med återkoppling från AI.

---

## 6. Technical Foundations

- **Frontend:** Flutter (mobil + webb).
- **Backend:** Python (FastAPI/Django) eller Node.js, med modulära tjänster.
- **Databas:** Lokal SQLite för offline, synkbar med Postgres vid online.
- **Nätverk:**  
  - Bluetooth mesh (libp2p/Briar).  
  - Wi-Fi Direct för lokal synk.
  - LoRa som tillval för landsbygd.
- **Kartor:** Offline OpenStreetMap.
- **AI:** TensorFlow Lite / PyTorch Mobile för växthälsa; svenska NLP för kommunikation.
- **Säkerhet:** E2E-kryptering, hashade ID:n för integritet.

---

## 7. Crisis-Ready Technology Use

- Arkitektur för **offline-först** alla kärnfunktioner.
- Använder beprövad och stabil teknologi.
- Optimerad för låg strömförbrukning – kompatibel med sol-/batteridrift.
- Fungerar på Android, iOS och små "community hub"-servrar.

---

## 8. Future Extendability

- Modular för nationell/global uppkoppling när det behövs.
- API-redo för integration med humanitära system.
- Möjlighet till IoT-integration (trädgårdar, vattentankar, solsystem) utan redesign.

---

## 9. Success Metrics

1. **Antal aktiva användare** på individ och samhällsnivå.
2. **Förbättrade beredskapspoäng** i målgrupper.
3. **Körtid och funktionalitet** vid krisförhållanden.
4. **Kvalitet på mänsklig kommunikation** enligt användarfeedback.

---

## 10. Early Development Goals

- MVP med **Individ + Lokal funktionalitet** inom 6 månader.
- Test i minst **2 svenska samhällen** (stad + landsbygd).
- Iteration baserat på faktisk användning innan regional synk läggs till.

---

## 11. Core Philosophy

> _Vi ska inte backa i utveckling utan använda dagens stabila teknik för att bygga ett verktyg som fungerar när allt annat fallerar._

Det ska vara mänskligt, anpassningsbart, integritetssäkert och skapa verklig trygghet – inte bara mer information.