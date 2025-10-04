# 🔧 ResourceListView Component - Reusable List/Table/Card View

**Created:** October 4, 2025  
**Purpose:** Generic, reusable component for displaying lists with table/card toggle, search, and filters  
**Location:** `rpac-web/src/components/resource-list-view.tsx`

---

## 📋 Overview

A highly flexible component that provides a unified interface for displaying lists of items with:
- ✅ **Card View** - Visual, spacious display
- ✅ **Table View** - Dense, scannable table
- ✅ **Search** - Built-in search functionality
- ✅ **Filters** - Category-based filtering
- ✅ **View Toggle** - Switch between card/table
- ✅ **Grouping** - Support for grouped items
- ✅ **Mobile Responsive** - Adapted layouts
- ✅ **Empty States** - Customizable placeholders
- ✅ **Loading States** - Built-in loading UI

---

## 🎯 Use Cases

### Where to Use This Component
- ✅ Shared resources list
- ✅ Community-owned resources
- ✅ Help requests
- ✅ User profiles list
- ✅ Cultivation tasks
- ✅ MSB recommendations
- ✅ Community members
- ✅ Messages/notifications
- ✅ Any list of items that can be displayed as cards or table

### Benefits
- **Consistency** - Same UX across the app
- **Maintainability** - Single source of truth
- **Flexibility** - Highly configurable
- **Performance** - Optimized rendering
- **Accessibility** - Built-in best practices

---

## 🔧 API Reference

### Props

```typescript
interface ResourceListViewProps<T> {
  // === REQUIRED ===
  items: T[];                    // Array of items to display
  columns: Column<T>[];          // Table column configuration
  cardRenderer: (item: T, index: number) => ReactNode;  // How to render cards
  
  // === OPTIONAL - Display ===
  groupedItems?: T[][];          // For grouped display
  groupedCardRenderer?: (items: T[], index: number) => ReactNode;
  defaultViewMode?: 'cards' | 'table';  // Default: 'cards'
  showViewToggle?: boolean;      // Default: true
  
  // === OPTIONAL - Search ===
  searchable?: boolean;          // Default: true
  searchPlaceholder?: string;    // Default: 'Sök...'
  onSearch?: (query: string) => void;  // Custom search handler
  searchQuery?: string;          // Controlled search value
  
  // === OPTIONAL - Filters ===
  filterable?: boolean;          // Default: true
  categories?: CategoryFilter[]; // Filter options
  activeCategory?: string;       // Default: 'all'
  onCategoryChange?: (categoryId: string) => void;
  
  // === OPTIONAL - States ===
  emptyState?: ReactNode;        // Custom empty message
  loading?: boolean;             // Show loading spinner
  loadingMessage?: string;       // Loading text
  
  // === OPTIONAL - Table ===
  expandableRows?: boolean;      // Allow row expansion
  rowKey?: (item: T) => string;  // Unique key for rows
  
  // === OPTIONAL - Mobile ===
  mobileListRenderer?: (item: T, index: number) => ReactNode;
  
  // === OPTIONAL - Extras ===
  headerActions?: ReactNode;     // Additional header buttons
  className?: string;            // Container class
  tableClassName?: string;       // Table-specific class
  cardGridClassName?: string;    // Grid layout class
}
```

### Column Definition

```typescript
interface Column<T> {
  key: string;                   // Unique column identifier
  label: string;                 // Column header text
  width?: string;                // e.g., '200px', '30%', 'auto'
  align?: 'left' | 'center' | 'right';  // Text alignment
  sortable?: boolean;            // (Future) Enable sorting
  render: (item: T, index: number) => ReactNode;  // Cell renderer
  renderMobile?: (item: T, index: number) => ReactNode;  // Mobile variant
}
```

### Category Filter

```typescript
interface CategoryFilter {
  id: string;        // Unique ID
  label: string;     // Display text
  emoji?: string;    // Optional emoji
  icon?: ReactNode;  // Optional icon component
}
```

---

## 📚 Usage Examples

### Example 1: Simple List with Search

```typescript
import { ResourceListView } from '@/components/resource-list-view';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserList({ users }: { users: User[] }) {
  return (
    <ResourceListView
      items={users}
      columns={[
        {
          key: 'name',
          label: 'Namn',
          render: (user) => <span className="font-semibold">{user.name}</span>
        },
        {
          key: 'email',
          label: 'E-post',
          render: (user) => <span className="text-gray-600">{user.email}</span>
        }
      ]}
      cardRenderer={(user) => (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      )}
      searchPlaceholder="Sök användare..."
    />
  );
}
```

### Example 2: With Categories and Filters

```typescript
const categories = [
  { id: 'active', label: 'Aktiva', emoji: '✅' },
  { id: 'pending', label: 'Väntande', emoji: '⏳' },
  { id: 'completed', label: 'Slutförda', emoji: '🎉' }
];

function TaskList({ tasks }: { tasks: Task[] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (activeCategory !== 'all' && task.status !== activeCategory) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <ResourceListView
      items={filteredTasks}
      columns={[
        {
          key: 'title',
          label: 'Uppgift',
          render: (task) => <strong>{task.title}</strong>
        },
        {
          key: 'status',
          label: 'Status',
          render: (task) => <StatusBadge status={task.status} />
        },
        {
          key: 'actions',
          label: 'Åtgärder',
          align: 'right',
          render: (task) => (
            <button className="px-3 py-1 bg-blue-500 text-white rounded">
              Visa
            </button>
          )
        }
      ]}
      cardRenderer={(task) => <TaskCard task={task} />}
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder="Sök uppgifter..."
    />
  );
}
```

### Example 3: Grouped Items (Like Shared Resources)

```typescript
function SharedResourcesList({ resources }: { resources: SharedResource[] }) {
  // Group resources by name
  const grouped = groupResourcesByName(resources);

  return (
    <ResourceListView
      items={resources}
      groupedItems={grouped}
      columns={[
        {
          key: 'resource',
          label: 'Resurs',
          render: (resource) => (
            <div className="flex items-center gap-2">
              <span>{getCategoryEmoji(resource.category)}</span>
              <span className="font-semibold">{resource.name}</span>
            </div>
          )
        },
        {
          key: 'quantity',
          label: 'Antal',
          render: (resource) => `${resource.quantity} ${resource.unit}`
        },
        {
          key: 'sharedBy',
          label: 'Delat av',
          render: (resource) => resource.sharer_name
        }
      ]}
      cardRenderer={(resource) => <ResourceCard resource={resource} />}
      groupedCardRenderer={(group) => <GroupedResourceCard resources={group} />}
      searchPlaceholder="Sök resurser..."
    />
  );
}
```

### Example 4: Custom Empty and Loading States

```typescript
<ResourceListView
  items={data}
  columns={columns}
  cardRenderer={cardRenderer}
  loading={isLoading}
  loadingMessage="Hämtar data från servern..."
  emptyState={
    <div className="text-center py-12">
      <PackageIcon size={64} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Inga resurser ännu
      </h3>
      <p className="text-gray-600 mb-6">
        Lägg till din första resurs för att komma igång
      </p>
      <button className="px-6 py-3 bg-blue-500 text-white rounded-lg">
        Lägg till resurs
      </button>
    </div>
  }
/>
```

### Example 5: With Header Actions

```typescript
<ResourceListView
  items={items}
  columns={columns}
  cardRenderer={cardRenderer}
  headerActions={
    <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center gap-2 px-6 py-3 bg-[#556B2F] text-white rounded-lg font-medium"
    >
      <Plus size={20} />
      <span>Lägg till</span>
    </button>
  }
/>
```

### Example 6: Custom Mobile Renderer

```typescript
<ResourceListView
  items={items}
  columns={columns}
  cardRenderer={cardRenderer}
  mobileListRenderer={(item) => (
    <div className="p-4 border-b">
      <h4 className="font-bold mb-1">{item.title}</h4>
      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-gray-100 rounded">Visa</button>
        <button className="flex-1 py-2 bg-blue-500 text-white rounded">Redigera</button>
      </div>
    </div>
  )}
/>
```

---

## 🎨 Customization

### Custom Grid Layout

```typescript
<ResourceListView
  cardGridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
  // ... other props
/>
```

### Custom Table Styling

```typescript
<ResourceListView
  tableClassName="min-w-[800px]"  // Ensure minimum width
  // ... other props
/>
```

### Custom Container Styling

```typescript
<ResourceListView
  className="my-8 px-4"
  // ... other props
/>
```

---

## 🔄 State Management Patterns

### Pattern 1: Internal State (Uncontrolled)

```typescript
// Component manages its own state
<ResourceListView
  items={items}
  columns={columns}
  cardRenderer={cardRenderer}
  // No onSearch or searchQuery props = internal state
/>
```

### Pattern 2: Controlled State

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeCategory, setActiveCategory] = useState('all');

// Parent component controls state
<ResourceListView
  items={filteredItems}
  columns={columns}
  cardRenderer={cardRenderer}
  searchQuery={searchQuery}
  onSearch={setSearchQuery}
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
/>
```

### Pattern 3: Using Helper Hook

```typescript
import { ResourceListView, useListViewState } from '@/components/resource-list-view';

function MyComponent() {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useListViewState(items);

  const filteredItems = applyFilters(items, searchQuery, activeCategory);

  return (
    <ResourceListView
      items={filteredItems}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      // ... other props
    />
  );
}
```

---

## 📱 Mobile Responsiveness

### Automatic Behavior
- **Desktop (≥768px)**: Shows full table
- **Mobile (<768px)**: Shows adapted list or mobile renderer

### Custom Mobile Renderer
```typescript
mobileListRenderer={(item) => (
  <div className="p-4">
    {/* Custom mobile-optimized layout */}
    <div className="flex justify-between mb-2">
      <span className="font-bold">{item.name}</span>
      <span className="text-gray-600">{item.quantity}</span>
    </div>
    <div className="text-sm text-gray-600">{item.description}</div>
    <button className="w-full mt-2 py-2 bg-blue-500 text-white rounded">
      Åtgärd
    </button>
  </div>
)}
```

---

## ⚡ Performance Tips

### 1. Memoize Card Renderers
```typescript
const cardRenderer = useCallback((item: T) => (
  <Card item={item} />
), []);
```

### 2. Use Row Keys for Grouped Items
```typescript
rowKey={(item) => item.id}  // Helps React optimize re-renders
```

### 3. Lazy Load Images
```typescript
render: (item) => (
  <img 
    src={item.image} 
    loading="lazy" 
    alt={item.name}
  />
)
```

### 4. Virtual Scrolling (Future Enhancement)
For lists with 100+ items, consider adding virtual scrolling.

---

## 🎯 Migration Guide

### From Old Component to ResourceListView

**Before:**
```typescript
function OldResourceList() {
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  
  return (
    <>
      <SearchBar value={search} onChange={setSearch} />
      <ViewToggle mode={viewMode} onToggle={setViewMode} />
      {viewMode === 'cards' ? (
        <div className="grid...">
          {items.map(item => <Card key={item.id} item={item} />)}
        </div>
      ) : (
        <table>...</table>
      )}
    </>
  );
}
```

**After:**
```typescript
function NewResourceList() {
  return (
    <ResourceListView
      items={items}
      columns={columns}
      cardRenderer={(item) => <Card item={item} />}
      searchPlaceholder="Sök resurser..."
    />
  );
}
```

**Benefits:**
- 70% less code
- Consistent UX
- Built-in mobile support
- Better accessibility

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Column sorting (click headers)
- [ ] Column visibility toggles
- [ ] Bulk selection (checkboxes)
- [ ] Export to CSV/Excel
- [ ] Print-friendly mode
- [ ] Virtual scrolling for large lists
- [ ] Keyboard navigation
- [ ] Drag-and-drop reordering
- [ ] Pagination support
- [ ] Infinite scroll
- [ ] Saved view preferences
- [ ] Column resizing
- [ ] Row grouping controls

---

## 📝 Best Practices

### DO ✅
- Use semantic column keys
- Provide descriptive labels
- Handle empty states gracefully
- Test on mobile devices
- Use memoization for complex renderers
- Provide accessible action buttons
- Use consistent styling across views

### DON'T ❌
- Mix controlled and uncontrolled patterns
- Forget mobile renderers for complex tables
- Use inline functions without memoization
- Ignore loading states
- Overcomplicate column renders
- Forget to handle errors

---

## 🧪 Testing

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { ResourceListView } from './resource-list-view';

test('renders items in card view', () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ];

  render(
    <ResourceListView
      items={items}
      columns={[]}
      cardRenderer={(item) => <div>{item.name}</div>}
    />
  );

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});
```

---

## 📚 Related Components

- `GroupedSharedResourceCard` - Card for grouped resources
- `SharedResourceActionsModal` - Actions for resources
- `CommunityResourceCard` - Community-owned resources
- `HelpRequestCard` - Help requests

---

## 💡 Tips & Tricks

### Tip 1: Dynamic Columns
```typescript
const columns = useMemo(() => {
  const base = [nameColumn, quantityColumn];
  if (showLocation) base.push(locationColumn);
  return base;
}, [showLocation]);
```

### Tip 2: Conditional Rendering in Cells
```typescript
render: (item) => (
  item.quantity > 0 
    ? <strong className="text-green-600">{item.quantity}</strong>
    : <span className="text-gray-400">Slut i lager</span>
)
```

### Tip 3: Action Buttons
```typescript
render: (item) => (
  <div className="flex gap-2">
    <button onClick={() => handleEdit(item)}>Redigera</button>
    <button onClick={() => handleDelete(item)}>Ta bort</button>
  </div>
)
```

---

**Status:** ✅ PRODUCTION READY  
**Version:** 1.0.0  
**Last Updated:** October 4, 2025

