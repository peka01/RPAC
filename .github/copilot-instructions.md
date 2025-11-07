## Quick context for AI coding agents working on RPAC

This file contains short, actionable rules and references so an AI assistant can be immediately productive in this repository.

### 1. Where to run and build
- **Dev server**: Always run from `rpac-web` folder: `cd rpac-web; npm install; npm run dev`
- **Production build**: `cd rpac-web; npm run pages:build; npm run deploy` (uses `wrangler` for Cloudflare Pages)
- **MCP servers**: `mcp-servers` folder (start with `npm start`)
- ⚠️ **Common mistake**: Running `npm run dev` from root fails—`package.json` is in `rpac-web/`

### 2. High-level architecture (one-paragraph)
- **Frontend**: Next.js 15 (app router) in `rpac-web` (React 19 + TypeScript + Tailwind). Edge functions via `@cloudflare/next-on-pages`.
- **Backend**: Supabase (Postgres + RLS) as primary DB; Cloudflare Pages Functions for AI/edge APIs; small MCP servers in `mcp-servers`.
- **Communication**: Frontend → Supabase + Cloudflare endpoints; realtime via Supabase channels.
- **Features**: Phase 1 (Individual) ✅ COMPLETE, Phase 2 (Local Community) ✅ COMPLETE, Phase 3 (Regional) 🔄 IN PROGRESS.
- **Key routes**: `/dashboard`, `/individual`, `/local` (with tabs), `/regional`, `/settings`, `/[samhalle]` (public homespace), `/super-admin`.

### 3. Essential developer patterns and conventions (MANDATORY)
- **Localization**: ALL user-facing strings MUST use `t('key')` with keys in `rpac-web/src/lib/locales/sv.json`. NEVER hardcode Swedish text.
  - Example: ❌ `<h1>Hitta lokala samhällen</h1>` → ✅ `<h1>{t('community.find_local')}</h1>`
  - Check for Swedish characters (åäöÅÄÖ) outside JSON—if found, it's a bug.
- **Color system**: Olive-green palette ONLY. Primary: `#3D4A2B`. NO `blue-*` classes. See `.cursorrules`.
- **Mobile-first**: Use separate mobile components (`component-name-mobile.tsx`, `component-name-responsive.tsx`), NOT just responsive CSS.
  - Minimum touch targets: 44px × 44px (Apple HIG), prefer 48px+ for primary actions.
- **Shared list UI**: Use `ResourceListView` component for ALL lists/tables/cards. DO NOT create custom list implementations.
  - Location: `rpac-web/src/components/resource-list-view.tsx`
  - Built-in: search, filters, card/table toggle, mobile optimization.
- **Navigation**: URL parameters for tabs (e.g., `/local?tab=home`, `/individual?section=resources`).
- **Edge runtime**: ALL dynamic routes MUST export `export const runtime = 'edge';` for Cloudflare compatibility.

### 4. SQL / DB migration rules (CRITICAL—errors block deployment)
- **DO NOT use** `CREATE POLICY IF NOT EXISTS`—Postgres doesn't support it.
  - ✅ Correct: `DROP POLICY IF EXISTS "policy_name" ON table_name; CREATE POLICY "policy_name" ...`
- **Conditional DDL**: Wrap in `DO $$ ... END $$;` blocks for columns/indexes.
  ```sql
  DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='postal_code') THEN
      ALTER TABLE user_profiles ADD COLUMN postal_code VARCHAR(10);
    END IF;
  END $$;
  ```
- **Verify schema**: Check `rpac-web/database/supabase-schema-complete.sql` for correct table/column names before writing migrations.
- All migrations in `rpac-web/database/` must be idempotent.

### 5. Edge runtime / deployment gotchas
- Missing `export const runtime = 'edge';` in dynamic routes → deployment fails silently.
- Verify `wrangler.toml` has `compatibility_flags = ["nodejs_compat"]` and current `compatibility_date`.
- See `docs/PRODUCTION_DEPLOYMENT.md` for full deployment checklist.

### 6. Quick navigation references (files to load for context)
- **Start here**: `docs/NEW_CHAT_ONBOARDING.md` (onboarding guide for new chat sessions)
- **Core conventions**: `.cursorrules`, `docs/conventions.md`, `docs/llm_instructions.md`
- **Architecture**: `docs/architecture.md` (system overview + routing map)
- **Roadmap**: `docs/roadmap.md` (current priorities, sprint focus)
- **Components**: `rpac-web/src/components/resource-list-view.tsx` (canonical list component)
- **Navigation**: `rpac-web/src/components/side-menu-clean.tsx` (navigation structure)
- **Localization**: `rpac-web/src/lib/locales/sv.json` (all UI text keys)
- **Database**: `rpac-web/database/supabase-schema-complete.sql` (full schema)

### 7. Examples / quick snippets
**Dev server (Windows PowerShell):**
```powershell
cd rpac-web; npm install; npm run dev
```

**Build + deploy (Cloudflare Pages):**
```powershell
cd rpac-web; npm run pages:build; npm run deploy
```

**SQL migration pattern (conditional column):**
```sql
DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='postal_code') THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code VARCHAR(10);
  END IF;
END $$;
```

**Localization pattern:**
```tsx
import { t } from '@/lib/locales';
<h1>{t('dashboard.title')}</h1>  // ✅ Correct
<h1>BeReady</h1>                  // ❌ Wrong (hardcoded)
```

**Mobile component pattern:**
```
component-name.tsx              ← Desktop version
component-name-mobile.tsx       ← Mobile version
component-name-responsive.tsx   ← Wrapper (switches based on screen width)
```

### 8. What to change vs. what to NEVER change
**You may:**
- Refactor internal helpers, add tests, improve performance.
- Update `docs/dev_notes.md` (append-only log for implementation notes).

**NEVER:**
- Change localization to inline text (all text MUST be in `sv.json`).
- Switch palette to blue (olive-green `#3D4A2B` is mandatory).
- Remove `export const runtime = 'edge';` from edge routes.
- Use military jargon in user-facing text (visual design is semi-military, text is everyday Swedish).

### 9. Where to document your changes
- **Implementation notes**: Append to `docs/dev_notes.md` (date + description).
- **Architecture changes**: Update `docs/architecture.md` or `docs/conventions.md` (only for major changes).
- **Help docs**: Update corresponding `.md` files in `rpac-web/docs/help/` when changing features (MANDATORY).

### 10. Design philosophy (quick summary)
- **Visual design**: Semi-military (clean, direct, olive-green palette, clear hierarchy).
- **Text content**: Everyday Swedish (warm, accessible, NO technical/military jargon).
  - ✅ Good: "Laddar ditt hem", "Hämtar information"
  - ❌ Bad: "Initialiserar system", "Operativ databas"
- **UX principle**: "Every interaction should feel like having a wise, calm friend helping during crisis."

### 11. If you need more context (minimal checklist)
Load in order:
1. `docs/NEW_CHAT_ONBOARDING.md` (if new chat session)
2. `docs/llm_instructions.md` (current development status)
3. `docs/conventions.md` (design philosophy)
4. `docs/architecture.md` (technical architecture)
5. `.cursorrules` (mandatory coding rules)

---

**Quick sanity checks before committing:**
- [ ] No hardcoded Swedish text (search for åäöÅÄÖ in `.tsx` files)
- [ ] Using olive-green colors (`#3D4A2B`), NOT blue
- [ ] All dynamic routes have `export const runtime = 'edge';`
- [ ] Help docs updated if feature changed
- [ ] SQL tested for correct table/column names
- [ ] Minimum 44px touch targets for mobile

If any of these items are unclear, tell me which section to expand and I will iterate.
