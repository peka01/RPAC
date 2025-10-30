# KRISter Help Content System

## Overview

KRISter's context-aware help system uses **markdown documentation files** located in `rpac-web/docs/help/` that are:
- ✅ **Dynamically loaded** based on current route
- ✅ **Variable-driven** (text from `sv.json`, not hardcoded)
- ✅ **Maintainable** (update once, applies everywhere)
- ✅ **Version-controlled** (track changes over time)

## Directory Structure

```
rpac-web/docs/help/
├── dashboard.md                  # Main dashboard
├── individual/
│   ├── resources.md             # Resource inventory
│   ├── cultivation.md           # Cultivation planning
│   ├── knowledge.md             # MSB knowledge base
│   └── coach.md                 # AI coach
├── local/
│   ├── home.md                  # Community overview
│   ├── discover.md              # Find communities
│   ├── activity.md              # Activity feed
│   ├── resources-shared.md      # Shared resources
│   ├── resources-owned.md       # Community-owned resources
│   ├── resources-help.md        # Help requests
│   ├── messages-community.md    # Community chat
│   ├── messages-direct.md       # Direct messages
│   └── admin.md                 # Community administration
├── regional/
│   └── overview.md              # Regional coordination
├── settings/
│   ├── profile.md               # User profile
│   ├── account.md               # Account settings
│   └── privacy.md               # Privacy controls
└── admin/
    ├── super-admin.md           # Super admin dashboard
    └── homespace-editor.md      # Homespace editor
```

## Markdown File Format

Each help file MUST follow this structure:

```markdown
# {{krister.context_help.<key>.title}}

## Kontext

{{krister.context_help.<key>.description}}

[Brief overview of the feature/page]

## Steg-för-steg

### 1. [Step title]
[Detailed instructions]

### 2. [Next step]
[More instructions]

## Tips

{{krister.context_help.<key>.tips.0}}

{{krister.context_help.<key>.tips.1}}

{{krister.context_help.<key>.tips.2}}

## Vanliga frågor

**Q: [Question]**
A: [Answer with references to {{variables}}]

## Relaterade sidor
- [Title](/help/path/to/file.md) - Description
```

## Variable Interpolation

### Rules

1. **NEVER hardcode Swedish text** in markdown files
2. **ALWAYS use** `{{variable.path}}` syntax for UI text
3. **Reference locales** from `rpac-web/src/lib/locales/sv.json`

### Examples

❌ **WRONG** (hardcoded):
```markdown
Klicka på "Översikt" för att se dashboard
```

✅ **CORRECT** (variable):
```markdown
Klicka på "{{navigation.overview}}" för att se dashboard
```

❌ **WRONG**:
```markdown
Gå till Inställningar → Profil
```

✅ **CORRECT**:
```markdown
Gå till {{navigation.settings}} → {{settings.tabs.profile}}
```

### Available Variable Paths

From `sv.json`:
- `{{navigation.*}}` - Navigation labels
- `{{krister.context_help.<page>.*}}` - Context help text
- `{{settings.*}}` - Settings page text
- `{{local.*}}` - Local community text
- `{{individual.*}}` - Individual page text
- `{{dashboard.*}}` - Dashboard text

## Mandatory Update Rules

### ⚠️ CRITICAL: When to Update Help Docs

**EVERY time you make ANY of these changes, you MUST update the corresponding help docs:**

1. **Add a new page/route** → Create new help `.md` file
2. **Change UI text** → Update variables in help `.md`
3. **Add a feature** → Add step-by-step in help `.md`
4. **Remove a feature** → Remove from help `.md`
5. **Change navigation** → Update related pages links
6. **Add a button/action** → Document in "Steg-för-steg"
7. **Change workflow** → Update step numbering

### Checklist Before Committing

- [ ] New feature → Help `.md` created/updated
- [ ] Changed workflow → Steps updated in `.md`
- [ ] New UI text → Added to `sv.json` AND referenced in `.md`
- [ ] Removed feature → Removed from `.md`
- [ ] Changed route → Updated "Relaterade sidor" links

## Loading Help Content

### Service: `krister-help-loader.ts`

Located at: `rpac-web/src/lib/krister-help-loader.ts`

```typescript
import { t } from '@/lib/locales';

export class KRISterHelpLoader {
  static async loadHelpContent(route: string): Promise<HelpContent> {
    // Loads .md file based on route
    // Interpolates {{variables}} from sv.json
    // Returns parsed content
  }
}
```

### Usage in KRISter Components

```typescript
import { KRISterHelpLoader } from '@/lib/krister-help-loader';

// In component:
const helpContent = await KRISterHelpLoader.loadHelpContent(currentPage);
```

## Route Mapping

| Route | Help File |
|-------|-----------|
| `/` or `/dashboard` | `dashboard.md` |
| `/individual?section=resources` | `individual/resources.md` |
| `/individual?section=cultivation` | `individual/cultivation.md` |
| `/local` or `/local?tab=home` | `local/home.md` |
| `/local/discover` | `local/discover.md` |
| `/local?tab=activity` | `local/activity.md` |
| `/local?tab=resources&resourceTab=shared` | `local/resources-shared.md` |
| `/local?tab=resources&resourceTab=owned` | `local/resources-owned.md` |
| `/local?tab=resources&resourceTab=help` | `local/resources-help.md` |
| `/local/messages/community` | `local/messages-community.md` |
| `/local/messages/direct` | `local/messages-direct.md` |
| `/regional` | `regional/overview.md` |
| `/settings?tab=profile` | `settings/profile.md` |
| `/super-admin` | `admin/super-admin.md` |

## Enforcement

### In Code Reviews

Reviewers MUST check:
1. Does PR add/modify a feature?
2. Is corresponding help `.md` updated?
3. Are all UI texts using `{{variables}}`?
4. Are "Relaterade sidor" links correct?

### In CI/CD (Future)

Add automated checks:
- Scan for hardcoded Swedish in `.md` files
- Verify all `{{variables}}` exist in `sv.json`
- Check broken internal links

## Benefits

✅ **Single source of truth** - Update once, applies everywhere
✅ **Consistent** - All help text follows same format
✅ **Maintainable** - Easy to find and update
✅ **Translatable** - Variables make i18n easy
✅ **Trackable** - Git history shows content evolution
✅ **Context-aware** - KRISter always shows relevant help

## Examples

See existing files:
- `rpac-web/docs/help/dashboard.md`
- `rpac-web/docs/help/individual/resources.md`
- `rpac-web/docs/help/individual/cultivation.md`
- `rpac-web/docs/help/local/home.md`
