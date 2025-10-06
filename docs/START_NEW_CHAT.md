# 🎯 How to Start a New Chat with Perfect Context

**For YOU (the user):** Copy this prompt to start any new chat session with complete context.

---

## 📋 Complete Onboarding Prompt

```
I'm working on Beready, a Swedish crisis preparedness app.

Please read these files to get complete context (in this order):

1. docs/NEW_CHAT_ONBOARDING.md - Complete onboarding guide (READ THIS FIRST!)
2. docs/charter.md - Project vision and mission
3. docs/architecture.md - Technical architecture
4. docs/roadmap.md - Current priorities
5. docs/conventions.md - Development rules and UX principles
6. docs/llm_instructions.md - Current development status

After reading, confirm you understand:
- ✅ Olive green colors (NOT blue!)
- ✅ All text must use t() function from sv.json
- ✅ Mobile-first with separate components
- ✅ Use ResourceListView for all lists
- ✅ Development server runs from rpac-web/ directory
- ✅ Document features in dev_notes.md (NOT separate files)

Ready to work on Beready!
```

---

## 🚀 Quick Start (Minimal Context)

If you just need quick help and don't need full project context:

```
I'm working on Beready, a Swedish crisis preparedness app (Next.js + Supabase + TypeScript).

Key rules:
- Olive green colors (#3D4A2B), NOT blue
- All Swedish text via t() function from rpac-web/src/lib/locales/sv.json
- Mobile-first design (separate -mobile.tsx components)
- Use ResourceListView for all lists (rpac-web/src/components/resource-list-view.tsx)
- Dev server: cd rpac-web && npm run dev

[Your specific question or task]
```

---

## 📚 Core Documentation Structure

After cleanup, we have **11 essential files**:

### Always Relevant
1. **NEW_CHAT_ONBOARDING.md** - Start here for new chats
2. **charter.md** - Vision, mission, goals
3. **architecture.md** - Technical decisions
4. **roadmap.md** - Priorities and sprint focus
5. **conventions.md** - Rules, patterns, standards
6. **llm_instructions.md** - Current status, components
7. **dev_notes.md** - Development history (append-only)

### Reference/Domain-Specific
8. **README.md** - Project overview
9. **msb_integration.md** - Official MSB integration specs
10. **msb_trackable_resources.md** - Resource specifications
11. **PRODUCTION_DEPLOYMENT.md** - Deployment guide

### Additional Files (in rpac-web/docs/)
- **om_krisen_kommer.pdf** - Official Swedish crisis guide

---

## ✅ Verification Checklist

After onboarding, you (or the AI) should be able to answer:

- [ ] What colors does RPAC use? → **Olive green (#3D4A2B), NOT blue**
- [ ] Where does Swedish text go? → **sv.json via t() function**
- [ ] What's the UX philosophy? → **Military visual + everyday Swedish text**
- [ ] What component for lists? → **ResourceListView**
- [ ] Mobile pattern? → **Separate -mobile.tsx components at 768px breakpoint**
- [ ] Where to run dev server? → **rpac-web/ subdirectory**
- [ ] Where to document features? → **dev_notes.md (NOT separate files)**
- [ ] Current phase? → **Phase 2 (Local Community) IN PROGRESS**

---

## 🔄 What Changed (October 6, 2025)

**Before:** 68 documentation files (massive redundancy)
**After:** 11 core files (single source of truth)

**Deleted:**
- 16 `*_COMPLETE_*.md` files
- 10 `SESSION_*.md` files  
- 6 `FIX_*.md` files
- 9 `MOBILE_UX_*.md` files
- 14 `RESOURCE_MANAGEMENT_*.md` files
- And 2 more redundant files

**Consolidated Into:**
- `conventions.md` - Now includes mobile standards and tabbed list patterns
- `NEW_CHAT_ONBOARDING.md` - Complete onboarding guide
- `.cursorrules` - Now points to single source of truth

**Preserved:**
- All core strategic docs (charter, architecture, roadmap)
- Development history (dev_notes.md)
- Domain-specific references (MSB integration)

---

## 💡 Pro Tips

### For Long Coding Sessions
Start with full onboarding prompt (above). The AI will have complete context for the entire session.

### For Quick Questions
Use minimal context prompt. Faster for one-off questions that don't need full project knowledge.

### For Feature Work
Always reference `docs/roadmap.md` to check current priorities before starting new work.

### For UX/Design Decisions
Check `docs/conventions.md` first - it has all the established patterns and rules.

### For Database Work
Always check `rpac-web/database/supabase-schema-complete.sql` for table/column names before writing migrations.

---

## 🎓 Teaching New Team MembersBeready

Share these files in this order:
1. NEW_CHAT_ONBOARDING.md (start here)
2. charter.md (understand the mission)
3. conventions.md (learn the rules)
4. llm_instructions.md (see current status)
5. Start coding!

---

**Last Updated:** October 6, 2025  
**Next Review:** When adding major new features or changing architecture

**Remember:** One source of truth = easier onboarding, less confusion, better development!

