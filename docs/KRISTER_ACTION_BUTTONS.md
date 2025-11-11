# KRISter Action Buttons - "Gör det åt mig"

**Date**: November 11, 2025  
**Feature**: Automatic action button detection in AI assistant responses

## Overview

KRISter AI assistant now automatically detects when it gives navigation instructions and adds "Gör det åt mig" (Do it for me) buttons that users can click to immediately navigate to the suggested location.

## How It Works

### 1. Pattern Detection

The system detects Swedish navigation instructions in AI responses using these patterns:

```typescript
// Patterns recognized:
- "Gå till **[Destination]**"
- "Navigera till **[Destination]**"
- "Öppna **[Destination]**"

// Examples:
"Gå till **Mitt hem**" → Creates button to /individual
"Öppna **Lokalt**" → Creates button to /local
"Gå till **Inställningar**" → Creates button to /settings
```

### 2. Route Mapping

The following Swedish UI terms are mapped to routes:

| Swedish Term | Route |
|--------------|-------|
| Mitt hem, Individuell | `/individual` |
| Lokalt, Samhälle | `/local` |
| Regionalt, Regional | `/regional` |
| Inställningar | `/settings` |
| Odling | `/individual?section=cultivation` |
| Resurser | `/individual?section=resources` |
| Kunskap | `/individual?section=knowledge` |
| AI-coach, Coach | `/individual?section=coach` |
| Hitta samhällen, Upptäck | `/local/discover` |
| Meddelanden | `/local?tab=messages` |

### 3. Button Rendering

When detected, action buttons appear below the AI message:

**Desktop**:
```tsx
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3D4A2B] hover:bg-[#2A331E] text-white text-xs font-semibold rounded-lg">
  Gör det åt mig
  <ArrowRight size={12} />
</button>
```

**Mobile**:
```tsx
<button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3D4A2B] hover:bg-[#2A331E] text-white text-sm font-semibold rounded-lg min-h-[44px]">
  Gör det åt mig
  <ArrowRight size={14} />
</button>
```

## AI Prompt Instructions

The AI has been instructed to format navigation recommendations with bold text:

```
**VIKTIGT**: Formatera med fetstil och specifik text så systemet kan skapa automatiska åtgärdsknappar:
✅ "Gå till **Mitt hem**" → Skapar knapp "Gör det åt mig" som navigerar dit
✅ "Öppna **Lokalt**" → Skapar knapp "Gör det åt mig"
✅ "Gå till **Inställningar**" → Skapar knapp
```

## Implementation Files

### Components
- **Desktop**: `rpac-web/src/components/krister-assistant.tsx`
  - `detectActions()` function (lines ~115-150)
  - Action button rendering in message display (lines ~1135-1150)

- **Mobile**: `rpac-web/src/components/krister-assistant-mobile.tsx`
  - `detectActions()` function (lines ~117-152)
  - Action button rendering in message display (lines ~740-760)

### AI Service
- **Prompt**: `rpac-web/src/lib/openai-worker-service.ts`
  - Updated system prompt with action button formatting instructions (lines ~630-645)

## User Experience

### Before
```
AI: "Du kan hitta dina resurser under Mitt hem-sektionen. 
Gå dit och klicka på Resurser."
```
User must manually navigate.

### After
```
AI: "Du kan hitta dina resurser under Mitt hem-sektionen. 
Gå till **Mitt hem**."

[Gör det åt mig →]  ← Clickable button
```
User clicks button, instantly navigates to /individual.

## Future Enhancements

### Potential additions:
1. **More action types**:
   - "Lägg till resurs" → Opens add resource modal
   - "Skapa plan" → Opens cultivation plan creator
   - "Gå med i samhälle" → Opens community discovery

2. **Context-aware actions**:
   - Detect entity IDs in responses (e.g., "resource-123")
   - Pre-fill forms with suggested data

3. **Multi-step workflows**:
   - "Först gå till **Mitt hem**, sedan klicka på **Lägg till resurs**"
   - Create sequence of buttons

4. **Analytics**:
   - Track which actions are most clicked
   - Improve AI prompts based on usage data

## Testing

Test cases:
```javascript
// Test 1: Basic navigation
Input: "Gå till **Lokalt**"
Expected: Button navigates to /local

// Test 2: Section navigation
Input: "Öppna **Odling** för att se din plan"
Expected: Button navigates to /individual?section=cultivation

// Test 3: No actions
Input: "Det är bra väder idag!"
Expected: No buttons shown

// Test 4: Multiple actions
Input: "Först gå till **Mitt hem**, sedan **Resurser**"
Expected: Two buttons (not yet implemented - shows only unique routes)
```

## RPAC Conventions

✅ **Follows conventions:**
- Swedish-first (all button text in Swedish)
- Olive-green color palette (#3D4A2B)
- Mobile-first (44px minimum touch targets on mobile)
- No hardcoded UI text (uses detection patterns)

⚠️ **Accessibility:**
- Buttons have clear hover states
- Active/pressed states with scale animation
- Sufficient color contrast (white on dark olive)
- Mobile: 44px minimum height for touch targets

## Related Documentation
- `docs/conventions.md` - Design system and color palette
- `docs/llm_instructions.md` - AI assistant behavior guidelines
- `.cursorrules` - Development standards

## Changelog

**2025-11-11**:
- Initial implementation of action button detection
- Added to both desktop and mobile components
- Updated AI prompt with formatting instructions
- Created this documentation

---

*For questions or improvements, see `.github/copilot-instructions.md`*
