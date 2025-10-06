# 📚 RPAC Documentation Structure

**Last Updated:** October 6, 2025  
**Status:** ✅ Optimized - Single Source of Truth

---

## 🎯 Philosophy

**One source of truth > Many scattered docs**

We maintain a **lean, focused documentation structure** that avoids redundancy and makes onboarding easy.

---

## 📁 Core Documentation (11 Files)

### 🚀 Onboarding & Quick Start
- **`NEW_CHAT_ONBOARDING.md`** - Complete onboarding guide for starting new AI chat sessions
- **`START_NEW_CHAT.md`** - Copy-paste prompts for quick context loading
- **`README.md`** - Project overview and introduction

### 📖 Strategic Foundation
- **`charter.md`** - Project vision, mission, and strategic goals
- **`architecture.md`** - Technical architecture and design decisions
- **`roadmap.md`** - Development plan, sprint priorities, and current focus

### 🛠️ Development Standards
- **`conventions.md`** - Development rules, UX principles, color palette, mobile standards, component patterns
- **`llm_instructions.md`** - AI context guide, current development status, component standards
- **`dev_notes.md`** - Complete development history (append-only log)

### 🔐 Domain-Specific
- **`msb_integration.md`** - Official MSB (Swedish Civil Contingencies Agency) integration specifications
- **`msb_trackable_resources.md`** - MSB-recommended resource specifications

### 🚀 Deployment
- **`PRODUCTION_DEPLOYMENT.md`** - Production deployment guide and checklist

### 📄 Additional Files
- **`om_krisen_kommer.pdf`** - Official Swedish crisis preparedness guide (reference material)

---

## 🎓 Reading Order for New Chats

### Full Context (Recommended)
Read these files in order for complete project understanding:

1. `NEW_CHAT_ONBOARDING.md` - Start here!
2. `charter.md` - Understand the mission
3. `architecture.md` - Learn the tech stack
4. `roadmap.md` - See current priorities
5. `conventions.md` - Master the rules
6. `llm_instructions.md` - Get current status

**Time:** ~15-20 minutes  
**Result:** Complete context for entire development session

### Quick Context (For Specific Tasks)
Minimal reading for focused work:

1. `NEW_CHAT_ONBOARDING.md` (Quick Summary section only)
2. `conventions.md` (Relevant section for your task)

**Time:** ~5 minutes  
**Result:** Enough context for specific feature work

---

## 📋 What Goes Where

### Strategic Changes → Update These
- **Vision/mission changes:** `charter.md`
- **Architecture decisions:** `architecture.md`
- **Priority shifts:** `roadmap.md`

### Development Standards → Update These
- **New UX patterns:** `conventions.md`
- **New component standards:** `conventions.md` + `llm_instructions.md`
- **Development rules:** `conventions.md`

### Feature History → Update This
- **New features completed:** `dev_notes.md`
- **Bug fixes applied:** `dev_notes.md`
- **Refactoring summaries:** `dev_notes.md`

### ❌ DO NOT Create These
- `FEATURE_COMPLETE_*.md` files
- `SESSION_*.md` files
- `FIX_*.md` or `BUGFIX_*.md` files
- `*_SUMMARY_*.md` files
- Separate mobile/UX pattern files
- Temporary documentation files

**Why?** They create redundancy and confusion. Use `dev_notes.md` for history.

---

## 🔄 What Changed (October 6, 2025)

### Before
- **68 markdown files** in docs/
- Massive redundancy and confusion
- Information scattered across many files
- Hard to onboard new chats/team members
- Mobile patterns in separate 900-line file
- Component docs spread across multiple files

### After  
- **11 core markdown files** (plus 1 PDF)
- Single source of truth
- Clear documentation hierarchy
- Easy onboarding with structured guides
- Mobile patterns consolidated into `conventions.md`
- Component standards in `conventions.md` + `llm_instructions.md`

### Deleted (57 Files)
- 16 `*_COMPLETE_*.md` (feature complete docs)
- 10 `SESSION_*.md` (temporary session notes)
- 6 `FIX_*.md` / `BUGFIX_*.md` (applied fixes)
- 9 `MOBILE_UX_*.md` (mobile patterns)
- 14 `RESOURCE_MANAGEMENT_*.md` (resource docs)
- 2 setup guides (admin, development)

### Consolidated
- Mobile UX standards → `conventions.md`
- Tabbed list patterns → `conventions.md`
- Component standards → `conventions.md` + `llm_instructions.md`
- All feature history → `dev_notes.md` (already there)

---

## ✅ Verification

A well-structured documentation system has:

- [ ] Single source of truth for each topic
- [ ] Clear reading order for onboarding
- [ ] No duplicate information
- [ ] Easy to find what you need
- [ ] History preserved in chronological log
- [ ] Standards consolidated in conventions
- [ ] Strategic docs stay focused

**RPAC Status:** ✅ ALL CHECKED

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ Creating Feature Complete Docs
```
# BAD
docs/MESSAGING_SYSTEM_COMPLETE.md
docs/PROFILE_ENHANCEMENT_COMPLETE.md
docs/CULTIVATION_CALENDAR_COMPLETE.md
```

**Instead:** Add summary to `dev_notes.md` with date. Feature is documented in code and git history.

### ❌ Creating Session Summaries
```
# BAD  
docs/SESSION_2025-10-04_FEATURE_X.md
docs/SESSION_COMPLETE_2025-10-04_FEATURE_Y.md
```

**Instead:** Use `dev_notes.md` for any notes worth keeping. Sessions are temporary.

### ❌ Creating Separate Pattern Docs
```
# BAD
docs/MOBILE_UX_STANDARDS.md (900 lines)
docs/DESIGN_PATTERN_TABBED_LISTS.md
docs/STANDARD_COMPONENTS.md
```

**Instead:** Consolidate into `conventions.md`. Keep patterns together.

### ❌ Creating Fix Documentation
```
# BAD
docs/FIX_MESSAGES_SEPARATION.md
docs/BUGFIX_PROFILE_FOCUS.md  
docs/DATABASE_QUERY_FIX.md
```

**Instead:** Document in `dev_notes.md` if significant. Most fixes don't need docs.

---

## 📝 Documentation Maintenance

### Monthly Review
- [ ] Check for new redundant files
- [ ] Update `conventions.md` with new patterns
- [ ] Verify `roadmap.md` reflects current priorities
- [ ] Ensure `dev_notes.md` has recent feature summaries

### When Adding Features
- [ ] Update `dev_notes.md` with feature summary
- [ ] Update `conventions.md` if new pattern emerges
- [ ] Update `roadmap.md` if priorities shift
- [ ] Do NOT create `FEATURE_COMPLETE_*.md` file

### When Changing Architecture
- [ ] Update `architecture.md` with decision and rationale
- [ ] Update `conventions.md` if patterns change
- [ ] Add summary to `dev_notes.md`

---

## 🎯 Success Metrics

Good documentation structure enables:

✅ **Fast onboarding** - New chats get context in 15 minutes  
✅ **Clear standards** - One place to check rules  
✅ **Easy maintenance** - Update once, affects all  
✅ **No confusion** - Single source of truth  
✅ **Preserved history** - Chronological log in dev_notes.md  

**RPAC achieves all of these!** 🎉

---

## 💡 For New Team Members

Start here:
1. Read `NEW_CHAT_ONBOARDING.md`
2. Read `charter.md` to understand the mission
3. Read `conventions.md` to learn the rules
4. Browse `dev_notes.md` to see what's been built
5. Start coding!

---

## 📞 Questions?

- **"Where do I document X?"** → Check this file's "What Goes Where" section
- **"Should I create a new doc?"** → Probably not. Update existing core docs.
- **"Where's the mobile patterns?"** → `conventions.md` (Mobile UX Standards section)
- **"Where's the component standards?"** → `conventions.md` + `llm_instructions.md`
- **"Can I create a SESSION_*.md file?"** → No. Use `dev_notes.md` instead.

---

**Remember:** Lean documentation = Clear thinking = Better development

**Last Cleanup:** October 6, 2025 (68 → 11 files)  
**Next Review:** When major features are added or architecture changes

