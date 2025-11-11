# Route Mappings Management

## Overview

The Route Mappings Management system provides a visual interface for configuring which help files are displayed for different pages and contexts in the RPAC application. This eliminates the need to edit TypeScript code when adding or modifying help content mappings.

## Purpose

KRISter (the AI help assistant) needs to know which help file to display based on the user's current location in the app. Previously, this mapping was hardcoded in `krister-help-loader.ts`. The Route Mappings Editor provides a user-friendly GUI for managing these mappings.

## Accessing the Editor

1. Open KRISter (click the help icon)
2. Click "Redigera hjälpfil" button
3. Click the "Rutt-mappningar" tab (second tab)

## Interface Components

### 1. Add New Mapping Form
Located at the top of the page, this form allows you to add new route→help file mappings.

**Fields:**
- **Rutt (route)**: URL pattern (e.g., `/dashboard`, `/settings`, `/local`)
- **Parametrar (params)**: Optional URL parameters (e.g., `?tab=home`, `?section=resources`)
- **Hjälpfil (helpFile)**: Path to markdown file without extension (e.g., `dashboard`, `settings/profile`)

**Example:**
- Route: `/settings`
- Params: `?tab=privacy`
- Help File: `settings/privacy`

This tells KRISter: "When user is on `/settings?tab=privacy`, show the help file at `/public/help/settings/privacy.md`"

### 2. Mappings Table
Displays all current route mappings in a sortable table.

**Columns:**
- **Rutt**: The URL pattern
- **Parametrar**: URL parameters (shows "–" if empty)
- **Hjälpfil**: The help file to display
- **Åtgärder**: Action buttons (Edit, Delete)

### 3. Actions

**Add Mapping:**
1. Fill in Route and Help File (Parametrar is optional)
2. Click "Lägg till" button
3. New mapping appears in table

**Edit Mapping:**
1. Click "Redigera" button on desired row
2. Fields become editable inline
3. Modify values as needed
4. Click "Klar" to finish editing

**Delete Mapping:**
1. Click "Ta bort" button on desired row
2. Confirm deletion in popup
3. Mapping is removed from table

**Save Changes:**
1. Click "Spara ändringar" button (top right)
2. All changes are persisted to `config/help-mappings.json`
3. KRISter will use new mappings immediately

## Data Structure

Mappings are stored as JSON objects:

```json
{
  "route": "/settings",
  "params": "?tab=profile",
  "helpFile": "settings/profile"
}
```

## File Storage

Mappings are persisted in:
```
rpac-web/config/help-mappings.json
```

This file is:
- ✅ Version controlled (committed to Git)
- ✅ Survives deployments
- ✅ Can be backed up/restored
- ✅ Human-readable JSON format

## Default Mappings

The system includes 21 default mappings covering:

### Dashboard
- `/dashboard` → `dashboard.md`

### Individual Phase
- `/individual?section=overview` → `individual/overview.md`
- `/individual?section=resources` → `individual/resources.md`
- `/individual?section=contacts` → `individual/contacts.md`
- `/individual?section=plan` → `individual/plan.md`

### Local Community
- `/local?tab=home` → `local/home.md`
- `/local?tab=forum` → `local/forum.md`
- `/local?tab=resources` → `local/resources.md`
- `/local?tab=map` → `local/map.md`
- `/local?tab=find` → `local/find.md`
- `/local?tab=members` → `local/members.md`
- `/local?tab=garden` → `local/garden.md`

### Regional
- `/regional` → `regional/overview.md`

### Settings
- `/settings?tab=profile` → `settings/profile.md`
- `/settings?tab=security` → `settings/security.md`
- `/settings?tab=notifications` → `settings/notifications.md`
- `/settings?tab=privacy` → `settings/privacy.md`
- `/settings?tab=preferences` → `settings/preferences.md`

### Admin & Auth
- `/admin` → `admin/overview.md`
- `/login` → `auth/login.md`
- `/register` → `auth/register.md`

## API Endpoints

### GET /api/help-mappings
Load all route mappings from storage.

**Response:**
```json
{
  "mappings": [
    {
      "route": "/dashboard",
      "params": "",
      "helpFile": "dashboard"
    },
    ...
  ]
}
```

### POST /api/help-mappings
Save route mappings to storage.

**Request:**
```json
{
  "mappings": [
    {
      "route": "/dashboard",
      "params": "",
      "helpFile": "dashboard"
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Saved 21 mappings"
}
```

## Validation Rules

### When Adding/Editing:
1. **Route** is required (cannot be empty)
2. **Help File** is required (cannot be empty)
3. **Params** is optional (can be empty)

### Automatic Validation:
- Empty required fields disable "Lägg till" button
- API validates structure before saving
- Invalid mappings are rejected with error message

## Best Practices

### Route Patterns
- Use exact URL paths: `/dashboard`, `/settings`, `/local`
- Don't include domain: ❌ `https://example.com/dashboard` → ✅ `/dashboard`
- Start with forward slash: ✅ `/dashboard` (not `dashboard`)

### Parameters
- Include question mark: ✅ `?tab=home` (not `tab=home`)
- Multiple parameters: `?tab=home&view=grid`
- Leave empty if no parameters needed

### Help File Paths
- Relative to `/public/help/` directory
- Don't include `.md` extension: ✅ `dashboard` (not `dashboard.md`)
- Use forward slashes for subdirectories: ✅ `settings/profile` (not `settings\\profile`)
- Match actual file structure in `/public/help/`

### Naming Conventions
- Use lowercase for consistency
- Use hyphens for multi-word files: `help-editor`, `route-mappings`
- Organize by feature area: `settings/`, `individual/`, `local/`

## Troubleshooting

### Mapping Not Working
1. **Verify file exists**: Check `/public/help/` for the specified file
2. **Check path**: Ensure help file path matches directory structure
3. **Review parameters**: Confirm URL params match exactly (case-sensitive)
4. **Save changes**: Don't forget to click "Spara ändringar"

### Changes Not Persisting
1. **Check save confirmation**: Look for success message after clicking save
2. **Verify API route**: Check browser console for errors
3. **File permissions**: Ensure `config/` directory is writable
4. **Restart dev server**: Sometimes Next.js cache needs clearing

### Wrong Help File Showing
1. **Check route specificity**: More specific routes (with params) should come before generic ones
2. **Verify URL**: Confirm the actual URL matches the route pattern
3. **Test in isolation**: Try accessing the page directly with full URL

## Integration with KRISter

KRISter uses these mappings through the help loader system:

1. User navigates to a page (e.g., `/settings?tab=profile`)
2. KRISter detects URL change
3. Help loader queries mappings for matching route + params
4. Matching help file is loaded and displayed
5. If no match found, fallback to default help

## Future Enhancements

### Planned Features:
- ✅ Basic CRUD operations (DONE)
- ✅ Persistent storage (DONE)
- 🔄 File existence validation (before saving)
- 🔄 Auto-detection of available help files
- 🔄 Route pattern suggestions
- 🔄 Regex pattern testing tool
- 🔄 Visual route hierarchy/tree view
- 🔄 Export/import for backup
- 🔄 Bulk migration from TypeScript code

## Technical Details

### Architecture
- **Frontend**: React component in `help-file-editor.tsx`
- **Backend**: Next.js API route at `/api/help-mappings`
- **Storage**: JSON file at `config/help-mappings.json`
- **Runtime**: Node.js (API route uses `nodejs` runtime, not `edge`)

### State Management
```typescript
const [activeTab, setActiveTab] = useState<'editor' | 'mappings'>('editor');
const [routeMappings, setRouteMappings] = useState<RouteMapping[]>([]);
const [editingMapping, setEditingMapping] = useState<number | null>(null);
const [newMapping, setNewMapping] = useState({ route: '', params: '', helpFile: '' });
```

### Key Functions
- `loadRouteMappings()`: Fetch from API, fallback to defaults
- `saveRouteMappings()`: POST to API with validation
- `addMapping()`: Add new mapping to state
- `deleteMapping(index)`: Remove mapping from state
- `updateMapping(index, updates)`: Modify existing mapping

## Support

For issues or questions:
1. Check this documentation
2. Review `docs/help_conventions.md` for help file standards
3. Consult `docs/dev_notes.md` for implementation details
4. Check `krister-help-loader.ts` for integration code

---

**Last Updated**: 2025-11-11  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
