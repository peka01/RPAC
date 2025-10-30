# KRISter Help Files Quick Reference

**Last Updated**: 2025-10-30  
**Total Files**: 17  
**Coverage**: ~85% of user-facing pages

## Files Created

### ✅ Dashboard & Individual (5 files)
- `dashboard.md` - Main overview, getting started, navigation
- `individual/resources.md` - Resource inventory, MSB categories, sharing
- `individual/cultivation.md` - Cultivation planning, AI coach integration
- `individual/knowledge.md` - Knowledge library, articles, learning paths
- `individual/coach.md` - AI coach interaction, personalized advice

### ✅ Local Community (9 files)
- `local/home.md` - Community hub, overview, navigation
- `local/discover.md` - Find communities, join, access types
- `local/activity.md` - Activity feed, real-time updates
- `local/resources-shared.md` - Shared resources, borrowing, lending
- `local/resources-owned.md` - Community-owned resources
- `local/resources-help.md` - Help requests, priorities, responding
- `local/messages-community.md` - Community chat, etiquette
- `local/messages-direct.md` - Direct messaging, privacy
- `local/admin.md` - Admin panel, members, moderation

### ✅ Regional (1 file)
- `regional/overview.md` - Regional coordination (Phase 3 preview)

### ✅ Settings (2 files)
- `settings/profile.md` - Profile settings, privacy controls
- `settings/account.md` - Account, subscription, deletion

### ✅ Auth (1 file)
- `auth/login.md` - Login, registration, password reset

## Files Still Needed (Optional)

### High Priority
- `settings/privacy.md` - GDPR, data handling, privacy controls
- `settings/notifications.md` - Notification preferences

### Medium Priority
- `local/members.md` - Member list, profiles, roles
- `individual/resources-categories.md` - Detailed MSB category guide

### Low Priority
- `admin/super-admin.md` - Super admin features (few users)
- `auth/register.md` - Registration details (covered in login.md)
- `local/homespace.md` - Public homespace customization

## Route → File Mapping

| Route | Query Params | File |
|-------|--------------|------|
| `/` or `/dashboard` | - | `dashboard.md` |
| `/individual` | `section=resources` | `individual/resources.md` |
| `/individual` | `section=cultivation` | `individual/cultivation.md` |
| `/individual` | `section=knowledge` | `individual/knowledge.md` |
| `/individual` | `section=coach` | `individual/coach.md` |
| `/local` | `tab=home` | `local/home.md` |
| `/local/discover` | - | `local/discover.md` |
| `/local` or `/local/activity` | `tab=activity` | `local/activity.md` |
| `/local` | `tab=resources&resourceTab=shared` | `local/resources-shared.md` |
| `/local` | `tab=resources&resourceTab=owned` | `local/resources-owned.md` |
| `/local` | `tab=resources&resourceTab=help` | `local/resources-help.md` |
| `/local` or `/local/messages/community` | `tab=messages` | `local/messages-community.md` |
| `/local/messages/direct` | - | `local/messages-direct.md` |
| `/local` | `tab=admin` | `local/admin.md` |
| `/regional` | - | `regional/overview.md` |
| `/settings` | `tab=profile` | `settings/profile.md` |
| `/settings` | `tab=account` | `settings/account.md` |
| `/auth/login` | - | `auth/login.md` |

## File Structure Template

Every help file follows this structure:

```markdown
# {{variable.title}}

## Kontext
{{variable.description}}
[Detailed context in Swedish]

## Steg-för-steg
### 1. Step title
- Bullet points
- Sub-steps

### 2. Next step
...

## Tips
{{variable.tip.0}}
**💡 Tip title**
Explanation

## Vanliga frågor
**Q: Question?**
A: Answer with details

**Q: Another question?**
A: Another answer

## Relaterade sidor
- [Page Title](/help/path.md) - Description
- [Another Page](/help/other.md) - Description
```

## Variable Usage

### Common Variables
- `{{krister.context_help.PAGE.title}}` - Page title
- `{{krister.context_help.PAGE.description}}` - Brief description
- `{{krister.context_help.PAGE.tips.N}}` - Tip number N
- `{{navigation.PAGE}}` - Navigation label
- `{{individual.PAGE.title}}` - Individual section title
- `{{local.PAGE.title}}` - Local section title

### Example
```markdown
# {{krister.context_help.dashboard.title}}

Navigate via {{navigation.individual}} or {{navigation.local}}.

{{krister.context_help.dashboard.tips.0}}
```

## Adding New Help Files

### 1. Create the file
Location: `rpac-web/docs/help/SECTION/PAGE.md`

### 2. Follow template
Use the structure above

### 3. Add route mapping
Update `krister-help-loader.ts` → `getHelpFileForRoute()` method

```typescript
if (pathname === '/your/route') {
  if (tab === 'your-tab') {
    return 'section/your-file';
  }
}
```

### 4. Add to VALID_HELP_FILES
Update `rpac-web/src/app/api/help/[...path]/route.ts`

```typescript
const VALID_HELP_FILES = [
  // ... existing files
  'section/your-file',
];
```

### 5. Test
Navigate to route and check KRISter displays help correctly

## Maintenance Rules

### MANDATORY Updates

When you change code, update help docs if:
- ✅ New UI element added (button, field, tab)
- ✅ Feature renamed or moved
- ✅ New query parameter added
- ✅ Steps in a process changed
- ✅ Validation rules changed

### Pre-Commit Checklist
1. Did I change any user-facing feature?
2. Which help file(s) are affected?
3. Did I update those files?
4. Did I test the changes in KRISter?
5. Are all {{variables}} still valid?

### Variable Guidelines

**✅ CORRECT**:
```markdown
Click {{navigation.settings}} to open settings.
```

**❌ WRONG**:
```markdown
Click "Inställningar" to open settings.
```

**Reason**: Hardcoded text doesn't update when sv.json changes!

## Testing

### Manual Test
1. Navigate to page (e.g., `/local?tab=activity`)
2. Open KRISter (click robot icon)
3. Verify context help shows correct content
4. Check that {{variables}} are replaced
5. Verify tips, steps, and related pages display

### Regression Test
After updating sv.json variables:
1. Clear browser cache
2. Reload app
3. Open KRISter on multiple pages
4. Verify all {{variables}} resolved correctly

## Troubleshooting

### KRISter shows old help
**Problem**: Cache not cleared  
**Solution**: `KRISterHelpLoader.clearCache()`

### Variable shows as {{variable.name}}
**Problem**: Variable not in sv.json  
**Solution**: Add to `rpac-web/src/lib/locales/sv.json`

### Help file not loading
**Problem**: Route not mapped  
**Solution**: Add to `getHelpFileForRoute()` in loader

### Wrong help shown
**Problem**: Route mapping incorrect  
**Solution**: Check query parameter order in mapping logic

## Resources

- **Main Guide**: `rpac-web/docs/HELP_DOCS_GUIDE.md`
- **Implementation**: `docs/KRISTER_HELP_SYSTEM_IMPLEMENTATION.md`
- **Conventions**: `docs/conventions.md` (Help Documentation section)
- **Loader**: `rpac-web/src/lib/krister-help-loader.ts`
- **Component**: `rpac-web/src/components/krister-assistant.tsx`

## Quick Stats

- **Total Lines**: ~3500+ (all help files)
- **Average File Size**: ~200 lines
- **Sections per File**: 5 (Kontext, Steg, Tips, FAQ, Relaterat)
- **Variables Used**: ~100+ unique variables
- **Coverage**: 17/20 major pages (85%)
