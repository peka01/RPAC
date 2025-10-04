# 📦 RPAC Standard Components

**Purpose:** Central reference for mandatory reusable components  
**Status:** Living document - updated as standards evolve  
**Last Updated:** October 4, 2025

---

## 🎯 Philosophy

**Consistency over customization.** We use standard components to ensure:
- ✅ Unified user experience across the app
- ✅ Reduced code duplication
- ✅ Faster development
- ✅ Easier maintenance
- ✅ Better quality through single source of truth

---

## 🔧 Mandatory Components

### 1. **ResourceListView** - Universal List Component

**Status:** ⚡ MANDATORY - Use for ALL list displays

**Location:** `rpac-web/src/components/resource-list-view.tsx`

**Purpose:** Replaces ALL custom list implementations with a standardized, feature-rich component.

#### When to Use
✅ **ALWAYS use for:**
- Resource lists (shared, owned, inventory)
- User/member lists
- Task lists (cultivation, reminders, help requests)
- Message lists
- Any data shown as cards
- Any data shown as table
- Any list with search functionality
- Any list with filters

❌ **DO NOT:**
- Create custom table components
- Build custom search/filter UI
- Duplicate list functionality
- Manually implement card/table toggle

#### Features
- **View Toggle**: Switch between cards and table
- **Search Bar**: Built-in real-time filtering
- **Category Filters**: Dropdown filter system
- **Grouping**: Support for grouped items
- **Mobile Responsive**: Adapted layouts
- **Loading States**: Built-in spinners
- **Empty States**: Customizable placeholders
- **Expandable Rows**: Table row expansion
- **Type Safe**: TypeScript generics

#### Quick Example
```typescript
import { ResourceListView } from '@/components/resource-list-view';

<ResourceListView
  items={data}
  columns={[
    { key: 'name', label: 'Namn', render: (item) => <b>{item.name}</b> },
    { key: 'quantity', label: 'Antal', render: (item) => item.quantity },
    { key: 'actions', label: 'Åtgärder', align: 'right', render: (item) => <Button /> }
  ]}
  cardRenderer={(item) => <YourCard item={item} />}
  searchPlaceholder="Sök..."
  categories={[
    { id: 'all', label: 'Alla' },
    { id: 'food', label: 'Mat', emoji: '🍞' },
    { id: 'tools', label: 'Verktyg', emoji: '🔧' }
  ]}
/>
```

#### Documentation
- **Full API Reference:** `docs/COMPONENT_RESOURCE_LIST_VIEW.md`
- **Migration Guide:** `docs/MIGRATION_EXAMPLE_RESOURCE_LIST_VIEW.md`
- **Examples:** See `community-resource-hub.tsx` for real usage

#### Benefits
- **-75% less code** per list
- **Consistent UX** everywhere
- **Single source** for fixes/features
- **Mobile optimized** out of the box
- **Easy to use** - minimal learning curve

---

## 🏗️ Component Design Principles

### 1. **Flexibility Through Configuration**
Components should accept configuration props rather than requiring code changes.

**Good:**
```typescript
<ResourceListView searchable={true} filterable={true} />
```

**Bad:**
```typescript
// Having to fork component to add features
<CustomResourceList /> // with hardcoded search
```

### 2. **Render Props for Customization**
Let users customize specific parts while keeping structure.

**Good:**
```typescript
<ResourceListView
  cardRenderer={(item) => <MyCustomCard item={item} />}
/>
```

**Bad:**
```typescript
// Forcing everyone to use the same card design
<ResourceListView /> // with built-in inflexible card
```

### 3. **Sensible Defaults**
Work great out of the box, but allow overrides.

**Good:**
```typescript
// Minimal usage - works with defaults
<ResourceListView items={data} columns={cols} cardRenderer={card} />

// Advanced usage - override defaults
<ResourceListView
  items={data}
  columns={cols}
  cardRenderer={card}
  defaultViewMode="table"
  searchPlaceholder="Custom search..."
/>
```

### 4. **TypeScript Generics**
Support any data type through generics.

**Good:**
```typescript
function ResourceListView<T>({ items: T[] }) { ... }
```

**Bad:**
```typescript
function ResourceListView({ items: any[] }) { ... }
```

---

## 📋 Standard Component Checklist

When creating a new standard component, ensure it has:

- [ ] **Clear use case** - Solves a common problem
- [ ] **Flexible API** - Configuration over customization
- [ ] **TypeScript types** - Full type safety
- [ ] **Mobile responsive** - Works on all devices
- [ ] **Documented** - Clear API documentation
- [ ] **Examples** - Real usage examples
- [ ] **Tested** - Unit tests for critical paths
- [ ] **Accessible** - WCAG 2.1 AA compliant
- [ ] **Performance** - Optimized rendering
- [ ] **Maintainable** - Clear, commented code

---

## 🚀 Proposing New Standard Components

### When to Standardize
Standardize when:
- Pattern appears in 3+ places
- Significant complexity to implement
- Inconsistency causes UX issues
- Maintenance burden is high

### Proposal Process
1. **Identify pattern** - Document where it's used
2. **Design API** - Plan flexible interface
3. **Build component** - Implement with examples
4. **Document** - Write comprehensive docs
5. **Migrate** - Update existing uses
6. **Announce** - Add to this document

---

## 📚 Future Candidate Components

Components being considered for standardization:

### High Priority
- [ ] **FormBuilder** - Standard form with validation
- [ ] **DataGrid** - Advanced table with sorting/pagination
- [ ] **FileUpload** - Standardized file upload UI
- [ ] **DateRangePicker** - Date range selection

### Medium Priority
- [ ] **ChartView** - Standard chart/graph component
- [ ] **MapView** - Map display component
- [ ] **Timeline** - Event timeline visualization
- [ ] **Stepper** - Multi-step form/wizard

### Low Priority
- [ ] **ColorPicker** - Color selection UI
- [ ] **RichTextEditor** - WYSIWYG editor
- [ ] **VideoPlayer** - Video playback
- [ ] **AudioRecorder** - Audio recording

---

## 🔄 Migration Strategy

### Phase 1: Document Standard (✅ COMPLETE)
- Create component
- Write documentation
- Add to conventions

### Phase 2: Migrate Existing (🔄 IN PROGRESS)
- [ ] Community shared resources
- [ ] Community-owned resources
- [ ] Help requests list
- [ ] User profiles list
- [ ] Cultivation tasks
- [ ] Message lists

### Phase 3: Enforce Standard (📋 PLANNED)
- Add linting rules
- Code review checklist
- Automated detection

---

## 💡 Best Practices

### Using Standard Components

#### DO ✅
- Read documentation first
- Use latest version
- Report bugs/feature requests
- Share successful patterns
- Contribute improvements

#### DON'T ❌
- Fork for minor changes
- Work around limitations
- Duplicate functionality
- Skip documentation
- Ignore updates

### Contributing to Standard Components

#### DO ✅
- Discuss changes first
- Maintain backward compatibility
- Update documentation
- Add tests
- Follow existing patterns

#### DON'T ❌
- Break existing usage
- Add breaking changes without migration path
- Introduce new dependencies unnecessarily
- Over-engineer solutions
- Forget mobile responsiveness

---

## 📊 Component Usage Tracking

### ResourceListView Usage

**Current Implementations:**
- ✅ Community shared resources (partial)
- ⏳ Community-owned resources (pending)
- ⏳ Help requests (pending)
- ⏳ User profiles (pending)
- ⏳ Cultivation tasks (pending)

**Impact:**
- **Code reduction:** ~200 lines → ~50 lines per list
- **Maintenance:** 1 component vs 5+ implementations
- **Consistency:** 100% UX consistency

---

## 🎓 Learning Resources

### For Developers
1. Read component documentation
2. Study examples in codebase
3. Try simple implementation first
4. Explore advanced features
5. Share learnings with team

### For Designers
1. Review component capabilities
2. Design within constraints
3. Request features if needed
4. Test on real devices
5. Provide UX feedback

---

## 📝 Updates and Changelog

### Version 1.0 (October 4, 2025)
- ✅ Created ResourceListView component
- ✅ Documented in llm_instructions.md
- ✅ Added to conventions.md
- ✅ Created comprehensive API docs
- ✅ Built migration guide

### Future Updates
- Add more standard components as they're created
- Track adoption metrics
- Gather feedback
- Iterate on APIs

---

## 🤝 Getting Help

### Questions About Standard Components
1. Check component documentation
2. Review examples in codebase
3. Ask in development chat
4. Create discussion issue

### Reporting Issues
1. Verify it's component issue (not usage)
2. Provide minimal reproduction
3. Include environment details
4. Suggest fix if possible

### Feature Requests
1. Explain use case
2. Show current workaround
3. Propose API changes
4. Consider backward compatibility

---

**Remember:** Standard components are here to help. Use them, improve them, and suggest new ones. Together we build better software! 🚀

