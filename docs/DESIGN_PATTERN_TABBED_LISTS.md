# 📐 Design Pattern: Tabbed Lists with Search/Filter
**Date:** October 4, 2025  
**Pattern:** Centralized search/filter bar for tabbed list views  
**Status:** ✅ Standard Pattern

---

## 🎯 Problem

When displaying multiple related lists in tabs (e.g., Shared Resources, Owned Resources, Help Requests), we need a consistent layout that:
1. Makes tab navigation clear and accessible
2. Provides search/filter functionality
3. Avoids duplicate UI elements
4. Maintains visual hierarchy

---

## ✅ Solution: Centralized Search Pattern

### Layout Order (Top to Bottom)

```
1. Hero/Stats Section
   └─ Overall metrics, community info

2. Tab Navigation
   └─ Buttons to switch between views

3. Search/Filter/View Toggle Bar (SINGLE, SHARED)
   └─ ONE bar for ALL tabs
   └─ Show/hide elements based on active tab

4. Content Area
   └─ Tab-specific content
   └─ ResourceListView WITHOUT its own search bar
```

---

## 📝 Implementation Example

### Complete Component Structure

```tsx
export function CommunityResourceHub() {
  const [activeTab, setActiveTab] = useState<'shared' | 'owned' | 'help'>('shared');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [categoryFilter, setCategoryFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8">
        <h1>📦 Samhällets resurser</h1>
        {/* Stats cards */}
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('shared')}
          className={activeTab === 'shared' ? 'active' : 'inactive'}
        >
          Delade från medlemmar
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={activeTab === 'owned' ? 'active' : 'inactive'}
        >
          Samhällets resurser
        </button>
        <button
          onClick={() => setActiveTab('help')}
          className={activeTab === 'help' ? 'active' : 'inactive'}
        >
          Hjälpförfrågningar
        </button>
      </div>

      {/* 3. SEARCH/FILTER BAR - SINGLE FOR ALL TABS */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search - ALWAYS VISIBLE */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök efter resurser..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>

          {/* View Toggle - CONDITIONAL (only for tabs that need it) */}
          {(activeTab === 'shared' || activeTab === 'owned') && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'active' : 'inactive'}
              >
                <Grid3x3 size={18} />
                <span>Kort</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'active' : 'inactive'}
              >
                <List size={18} />
                <span>Tabell</span>
              </button>
            </div>
          )}

          {/* Filter Button */}
          <button onClick={() => setShowFilters(!showFilters)}>
            <Filter size={20} />
            <span>Filter</span>
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            {/* Category buttons */}
          </div>
        )}
      </div>

      {/* 4. CONTENT AREA - Tab-specific content */}
      <div>
        {activeTab === 'shared' && (
          <ResourceListView
            items={filteredSharedResources}
            // NO search bar - parent handles it
            searchable={false}
            filterable={false}
            showViewToggle={false}
            // Pass the viewMode from parent
            defaultViewMode={viewMode}
            {...otherProps}
          />
        )}

        {activeTab === 'owned' && (
          <ResourceListView
            items={filteredOwnedResources}
            searchable={false}
            filterable={false}
            showViewToggle={false}
            defaultViewMode={viewMode}
            {...otherProps}
          />
        )}

        {activeTab === 'help' && (
          <HelpRequestsList
            items={filteredHelpRequests}
            searchQuery={searchQuery}
            {...otherProps}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 🎨 Visual Hierarchy

```
┌─────────────────────────────────────────────┐
│  📊 HERO SECTION                            │
│  Stats • Metrics • Community Info           │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│  [Tab 1] [Tab 2] [Tab 3]                    │  ← TAB NAVIGATION
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│  🔍 Search  [🔲 Cards] [☰ Table]  🎚 Filter │  ← SHARED CONTROLS
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│  📋 CONTENT                                 │
│  • Item 1                                   │
│  • Item 2                                   │
│  • Item 3                                   │
└─────────────────────────────────────────────┘
```

---

## ✅ Benefits

### User Experience
- ✅ **Clear hierarchy** - Tabs first, then search, then content
- ✅ **Consistent position** - Search always in same place
- ✅ **No duplication** - One search bar, not three
- ✅ **Context-aware** - View toggle only when relevant

### Developer Experience
- ✅ **Single source** - One search state for all tabs
- ✅ **Less code** - No duplicate search UI
- ✅ **Easy to maintain** - Change once, affects all tabs
- ✅ **Clear separation** - Parent handles UI, child handles display

---

## ❌ Anti-Patterns (What NOT to Do)

### 1. Search Inside Each Tab ❌
```tsx
// BAD - Duplicate search bars
{activeTab === 'shared' && (
  <ResourceListView
    searchable={true}  // ❌ Has own search
    items={shared}
  />
)}
{activeTab === 'owned' && (
  <ResourceListView
    searchable={true}  // ❌ Another search!
    items={owned}
  />
)}
```

**Problems:**
- User loses search query when switching tabs
- Visually jarring (search bar appears/disappears)
- Duplicate UI code
- Inconsistent position

### 2. Search Above Tabs ❌
```tsx
// BAD - Search before navigation
<SearchBar />
<TabNavigation />
<Content />
```

**Problems:**
- Violates visual hierarchy
- User must scroll past search to change tabs
- Less obvious what's being searched
- Poor mobile UX

### 3. Multiple View Toggles ❌
```tsx
// BAD - Toggle in multiple places
<TabNavigation />
<ViewToggle />  // ❌ Here
<Content>
  <ViewToggle />  // ❌ And here
</Content>
```

**Problems:**
- Duplicate controls
- Confusing for users
- State management nightmare
- Visual clutter

---

## 🔧 Implementation Checklist

When implementing tabbed lists:

- [ ] Hero section at top (optional)
- [ ] Tab navigation buttons next
- [ ] Single shared search/filter bar after tabs
- [ ] Content area last
- [ ] ResourceListView with `searchable={false}`
- [ ] ResourceListView with `filterable={false}`
- [ ] ResourceListView with `showViewToggle={false}`
- [ ] Parent component manages search state
- [ ] Parent component filters data before passing to child
- [ ] View toggle only visible for relevant tabs
- [ ] Filter options appropriate for all tabs

---

## 📱 Mobile Considerations

### Responsive Behavior
```scss
// Desktop & Mobile - ALWAYS SINGLE ROW
[Search Input     ] [Cards|Table] [Filter]

// Components:
// - Search: flex-1 (takes remaining space)
// - View Toggle: flex-shrink-0 (icon-only on mobile)
// - Filter: flex-shrink-0 (text hidden on mobile)
```

**Key CSS:**
```tsx
<div className="flex items-center gap-2">
  {/* Search - flexible */}
  <div className="flex-1 relative min-w-0">
    <input placeholder="Sök..." />
  </div>
  
  {/* View Toggle - icon-only, no shrink */}
  <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
    <button><Grid3x3 size={18} /></button>
    <button><List size={18} /></button>
  </div>
  
  {/* Filter - hide text on mobile */}
  <button className="flex-shrink-0">
    <Filter size={20} />
    <span className="hidden sm:inline">Filter</span>
  </button>
</div>
```

### Touch Optimization
- ✅ 44px+ touch targets
- ✅ Search bar full width on mobile
- ✅ Buttons stack responsively
- ✅ Filter opens as bottom sheet (optional)

---

## 🎯 Real-World Examples

### Example 1: Community Resources Hub ✅
**Location:** `rpac-web/src/components/community-resource-hub.tsx`

```
Hero → Tabs → Search/Filter Bar → Content
       (Shared | Owned | Help)
```

**Features:**
- Search applies to all tabs
- View toggle only for Shared and Owned
- Category filter affects all tabs
- Single state management

### Example 2: Individual Dashboard (Future)
```
Hero → Tabs → Search/Filter Bar → Content
       (Resources | Tasks | Progress)
```

### Example 3: Message Center (Future)
```
Hero → Tabs → Search/Filter Bar → Content
       (Inbox | Sent | Archived)
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] **URL sync** - Tab state in URL params
- [ ] **Search persistence** - Remember search per tab
- [ ] **Advanced filters** - Date ranges, status, etc.
- [ ] **Saved searches** - Quick access to common filters
- [ ] **Keyboard shortcuts** - Navigate tabs with keys

### Under Consideration
- [ ] **Drag & drop tabs** - Reorder tabs
- [ ] **Tab badges** - Show counts on tabs
- [ ] **Tab overflow** - Handle many tabs gracefully
- [ ] **Contextual actions** - Tab-specific buttons in search bar

---

## 📚 Related Documentation

- **ResourceListView API:** `docs/COMPONENT_RESOURCE_LIST_VIEW.md`
- **Migration Guide:** `docs/MIGRATION_EXAMPLE_RESOURCE_LIST_VIEW.md`
- **Standard Components:** `docs/STANDARD_COMPONENTS.md`
- **Mobile UX Standards:** `docs/MOBILE_UX_STANDARDS.md`

---

## ✨ Key Takeaways

1. **Tabs first** - Navigation before controls
2. **One search bar** - Shared across all tabs
3. **Context-aware** - Show/hide controls as needed
4. **Parent manages state** - Child components focus on display
5. **Consistent position** - Controls always in same place
6. **Mobile optimized** - Responsive and touch-friendly

---

**Status:** ✅ STANDARD PATTERN - Use for all tabbed list interfaces  
**Last Updated:** October 4, 2025  
**Next Review:** When adding new tabbed interfaces

