# Help Text Writing Conventions for RPAC

**Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Mandatory for all help documentation

## Overview

This document defines the standards for writing help documentation in RPAC (Regional Preparedness and Community). All help texts must be concise, clear, actionable, and properly localized.

**Core Principles:**
1. **Swedish-first**: All content written in Swedish, using everyday language (no military jargon)
2. **Variable-based UI references**: Never hardcode UI text, always use localization keys
3. **Actionable**: Every help topic provides clear instructions for preferred workflows
4. **Synchronized**: Help updates trigger AI assistant knowledge updates

## Pre-Writing Checklist

### Content Planning
- [ ] **Determine information type:** Overview, Instructions, FAQ, Troubleshooting
- [ ] **Identify target audience:** Individual user, Community Manager, Super Admin
- [ ] **Define scope:** What exactly will this help text cover?
- [ ] **Check prerequisites:** What should users know or have done before this?
- [ ] **Test the feature:** Follow exact steps in both desktop and mobile views
- [ ] **⚠️ VERIFY COMPONENT MATCH:** Help must describe EXACTLY what users see in the actual component/page

### Research Requirements
- [ ] **Test the feature personally:** Use it as the target user would
- [ ] **Note exact interface text:** Document all button names, menu items, field labels
- [ ] **Find localization keys:** Look up keys in `rpac-web/src/lib/locales/sv.json`
- [ ] **Read the actual component code:** Verify what fields, buttons, and sections actually exist
- [ ] **⚠️ CRITICAL: Compare help to component:** Ensure help describes what's implemented, not what was planned
- [ ] **Identify common issues:** What problems do users encounter?
- [ ] **Check related features:** What other parts connect to this?
- [ ] **Review mobile experience:** Verify mobile-specific UI elements and workflows

## Writing Checklist

### Structure and Organization

#### Header Formats (Required)
- [ ] **Overview pages:** Mirror feature name (e.g., "Odlingsplanering", "Regional översikt")
- [ ] **Instructions:** Start with verb (e.g., "Skapa samhälle", "Bjud in medlem")
- [ ] **FAQ:** Write as question (e.g., "Hur ställer jag in mitt län?")
- [ ] **Troubleshooting:** Problem statement (e.g., "Jag kan inte se mitt samhälle")

#### Content Structure (Required for Each Type)

**Overview pages:**
```markdown
[🏠](/help/dashboard.md) > [Section](/help/section.md) > Current Page Name

# [Feature Name]

[Brief intro: What is this? Why does it exist?]
[Current features list]

## Steg-för-steg
[Detailed instructions with numbered sections]

## Tips
[Practical advice with 💡 emoji]

## Vanliga frågor
[Common Q&A]

## Relaterade sidor
[Links to related help]
```

**Breadcrumb Navigation (MANDATORY):**
- [ ] **Always include at top of page** - Shows user's location in help system
- [ ] **Format:** `[🏠](/help/dashboard.md) > [Section](/help/section.md) > Current Page`
- [ ] **Home icon linked** - Use 🏠 emoji linking to dashboard (no colored icons per RPAC style)
- [ ] **Current page NOT linked** - Just plain text
- [ ] **Example:** `[🏠](/help/dashboard.md) > [Lokalt](/help/local/home.md) > [Resurser](/help/local/resources-shared.md) > Delade resurser`

**Location Context (REMOVED):**
- The location context blockquote has been removed as breadcrumb navigation is sufficient

**Note:** Do NOT include status indicators (e.g., "Status: ✅ Fullt fungerande") in help documentation. Features documented in help files are assumed to be functional.

**Instruction pages:**
```markdown
# [Action Verb + Object]

## Vad du behöver veta innan du börjar
[Prerequisites and context]

## Så här gör du
1. [Step 1]
2. [Step 2]
...

## Nästa steg
[What to do after completion]

## Relaterade guider
[Links to related topics]
```

### Language and Style (MANDATORY)

#### RPAC-Specific Tone Guidelines

- [ ] **ENKLA (Simple):**
  - [ ] Use everyday Swedish (not technical jargon)
  - [ ] Short, clear sentences
  - [ ] No military terminology in user-facing text
  - [ ] Avoid: "initialisera", "operativ", "deployera", "konfiguration"
  - [ ] Use: "starta", "aktiv", "ladda", "inställningar"

- [ ] **ENGAGERADE (Engaging):**
  - [ ] Warm, encouraging tone
  - [ ] Celebrate progress ("Bra jobbat!", "Nu är du igång!")
  - [ ] Create confidence during crisis preparation
  - [ ] Use second person ("du", "ditt")

- [ ] **MÄNSKLIGA (Human):**
  - [ ] Write as if helping a neighbor
  - [ ] Acknowledge real fears about crisis preparedness
  - [ ] Recognize life context (family, community, reality)
  - [ ] Empathetic approach to sensitive topics

#### RPAC Terminology Standards

- [ ] ✅ **Use:** "BeReady", "samhälle" (community), "medlem", "resurs", "beredskap"
- [ ] ✅ **Use:** "länsöversikt", "aktivitetsflöde", "odlingsplan", "hemmet" (homespace)
- [ ] ❌ **Avoid:** "produkt", "system", "applikation", "tjänst", "plattform"
- [ ] ❌ **Avoid:** Military terms: "operation", "deployment", "mission", "sektor"

#### Imperative Mood (Instructions)
- [ ] ✅ "Klicka på **{t('navigation.regional')}**"
- [ ] ✅ "Ange ditt postnummer"
- [ ] ❌ "Du klickar på Regional"
- [ ] ❌ "Du bör ange ditt postnummer"

### UI Text References (CRITICAL)

#### Localization Key Format (MANDATORY)
- [ ] **NEVER hardcode UI text** - Always use `{t('key.path')}`
- [ ] **Show the actual text in parentheses** for readability
- [ ] **Verify key exists** in `rpac-web/src/lib/locales/sv.json`

**Correct Format:**
```markdown
1. Klicka på **{t('navigation.regional')}** ("Regional") i sidomenyn
2. Välj **{t('regional.community_list')}** ("Samhällen i länet")
3. Klicka på **{t('common.create')}** ("Skapa")
```

**Incorrect Format:**
```markdown
❌ 1. Klicka på "Regional" i sidomenyn
❌ 2. Välj fliken "Samhällen i länet"
❌ 3. Klicka på "Skapa"-knappen
```

#### Interface Text Styling
- [ ] UI element names in **bold**
- [ ] Include localization key reference when first mentioned
- [ ] Show Swedish text in parentheses for clarity (optional after first mention)
- [ ] Use exact capitalization from interface
- [ ] **NEVER reference URL paths** - Use menu navigation only

**Examples:**
- "Gå till **Inställningar**" (not "Gå till /settings")
- "Klicka på **Lokalt** i sidomenyn" (not "Navigera till /local")
- "Välj **Resurser** > **Delade resurser**" (not "Gå till /local?tab=resources&resourceTab=shared")

### Content Quality

#### Mandatory Page Elements (CRITICAL)
- [ ] **Breadcrumb navigation** - Always at top, before title (use [🏠](/help/dashboard.md) for home link)
- [ ] **Bold UI terms** - All menu names, button labels, field names in bold
- [ ] **Menu-based navigation** - Never reference URL paths (no `/local/discover`, etc.)

#### Instructions Must Be:
- [ ] **Complete:** All necessary steps included in order
- [ ] **Tested:** Personally verified by following them
- [ ] **Mobile-aware:** Note differences between desktop and mobile when relevant
- [ ] **Context-aware:** Explain WHY, not just HOW
- [ ] **Actionable:** Clear next steps provided

#### Common Scenarios to Cover:
- [ ] First-time use
- [ ] Empty states ("Inga samhällen registrerade än")
- [ ] Desktop vs. mobile differences
- [ ] What to do if user hasn't set required profile data (county, postal code, etc.)
- [ ] Edge runtime limitations (if applicable)

### Mobile-Specific Considerations
- [ ] **Touch targets:** Note when buttons are sized for mobile (44px+ targets)
- [ ] **Navigation differences:** Mobile uses bottom navigation, desktop uses side menu
- [ ] **Tab navigation:** Many mobile views use tabs instead of side-by-side layout
- [ ] **Gesture hints:** Mention swipe, tap, long-press where relevant

## Developer UI Text Checklist

### Before Adding Any UI Text
- [ ] **Swedish text written first** - Think in Swedish, not English
- [ ] **Key name chosen** - Descriptive, hierarchical (e.g., `regional.county_overview`)
- [ ] **Swedish locale updated** - Added to `rpac-web/src/lib/locales/sv.json`
- [ ] **Component uses translation** - `const { t } = useTranslation(); {t('key.path')}`
- [ ] **No hardcoded text** - All UI text from localization files
- [ ] **Tested in app** - Verify text displays correctly in all contexts

### Common UI Text Mistakes (RPAC-Specific)
- [ ] ❌ Hardcoding "Skapa samhälle" directly in component
- [ ] ❌ Hardcoding "Regional översikt" in page title
- [ ] ❌ Using generic keys like `button1`, `text1`, `title`
- [ ] ❌ Forgetting to update help docs when changing UI text keys
- [ ] ❌ Using blue colors (RPAC uses olive green `#3D4A2B`)
- [ ] ❌ Adding inline Swedish text that should be localized

### Correct UI Text Implementation
```json
// rpac-web/src/lib/locales/sv.json
{
  "regional": {
    "county_overview": "Länsöversikt",
    "your_county": "Ditt län",
    "active_communities": "Aktiva samhällen"
  }
}
```

```tsx
// Component
import { t } from '@/lib/locales';

<h1>{t('regional.county_overview')}</h1>
<p>{t('regional.your_county')}: {county}</p>
```

```markdown
<!-- Help documentation -->
Klicka på **{t('regional.county_overview')}** ("Länsöversikt")
```

## Post-Writing Checklist

### Review and Testing
- [ ] **Readability test:**
  - [ ] Read text out loud naturally
  - [ ] No stumbling on complex sentences
  - [ ] Sounds like friendly conversation
  - [ ] Swedish sounds natural (not translated from English)

- [ ] **⚠️ CRITICAL - Component accuracy verification:**
  - [ ] **Open the actual component file** (e.g., `unified-profile-settings.tsx`, `settings/page.tsx`)
  - [ ] **Compare help against component JSX** - Every section, field, button in help must exist in component
  - [ ] **Verify no phantom features** - Remove any help text describing features not yet implemented
  - [ ] **Check field types and validation** - Ensure help describes actual constraints (e.g., max file size, required fields)
  - [ ] **Test the exact workflow** - Follow help instructions in the actual app to confirm accuracy

- [ ] **Fact checking:**
  - [ ] Instructions followed exactly as written
  - [ ] All localization keys verified in `sv.json`
  - [ ] Links tested and working
  - [ ] Screenshots accurate (if used)
  - [ ] Database table/column names correct (if mentioned)
  - [ ] Component code reviewed for accuracy

- [ ] **User perspective:**
  - [ ] Would a new user understand this?
  - [ ] Are all RPAC-specific terms explained?
  - [ ] Is the "why" clear, not just the "how"?
  - [ ] Does it solve the user's actual problem?

### Technical Quality
- [ ] **Markdown formatting:**
  - [ ] Headers use proper hierarchy (#, ##, ###)
  - [ ] Lists correctly structured with proper indentation
  - [ ] Bold for UI elements: `**{t('key')}**`
  - [ ] Links properly formatted: `[Text](path)`
  - [ ] Code blocks use proper syntax highlighting

- [ ] **RPAC-specific checks:**
  - [ ] No hardcoded Swedish text with åäöÅÄÖ outside JSON files
  - [ ] All color references use olive green palette
  - [ ] Mobile-first approach mentioned where relevant
  - [ ] Edge runtime compatibility noted if relevant
  - [ ] References to Supabase tables use correct names from schema

### Localization Verification (MANDATORY)
- [ ] **All UI references use keys:**
  - [ ] Search doc for hardcoded UI text (åäöÅÄÖ characters)
  - [ ] All UI elements use `{t('key.path')}` format
  - [ ] Keys exist in `rpac-web/src/lib/locales/sv.json`
  - [ ] Swedish text shown in parentheses for clarity

- [ ] **Key validation:**
  - [ ] Opened `rpac-web/src/lib/locales/sv.json`
  - [ ] Verified exact key paths (case-sensitive)
  - [ ] Confirmed keys are still used in current codebase
  - [ ] No deprecated keys referenced

### AI Assistant Synchronization (CRITICAL)
- [ ] **Update AI knowledge when help changes:**
  - [ ] Major feature help updates → Update `docs/llm_instructions.md`
  - [ ] New help files created → Update `.github/copilot-instructions.md`
  - [ ] UI text keys changed → Update both help docs AND localization files
  - [ ] Architecture changes → Update `docs/architecture.md`
  - [ ] Convention changes → Update `docs/conventions.md`

- [ ] **Append to dev notes:**
  - [ ] Add entry to `docs/dev_notes.md` with date
  - [ ] Describe what help was updated and why
  - [ ] Note any localization key changes

## Final Quality Check

### Before Committing
- [ ] **Content is accurate** - Matches current implementation
- [ ] **All keys verified** - Exist in `sv.json` and work in app
- [ ] **Instructions tested** - Personally followed them successfully
- [ ] **No broken links** - All internal and external links work
- [ ] **Mobile considered** - Mobile differences noted where relevant
- [ ] **Tone is correct** - Warm, everyday Swedish (not military jargon)
- [ ] **File location correct** - In `rpac-web/public/help/[category]/[topic].md`

### Help File Structure Validation
- [ ] **Correct directory:** `rpac-web/public/help/[category]/`
  - `individual/` - Personal preparedness features
  - `local/` - Local community features
  - `regional/` - County-level features
  - `dashboard/` - Overview and navigation
  - `settings/` - User settings and profile
  - `admin/` - Super admin features

- [ ] **Naming convention:** `kebab-case.md` (e.g., `overview.md`, `create-community.md`)

### Documentation Update Triggers
- [ ] **When to update help:**
  - [ ] New feature added to any view
  - [ ] UI text changed or keys renamed
  - [ ] Navigation structure changed
  - [ ] User workflow changed
  - [ ] Bug fix changes expected behavior
  - [ ] Feature moved from "coming soon" to "implemented"
  - [ ] **⚠️ Component refactored or fields changed** - Re-verify help against new implementation

- [ ] **What to update:**
  - [ ] The specific help file affected
  - [ ] Related help files that link to it
  - [ ] FAQ sections mentioning the feature
  - [ ] `docs/dev_notes.md` with changelog entry
  - [ ] `docs/llm_instructions.md` if major feature

### Component-to-Help Audit Process (MANDATORY)
When creating or updating help documentation:

1. **Identify the component:**
   - Find the React component file (e.g., `src/app/settings/page.tsx`)
   - Note any sub-components (e.g., `UnifiedProfileSettings`)

2. **Read the component code:**
   - List all form fields, their types, and validation rules
   - Note all sections, tabs, or collapsible areas
   - Document all buttons and their actions
   - Check for conditional rendering (features that only show in certain states)

3. **Create component inventory:**
   ```markdown
   Component: unified-profile-settings.tsx
   Fields:
   - display_name (text, required)
   - first_name (text, optional)
   - last_name (text, optional)
   - avatar_url (file upload, max 2MB, JPG/PNG/GIF)
   - email (read-only)
   - phone (text, optional)
   - address (text, optional)
   - postal_code (text, optional, triggers county auto-fill)
   - city (text, optional)
   - county (auto-filled, read-only)
   - family_size (number, min 1)
   - has_pets (checkbox)
   - pet_types (text, conditional on has_pets)
   
   Sections:
   - Profile (avatar, names, contact)
   - Location (address, postal code, city, county)
   - Household (family size, pets)
   
   Actions:
   - Upload avatar
   - Remove avatar
   - Save all (single button at bottom)
   ```

4. **Write help matching inventory:**
   - Every field in component → documented in help
   - Every section in component → section in help
   - No extra features in help that don't exist in component

5. **Cross-check after writing:**
   - Read help paragraph by paragraph
   - For each instruction, verify it works in the actual app
   - Flag any discrepancies immediately

## Content Type Templates

### Overview Page Template
```markdown
[🏠](/help/dashboard.md) > [Section](/help/section.md) > Current Page Name

# [Feature Name]

[Brief intro paragraph explaining what this feature is and why it exists]

**Tillgängliga funktioner:**
- [Function 1]
- [Function 2]
- [Function 3]

## Steg-för-steg

### 1. [First major topic]
[Explanation with examples using bold UI terms]

### 2. [Second major topic]
[Explanation with examples]

## Tips

**💡 [Tip 1 title]**

[Tip explanation]

**💡 [Tip 2 title]**

[Tip explanation]

## Vanliga frågor

**Q: [Question]?**

A: [Answer using bold UI terms, no URL paths]

## Relaterade sidor
- [Link 1](/help/path.md) - Description
- [Link 2](/help/path.md) - Description
```

### Instruction Page Template
```markdown
# [Action Verb + Object]

## Vad du behöver veta innan du börjar

**Krav:**
- [Prerequisite 1]
- [Prerequisite 2]

**Tips:** [Helpful context]

## Så här gör du

1. Gå till **{t('navigation.section')}** ("[Swedish text]")
2. Klicka på **{t('action.button')}** ("[Swedish text]")
3. [Continue numbered steps]

**Resultat:** [What happens after completion]

## Nästa steg

[What the user should do next]

## Relaterade guider
- [Link to related topic]
```

### FAQ Template
```markdown
# Vanliga frågor - [Feature Area]

**Q: [Common question]?**
A: [Concise answer]. [Link to detailed topic if needed]

**Q: [Another question]?**
A: [Answer]
```

## Quick Reference

### RPAC-Specific Elements

#### Navigation Structure
- **Desktop:** Side menu (left) - Use `{t('navigation.item')}`
- **Mobile:** Bottom navigation bar - Same keys, different layout
- **Main sections:** Individual (`/individual`), Local (`/local`), Regional (`/regional`), Settings (`/settings`)

#### Common UI Patterns
- **Tabs:** Many sections use tab navigation (e.g., Local has Home, Members, Resources tabs)
- **Cards:** Statistics and data shown in card format
- **Lists:** Use `ResourceListView` component for consistency
- **Empty states:** Always show encouraging message and next action

#### Database References (When Needed)
- Tables: `local_communities`, `community_memberships`, `user_profiles`, `resource_sharing`
- Always verify table/column names in `rpac-web/database/supabase-schema-complete.sql`

### Localization Key Examples (RPAC)

**Navigation:**
- `{t('navigation.individual')}` ("Mitt hem")
- `{t('navigation.local')}` ("Lokalt")
- `{t('navigation.regional')}` ("Regional")
- `{t('navigation.settings')}` ("Inställningar")

**Regional:**
- `{t('regional.county_overview')}` ("Länsöversikt")
- `{t('regional.active_communities')}` ("Aktiva samhällen")
- `{t('regional.total_members')}` ("Totalt antal medlemmar")

**Individual:**
- `{t('individual.cultivation_planning')}` ("Min odling")
- `{t('individual.personal_resources')}` ("Personliga resurser & verktyg")

**Common:**
- `{t('common.create')}` ("Skapa")
- `{t('common.save')}` ("Spara")
- `{t('common.cancel')}` ("Avbryt")
- `{t('common.loading')}` ("Laddar")

### Tone Examples (RPAC-Specific)

#### ✅ Good - Everyday Swedish
- "Laddar ditt hem" (not "Initialiserar system")
- "Hämtar information" (not "Fetchar data")
- "Välj ditt län" (not "Konfigurera regional enhet")
- "Bra jobbat! Nu är du igång" (not "Operationen slutfördes framgångsrikt")

#### ❌ Bad - Technical/Military Jargon
- "Deployera resurser"
- "Operativ databas"
- "Konfigurationspanel"
- "Systeminitiering"

#### ✅ Good - Warm and Encouraging
- "Tre steg och du är igång!"
- "Vi guidar dig hela vägen"
- "Bli först att skapa ett samhälle i ditt län"
- "Tips: Ange din plats för att få bättre översikt"

#### ❌ Bad - Cold and Technical
- "För att komma igång behöver du först navigera till inställningar"
- "Systemet kräver att du anger platsinformation"
- "Operationen måste slutföras innan fortsättning"

---

## Route Mappings Configuration

### Using the Route Mappings Editor

When adding new pages or help files, update route mappings using the visual editor:

1. **Open Help Editor:**
   - Click KRISter help icon
   - Click "Redigera hjälpfil" button
   - Switch to "Rutt-mappningar" tab

2. **Add New Mapping:**
   - **Rutt**: URL pattern (e.g., `/settings`, `/local`)
   - **Parametrar**: URL params if needed (e.g., `?tab=profile`)
   - **Hjälpfil**: Path to .md file without extension (e.g., `settings/profile`)
   - Click "Lägg till"

3. **Save Changes:**
   - Click "Spara ändringar" button
   - Mappings persist in `config/help-mappings.json`

**Full documentation:** See `docs/ROUTE_MAPPINGS_EDITOR.md`

**Best Practices:**
- Keep route patterns simple and exact (no regex complexity)
- Use lowercase for consistency
- Organize help files by feature area (e.g., `settings/`, `local/`)
- Test mapping by navigating to the page and checking KRISter

---

## Implementation Checklist for This Document

### Integration with Existing Docs
- [ ] Reference from `.cursorrules` file
- [ ] Link from `docs/conventions.md`
- [ ] Mention in `docs/NEW_CHAT_ONBOARDING.md`
- [ ] Add to `.github/copilot-instructions.md` section 9

### Required Changes to Workflow
- [ ] Add help documentation review to PR checklist
- [ ] Include localization key verification in code review
- [ ] Automated check for hardcoded Swedish text (grep for åäöÅÄÖ in .tsx files)
- [ ] Update `docs/dev_notes.md` when help files change

---

**Remember:** Help documentation is part of the user experience. Clear, accurate, properly localized help builds trust and makes RPAC more accessible during crisis situations.

**Key Principle:** When in doubt, test the feature yourself, write in everyday Swedish, use localization keys, and imagine explaining it to a neighbor over coffee.
