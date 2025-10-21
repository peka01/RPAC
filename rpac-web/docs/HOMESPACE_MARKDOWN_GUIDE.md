# Markdown Guide for Homespace - Beready

## ✅ Markdown Now Works!

The homespace editor now supports full Markdown formatting with beautiful olive-green styling.

---

## 📝 Markdown Syntax Examples

### Headings
```markdown
# Stor rubrik (H1)
## Mellanstor rubrik (H2)
### Mindre rubrik (H3)
```

**Renders as:**
- Large olive green headings (#3D4A2B)
- Hierarchical sizing
- Professional spacing

---

### Text Formatting
```markdown
**Fet text** för viktiga punkter

*Kursiv text* för betoning

***Fet och kursiv*** för extra viktig text
```

**Renders as:**
- **Bold text** in olive green
- *Italic text* with subtle emphasis
- ***Both*** for maximum impact

---

### Lists

#### Bullet Lists
```markdown
- Första punkten
- Andra punkten
  - Underpunkt
  - Ännu en underpunkt
- Tredje punkten
```

#### Numbered Lists
```markdown
1. Första steget
2. Andra steget
3. Tredje steget
```

---

### Links
```markdown
[Besök MSB](https://www.msb.se)
```

**Renders as:** Links in olive green (#5C6B47) with hover effect

---

### Blockquotes
```markdown
> Detta är ett citat eller viktigt meddelande
> som sträcker sig över flera rader
```

**Renders as:** Styled quote box with left border

---

### Code
```markdown
Inline `kod` ser ut så här.

\`\`\`
Kod-block
för flera rader
\`\`\`
```

---

## 🎨 Example Homespace Content

### "Om vårt samhälle" Section

```markdown
# Välkommen till Nykulla!

Vi är ett lokalt beredskapssamhälle i Kronoberg län som arbetar tillsammans för att stärka vår gemensamma motståndskraft.

## Våra värderingar

- **Ömsesidig hjälp och respekt** - Vi hjälper varandra i både vardag och kris
- **Lokal självförsörjning** - Vi odlar tillsammans och delar kunskap
- **Transparent resursdelning** - Öppet och ärligt om vad vi har och behöver
- **Svenskt krisberedskapstänk** enligt MSB

## Vad vi gör tillsammans

### 🌱 Gemensam odling
Vi har flera odlingslotter där vi odlar grönsaker för självförsörjning. Varje vecka delar vi skörden.

### 🔧 Kompetensutbyte
Våra medlemmar har olika kompetenser som vi delar:
1. VVS och elkunskap
2. Snickeri och byggkompetens
3. Trädgårdsmästare och odlare
4. Sjuksköterskor och första hjälpen

### 📦 Resursdelning
Vi har gemensamma resurser:
- Generator (3 kW)
- Vattendunkar (200 liter)
- Förstahj��lpen-lådor
- Verktyg för bygge och reparation

## Bli medlem!

Vill du vara med och bygga motståndskraft? Vi välkomnar alla som:
- Bor i närområdet (Nykulla och omnejd)
- Delar våra värderingar
- Är redo att både ge och ta emot hjälp

[Kontakta oss](mailto:admin@nykulla.se) för mer information!
```

---

### "Vem kan gå med?" Section

```markdown
## Medlemskap i Nykulla

Vi välkomnar alla som:

### Grundkrav
- ✅ Bor i Nykulla eller närområdet (max 15 min)
- ✅ Delar våra värderingar om ömsesidig hjälp
- ✅ Kan delta i gemensamma aktiviteter minst en gång per månad

### Vad vi förväntar oss
- **Aktivt deltagande** - Kom på minst ett möte/aktivitet per månad
- **Resursdelning** - Registrera dina resurser i appen
- **Öppen kommunikation** - Vara ärlig om vad du kan bidra med
- **Respekt** - Behandla alla medlemmar med respekt

### Vad du får
- Tillgång till gemensamma resurser
- Nätverk av kunniga grannar
- Trygghet i kris
- Gemenskap och nya vänner

> **OBS!** Vi är **inte** ett politiskt parti eller religiös organisation. 
> Vi är helt enkelt grannar som hjälps åt.

**Redo att gå med?** Klicka på knappen nedan!
```

---

## 🎯 Best Practices

### DO ✅
- Use headings to structure content
- Use bold for important points
- Use lists for easy scanning
- Keep paragraphs short (2-4 sentences)
- Add emojis for visual interest (✅ 🌱 🏡 🔧)
- Use blockquotes for important notes

### DON'T ❌
- Don't use too many heading levels (stick to H2-H3)
- Don't overuse bold/italic (loses impact)
- Don't write huge paragraphs (hard to read)
- Don't use technical jargon
- Don't forget line breaks between sections

---

## 🔧 Technical Details

### Installed Packages
- `react-markdown` - Markdown rendering
- `@tailwindcss/typography` - Beautiful prose styling

### Custom Styles
The prose classes use Beready's olive green color palette:
- Headings: `#3D4A2B` (dark olive)
- Links: `#5C6B47` (medium olive)
- Bold text: `#3D4A2B` (dark olive)

### Where Markdown Works
1. **"Om vårt samhälle"** section (About)
2. **"Vem kan gå med?"** section (Membership criteria)

---

## 🧪 Testing Markdown

1. Go to your Homespace editor
2. Paste this test content:

```markdown
# Test Markdown

## This is a heading

This is **bold text** and this is *italic text*.

### A list:
- First item
- Second item
- Third item

[A link](https://msb.se)

> A quote or important note
```

3. Click "Förhandsgranska" tab
4. You should see beautiful formatted content!

---

**Status**: ✅ Fully functional  
**Colors**: Olive green theme matching Beready  
**Support**: Full Markdown syntax

