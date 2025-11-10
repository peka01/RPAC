# {{auth.create_account}}

## Kontext

För att använda BeReady behöver du ett konto. Alla personuppgifter skyddas enligt GDPR.

Registreringen tar cirka 2-3 minuter och inkluderar:
- Grundläggande profilinformation
- E-postbekräftelse
- Platsinställningar (frivilligt men rekommenderat)

## Steg-för-steg

### 1. Öppna registreringssidan

1. Gå till `beready.se/auth/register`
2. Eller klicka **{{auth.create_account}}** ("Skapa konto") på startsidan

### 2. Fyll i formuläret

#### Fullständigt namn
- **{{forms.name}}** ("Namn"): Ditt riktiga namn (för- och efternamn)
- Skapar förtroende i samhället
- Kan senare visa "smeknamn" om du vill mer integritet

#### Visningsnamn
- **{{forms.display_name}}** ("Visningsnamn"): Namnet andra ser
- Standard: Ditt fullständiga namn
- Kan vara smeknamn eller "Förnamn E." för integritet
- **{{auth.display_name_required}}** ("Visningsnamn måste anges")

#### E-postadress
- **{{forms.email}}** ("E-postadress"): Din giltig e-post
- Används för inloggning och bekräftelse
- **Tips**: Använd personlig e-post, inte jobbe-post

#### Lösenord
- **{{forms.password}}** ("Lösenord"): Minst 6 tecken
- **{{validation.password_min_length}}** ("Lösenordet måste vara minst 6 tecken långt")
- **Tips**: Använd lösenordshanterare (1Password, Bitwarden, etc.)

### 3. Godkänn villkor (GDPR)

Obligatoriskt enligt lag:

- ☑ **{{auth.gdpr_consent_text}}** ("Jag godkänner att BeReady lagrar och behandlar mina personuppgifter enligt GDPR...")
- **{{auth.gdpr_consent_required}}** ("Du måste godkänna villkoren för att skapa ett konto")

**Läs mer**:
- [{{auth.privacy_policy}}](/privacy) ("Integritetspolicy")
- [{{auth.terms_of_service}}](/terms) ("Användarvillkor")

### 4. Klicka "{{auth.create_account}}" ("Skapa konto")

### 5. Bekräfta e-post

1. Öppna din e-post
2. Hitta mail från "BeReady / Supabase"
3. Klicka på bekräftelselänken
4. Omdirigeras till inloggning

**OBS**: Om inget mail kommer inom 5 min, kolla skräppost!

### 6. Första inloggningen

1. Använd din e-post och lösenord
2. Omdirigeras till dashboard
3. **Rekommenderat**: Fyll i din profil omedelbart
   - Gå till **{{navigation.settings}}** ("Inställningar")
   - Lägg till postnummer för att hitta samhällen

## Tips

**🔒 Använd starkt lösenord**

Lösenordshanterare genererar och sparar starka lösenord åt dig!

**📧 Kolla skräppost**

Bekräftelsemails hamnar ibland i skräppost. Markera som "Ej skräppost" för framtida mail.

**📍 Ange plats direkt**

Lägg till ditt postnummer i **{{navigation.settings}}** ("Inställningar") direkt efter registrering för att hitta närliggande samhällen.

## Vanliga frågor

**Q: Varför behövs både namn och visningsnamn?**

A: **{{forms.name}}** ("Namn") är ditt riktiga namn (för administratörer). **{{forms.display_name}}** ("Visningsnamn") är vad andra ser offentligt.

**Q: Varför får jag inget bekräftelsemail?**

A: Kolla skräppost. Vänta 10 min. Försök "Skicka nytt mail" på registreringssidan.

**Q: Kan jag ändra e-postadress senare?**

A: Ja, i **{{navigation.settings}}** ("Inställningar") → Konto.

**Q: Är mina uppgifter säkra?**

A: Ja! Krypterad kommunikation, GDPR-compliance, säkra servrar (Supabase).

**Q: Kan jag radera mitt konto?**

A: Ja, **{{navigation.settings}}** ("Inställningar") → Konto → "Radera konto". Detta tar bort ALLT permanent.

**Q: Måste jag ange postnummer?**

A: Nej, men starkt rekommenderat. Utan postnummer kan du inte hitta lokala samhällen nära dig.

## Relaterade sidor

- [Auth - Login](/help/auth/login.md) - Logga in med ditt konto
- [Settings - Profile](/help/settings/profile.md) - Uppdatera din profil
- [Dashboard](/help/dashboard.md) - Översikt efter inloggning
