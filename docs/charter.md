# Resilience & Preparedness AI Companion (RPAC) – Charter & Foundation Document

## 1. Vision Statement

> Att ge individer, lokala samhällen och regionala nätverk smarta, människocentrerade verktyg som möjliggör självförsörjning, ömsesidig hjälp och snabb respons under kriser – byggt på beprövad, modern teknik som fungerar även när infrastrukturen störs.

---

## 2. Mission & Scope

Vi ska:

- Bygga en **modulär, plattformsoberoende** applikation med fokus på:
  - **Individuell självförsörjning** inom mat, vatten, energi och hälsa.
  - **Lokalt samarbete** med resursinventering, optimering och kommunikation.
  - **Regional samordning** för ömsesidig hjälp och gemensam resiliensanalys.

- Designa för **offline-först** drift med sömlös synkronisering när nätet är tillgängligt.

- Utnyttja **stabil och beprövad teknologi** för att undvika systemfel.

- Integrera **människolik AI-kommunikation** som bygger tillit, empati och samarbete i stressade situationer.

**Begränsningar i första fasen:**

- Inga nationella eller globala integrationer i den första versionen.
- Ingen beroende av experimentell hårdvara.

---

## 3. Guiding Principles

1. **Resiliens genom design**  
   Systemet ska fungera vid strömavbrott, internetavbrott och störda försörjningskedjor.

2. **Människocentrerad kommunikation**  
   AI och gränssnitt ska ge klar, empatisk och lokalt kulturanpassad kommunikation.

3. **Lokalt först, expanderbart senare**  
   Användbarhet på individ- och samhällsnivå prioriteras, med arkitektur som är redo för utvidgning.

4. **Dataskydd & Tillit**  
   Resursdata är privat som standard; sammanställda sammanfattningar delas regionalt med samtycke.

5. **Utnyttja beprövad teknik**  
   Meshnätverk, offline-kartor, lättviktig AI – inga beroenden av oprövad teknik.

6. **Handlingsinriktad intelligens**  
   AI-output måste vara praktisk och situationsspecifik.

---

## 4. Language & Cultural Adaptation Principle

RPAC kommer att prioritera fullständigt svenskt språkstöd i den första releasecykeln, inklusive AI-instruktioner, kommunikationsgränssnitt och dokumentation. All kriskommunikation ska vara kulturellt anpassad till svenska normer, ton och kontext, med engelska bara som reservalternativ.

Detta innebär:

- Svenska växtnamn och måttenheter (meter, liter, kilogram).
- Klimatanpassade grödförslag och krislistor för Sverige.
- AI-meddelanden i tydlig, empatisk svenska som standard.

---

## 5. Functional Pillars

### Individnivå

- **Grow-at-Home AI Guide** med personliga odlingsplaner och krisgrödor.
- **Visuell växtdiagnostik** via AI för hälsobedömning.
- Offline steg-för-steg guider.
- **Personlig resursinventering** (mat, vatten, medicin, energi).

### Lokal nivå

- **Gemensam resursinventering & kartläggning**.
- **Varningar för överskott/brist** i realtid.
- **AI för resursoptimering** och prioritetsfördelning.
- **Lokal kommunikation via mesh** – text, röst, översättning, tonmoderering.

### Regional nivå

- **Regional synklager** med sammanställda sammanfattningar och beredskapspoäng.
- **Ömsesidig hjälp-matchning** mellan samhällen.
- **Beredskapsövningar** med återkoppling från AI.

---

## 6. Technical Foundations

- **Frontend:** Flutter (mobil + webb).
- **Backend:** Python (FastAPI/Django) eller Node.js, med modulära tjänster.
- **Databas:** Lokal SQLite för offline, synkbar med Postgres när online.
- **Nätverk:**  
  - Bluetooth mesh (libp2p/Briar).  
  - Wi-Fi Direct för lokal synk.
  - LoRa som alternativ för landsbygd.
- **Kartor:** Offline OpenStreetMap.
- **AI:** TensorFlow Lite / PyTorch Mobile för växthälsa; svenska NLP för kommunikation.
- **Säkerhet:** E2E-kryptering, hashade ID:n för integritet.

---

## 7. Crisis-Ready Technology Use

- Arkitektur för **offline-först** för alla kärnfunktioner.
- Använder beprövad och stabil teknologi.
- Optimerad för låg strömförbrukning – kompatibel med sol- och batteridrift.
- Fungerar på Android, iOS och små "community hub"-servrar.

---

## 8. Future Extendability

- Modulär för nationell/global uppkoppling när det behövs.
- API-redo för integration med humanitära system.
- Möjlighet till IoT-integration (trädgårdar, vattentankar, solsystem) utan omdesign.

---

## 9. Success Metrics

1. **Antal aktiva användare** på individ- och samhällsnivå.
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