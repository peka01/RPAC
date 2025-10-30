## Quick context for AI coding agents working on RPAC

This file contains short, actionable rules and references so an AI assistant can be immediately productive in this repository.

1. Where to run and build
   - Always run the dev server from the `rpac-web` folder. Example: `cd rpac-web; npm install; npm run dev`.
   - Production Cloudflare Pages build: in `rpac-web` run `npm run pages:build` then `npm run deploy` (uses `wrangler`). See `rpac-web/package.json` for scripts.
   - MCP helper servers live in `mcp-servers` (start with `npm start` there).

2. High-level architecture (one-paragraph)
   - Frontend: Next.js (app router) in `rpac-web` (React + TypeScript + Tailwind). Edge functions adapt via `@cloudflare/next-on-pages`.
   - Backend: Supabase (Postgres + RLS) as primary DB; Cloudflare Workers/Functions for AI/edge APIs; some small MCP servers in `mcp-servers`.
   - Communication: Frontend talks to Supabase and Cloudflare Worker endpoints; realtime via Supabase channels.
   - Features: Phase 1 (Individual) & Phase 2 (Local Community) COMPLETE. Phase 3 (Regional) in progress.
   - Key routes: `/dashboard`, `/individual`, `/local` (with tabs), `/regional`, `/settings`, `/[samhalle]` (public homespace), `/super-admin`.

3. Essential developer patterns and conventions to preserve
   - Localization: All user-facing strings must use `t('...')` with keys in `rpac-web/src/lib/locales/sv.json`. NEVER hardcode Swedish text in components.
   - Color system: Olive-green palette is required. Primary hex: `#3D4A2B`. Avoid any `blue-*` classes. See `.cursorrules` and `docs/conventions.md`.
   - Mobile-first: Mobile variants are explicit files (e.g. `component-name-mobile.tsx`) — use those for touch UI.
   - Shared list UI: Use the universal `ResourceListView` component for lists/tables/cards rather than creating bespoke list components.
   - Navigation: URL parameter-driven for tabs within pages (e.g., `/local?tab=home`, `/individual?section=resources`).
   - Routes: All dynamic routes must export `export const runtime = 'edge';` for Cloudflare Pages compatibility.

4. SQL / DB migration rules (critical)
   - Postgres & Supabase specific: do NOT use `CREATE POLICY IF NOT EXISTS` — instead `DROP POLICY IF EXISTS ...; CREATE POLICY ...`.
   - Use `DO $$ ... END $$;` for conditional column/index creation. Check `rpac-web/database/supabase-schema-complete.sql` before writing migrations.
   - All SQL migration scripts in `rpac-web/database/` are expected to be idempotent and checked before applying to production.

5. Edge runtime / deployment gotchas
   - Dynamic routes and API handlers that must run on the Cloudflare Edge must export `export const runtime = 'edge';` at the top of route files. Many deployments fail when this is missing.
   - Ensure `wrangler.toml` compatibility flags are set (see `docs/PRODUCTION_DEPLOYMENT.md` and `docs/dev_notes.md`).

6. Quick navigation references (files to load for context)
   - `docs/architecture.md` — system overview with complete routing map
   - `docs/llm_instructions.md` and `docs/NEW_CHAT_ONBOARDING.md` — LLM-specific expectations and onboarding sequence
   - `docs/conventions.md` and `.cursorrules` — mandatory coding/UI conventions
   - `rpac-web/package.json` — frontend scripts (dev/build/deploy)
   - `rpac-web/src/lib/locales/sv.json` — all UI text keys
   - `rpac-web/src/components/resource-list-view.tsx` — canonical list rendering component
   - `rpac-web/src/components/side-menu-clean.tsx` — navigation structure and routes
   - `rpac-web/database/` — migration and schema SQLs (supabase)

7. Examples / quick snippets an agent may use
   - Dev server (Windows PowerShell):
     cd rpac-web; npm install; npm run dev
   - Build + deploy (Cloudflare Pages):
     cd rpac-web; npm run pages:build; npm run deploy
   - SQL migration pattern:
     DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='postal_code') THEN ALTER TABLE user_profiles ADD COLUMN postal_code VARCHAR(10); END IF; END $$;

8. What to change vs. what to never change
   - You may refactor internal helpers, add tests, and improve performance.
   - Do NOT change localization to inline text, do NOT switch palette to blue, and do NOT remove required `runtime = 'edge'` exports on edge routes.

9. Where to document your changes
   - Add implementation notes to `docs/dev_notes.md` (append-only log). Update `docs/conventions.md` or `docs/architecture.md` only for architecture-level changes.

10. If you need more context (minimal checklist)
   - Load (in order): `docs/llm_instructions.md`, `docs/conventions.md`, `docs/architecture.md`, `rpac-web/README.md`, `.cursorrules`.

If any of these items are unclear, tell me which section to expand and I will iterate.
