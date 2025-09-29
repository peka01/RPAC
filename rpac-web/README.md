# RPAC - Resilience & Preparedness AI Companion

## 🌐 Web-First Crisis Preparedness Tool

RPAC är en modern, web-först applikation för krisberedskap och ömsesidig hjälp, byggd med framtidssäker teknologi och svensk-först design.

## 🚀 Teknisk Stack

### Frontend
- **Next.js 14** - React framework med App Router
- **TypeScript** - Typsäkerhet och bättre utvecklarupplevelse
- **Tailwind CSS** - Responsiv, krisanpassad design
- **Lucide React** - Konsekvent ikonografi
- **Next Themes** - Mörkt/ljust tema

### Backend & Infrastructure ✅ IMPLEMENTED
- **Next.js API Routes** - Serverless backend
- **Supabase** - Real-time databas och autentisering med PostgreSQL
- **Row Level Security** - Dataskydd med RLS-policies
- **Foreign Key Constraints** - Dataintegritet och referential integrity
- **Vercel** - Global hosting och deployment
- **Cloudflare** - CDN, edge computing och AI Worker API

### Features ✅ IMPLEMENTED
- **Progressive Web App (PWA)** - App-liknande upplevelse
- **Svensk lokalisering** - Alla texter på svenska
- **Krisanpassad design** - Semi-militär färgpalett
- **Real-time uppdateringar** - Live status och kommunikation
- **Responsiv design** - Fungerar på alla enheter
- **Database Migration** - Fullständig migrering från localStorage till Supabase
- **Production Ready** - Säker, skalbar och underhållbar datalager

## 🏗️ Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB-FIRST RPAC                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   FRONTEND  │  │   BACKEND   │  │   DATABASE  │            │
│  │             │  │             │  │             │            │
│  │ • Next.js   │◄─┤ • API Routes│◄─┤ • Supabase  │            │
│  │ • React 18  │  │ • Edge Fns  │  │ • PostgreSQL│            │
│  │ • TypeScript│  │ • Auth      │  │ • Real-time │            │
│  │ • Tailwind  │  │ • Validation│  │ • Backups   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Funktioner

### Individnivå
- **Personlig Dashboard** - Översikt av beredskap och resurser
- **AI-odlingsguide** - Platsbaserade odlingsplaner via Cloudflare Worker API
- **Växtdiagnos** - AI-driven växtanalys med svenska optimering
- **Resursinventering** - Mat, vatten, medicin, energi
- **Personlig Coach** - AI-driven beredskapsstöd med svenska kontext

### Lokalt Samhälle
- **Resursdelning** - Transparent resursinventering
- **Kommunikationshub** - Meddelanden och koordination
- **Kriskarta** - Lokal översikt med resurser
- **Ömsesidig Hjälp** - Matchning av behov och tillgångar

### Regional Nivå
- **Kriskoordination** - Regional samordning
- **Resursmatchning** - Överskott och brist mellan områden
- **Beredskapsövningar** - Digitala träningsscenarier
- **Dataanalys** - Trendanalys och förutsägelser

## 🚀 Snabbstart

### Förutsättningar
- Node.js 18+ 
- npm eller yarn

### Installation
```bash
# Klona repository
git clone <repository-url>
cd rpac-web

# Installera dependencies
npm install

# Starta utvecklingsserver
npm run dev
```

### Miljövariabler
Skapa `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 PWA Support

RPAC fungerar som en Progressive Web App:
- **Installation** - Kan installeras på alla enheter
- **Offline-funktionalitet** - Begränsad funktionalitet offline
- **Push-notifikationer** - Viktiga krisuppdateringar
- **App-liknande upplevelse** - Native app-känsla

## 🌍 Global Tillgänglighet

- **Global CDN** - Snabb åtkomst världen över
- **Automatic scaling** - Skalning under hög belastning
- **99.9% uptime** - Tillförlitlighet under kriser
- **Multi-language ready** - Svenska som primärt språk

## 🔒 Säkerhet

- **End-to-end kryptering** - Säker kommunikation
- **Row Level Security** - Användar-specifik dataåtkomst
- **GDPR compliance** - Fullständig integritetsskydd
- **Audit logs** - Spårbarhet av alla åtgärder

## 🎨 Designprinciper

### Krisanpassad Design
- **Semi-militär färgpalett** - Muted greens, blues, browns
- **Hög kontrast** - Läsbarhet i olika ljusförhållanden
- **Konsekvent ikonografi** - Tydliga, universellt förstådda symboler
- **Kortbaserad design** - Grupperad information i tydliga sektioner

### UX-principer
- **Progressive disclosure** - Viktig information först
- **Touch-friendly** - Adekvat avstånd för mobilanvändning
- **Offline-first indikatorer** - Tydliga visuella ledtrådar om anslutningsstatus
- **Kriskommunikation** - Tydlig, empatisk och lugnande ton

## 📊 Utveckling

### Scripts
```bash
npm run dev          # Starta utvecklingsserver
npm run build        # Bygg för produktion
npm run start        # Starta produktionsserver
npm run lint         # Kör ESLint
npm run type-check   # Kontrollera TypeScript
```

### Projektstruktur
```
src/
├── app/                 # Next.js App Router
├── components/          # React-komponenter
├── lib/                 # Utilities och konfiguration
│   ├── locales/         # Svenska översättningar
│   └── supabase/        # Database client
└── types/               # TypeScript-typer
```

## 🤝 Bidrag

1. Forka repository
2. Skapa feature branch (`git checkout -b feature/amazing-feature`)
3. Commita ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branch (`git push origin feature/amazing-feature`)
5. Öppna Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🆘 Support

För support och frågor:
- Skapa en issue på GitHub
- Kontakta utvecklingsteamet
- Läs dokumentationen i `/docs`

---

**RPAC** - Ditt trygga stöd när allt annat fallerar 🇸🇪