# 🎯 Feature: Grouped Shared Resources

**Date:** October 4, 2025  
**Feature:** Intelligent grouping of shared resources in "Delade resurser" view  
**Goal:** Improve UX by showing when multiple people share the same resource

---

## 📋 Overview

When multiple community members share resources with the same name (e.g., "Dricksvatten", "Socker", "Generator"), these are now automatically grouped together into a single card that shows:
- Total combined quantity from all contributors
- Names of all people sharing the resource
- Expandable detail view to see individual offers
- Clear indication if you're one of the contributors

---

## ✨ Key Features

### 1. **Automatic Grouping**
Resources are grouped by name (case-insensitive):
```typescript
// Grouping logic
const groupSharedResources = (resources: SharedResource[]) => {
  const grouped = new Map<string, SharedResource[]>();
  
  resources.forEach(resource => {
    const key = resource.resource_name?.toLowerCase() || 'unknown';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(resource);
  });
  
  return Array.from(grouped.values());
};
```

### 2. **Smart Card Display**
- **Single Resource:** Shows normal single card with owner name prominently
- **Multiple Resources:** Shows grouped card with:
  - Badge showing number of contributors (e.g., "3 personer")
  - Total quantity aggregated
  - List of all contributor names
  - "Visa alla X erbjudanden" button to expand

### 3. **Expandable Details**
When expanded, grouped cards show:
- Each individual share with full details
- Owner name for each offer
- Individual quantities, locations, availability dates
- Notes for each specific offer
- Individual action buttons ("Be om denna" or "Hantera")
- "(Du)" indicator if you're the owner

### 4. **Owner Visibility**
**Every card now prominently displays the resource owner:**
- **Single resources:** User icon + name in info section
- **Grouped resources:** 
  - Summary shows all names: "Anna, Bengt, Cecilia"
  - Expanded view shows each contributor with their details
  - "Din resurs" badge if you're a contributor

---

## 🎨 UI Design

### Grouped Card (Collapsed)
```
┌─────────────────────────────────────┐
│ 🍞 Knäckebröd            Din resurs │
│    Mat                    3 personer│
├─────────────────────────────────────┤
│ 📦 Totalt: 15 st (3 tillgängliga)  │
│ 👥 Anna, Bengt, Cecilia             │
├─────────────────────────────────────┤
│ [Visa alla 3 erbjudanden →]         │
└─────────────────────────────────────┘
```

### Grouped Card (Expanded)
```
┌─────────────────────────────────────┐
│ 🍞 Knäckebröd            Din resurs │
│    Mat                    3 personer│
├─────────────────────────────────────┤
│ 📦 Totalt: 15 st (3 tillgängliga)  │
│ 👥 Anna, Bengt, Cecilia             │
├─────────────────────────────────────┤
│         ▲ Dölj detaljer             │
├─────────────────────────────────────┤
│ 👤 Anna                         (Du)│
│    5 st                             │
│    📍 Min adress                    │
│    🕐 Till 2025-12-31               │
│    [Hantera]                        │
├─────────────────────────────────────┤
│ 👤 Bengt                            │
│    5 st                             │
│    📍 Storgatan 12                  │
│    [Be om denna]                    │
├─────────────────────────────────────┤
│ 👤 Cecilia                          │
│    5 st                             │
│    📍 Torget                        │
│    "Glöm ej egen påse"              │
│    [Be om denna]                    │
└─────────────────────────────────────┘
```

### Single Resource Card
```
┌─────────────────────────────────────┐
│ ⚡ Generator                        │
│    Energi                           │
├─────────────────────────────────────┤
│ 📦 1 st                             │
│ 👤 Per Karlsson                     │
│ 📍 Samlingshuset                    │
│ 🕐 Till 2025-11-15                  │
├─────────────────────────────────────┤
│ "Behöver inte bokas i förväg"      │
├─────────────────────────────────────┤
│ [Be om denna resurs]                │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Components Created

#### 1. `GroupedSharedResourceCard`
- **Purpose:** Display grouped resources (2+ people sharing same item)
- **Features:**
  - Aggregates total quantity
  - Shows contributor count
  - Lists all names
  - Expandable details
  - Individual action buttons per contributor
- **Props:** `resources: SharedResource[], currentUserId, onRequest, onManage`

#### 2. `SharedResourceCard` (Enhanced)
- **Purpose:** Display single shared resource
- **Changes:**
  - Now prominently shows owner name with user icon
  - Updated badge colors to olive green theme
  - Better visual hierarchy
- **Props:** `resource: SharedResource, currentUserId, onRequest, onManage`

### Data Flow

```
sharedResources (from DB)
  ↓
filterResources() - Apply category & search filters
  ↓
groupSharedResources() - Group by resource name
  ↓
groupedSharedResources - Array of resource groups
  ↓
<GroupedSharedResourceCard> - Renders grouped or single card
```

### Key Functions

```typescript
// Grouping logic
const groupSharedResources = (resources: SharedResource[]) => {
  const grouped = new Map<string, SharedResource[]>();
  resources.forEach(resource => {
    const key = resource.resource_name?.toLowerCase() || 'unknown';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(resource);
  });
  return Array.from(grouped.values());
};

// Filtering now includes both category fields
const filterResources = (resources: any[]) => {
  let filtered = resources;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(r => 
      r.category === categoryFilter || 
      r.resource_category === categoryFilter
    );
  }
  // ... search filter ...
  return filtered;
};
```

---

## 🎯 User Benefits

### For Resource Seekers
✅ **Easier to find resources** - See total availability at a glance  
✅ **More options** - Compare multiple offers of the same item  
✅ **Better decision making** - See location, quantity, notes for each  
✅ **Clear contact info** - Know exactly who to reach out to

### For Resource Sharers
✅ **Community visibility** - See who else shares similar resources  
✅ **Manage easily** - Your resources clearly marked as "Din resurs"  
✅ **Encourage sharing** - Seeing others share motivates participation  
✅ **Reduced clutter** - UI doesn't get overwhelming with many resources

---

## 📊 Example Scenarios

### Scenario 1: Water Sharing
**Community Members:**
- Anna: 10 liter (Hemma, Gatan 1)
- Bengt: 5 liter (Kontoret, Torget 5)
- Cecilia: 20 liter (Källaren, Storgatan 12)

**Result:** Single grouped card showing:
- "Dricksvatten - 3 personer"
- "Totalt: 35 liter (3 tillgängliga)"
- Click to expand and see each individual offer

### Scenario 2: Mixed Resources
- Anna: Dricksvatten (10L)
- Bengt: Dricksvatten (5L)
- Cecilia: Generator (1 st)

**Result:** 
- 1 grouped card for "Dricksvatten" (Anna + Bengt)
- 1 single card for "Generator" (Cecilia)

---

## 🧪 Testing Checklist

- [x] Single resource shows owner name prominently
- [x] Multiple resources with same name are grouped
- [x] Total quantity is calculated correctly
- [x] All contributor names are shown
- [x] Expand/collapse works smoothly
- [x] Individual action buttons work (Be om denna/Hantera)
- [x] "Din resurs" badge shows correctly
- [x] "(Du)" indicator shows in expanded view
- [x] Category filtering works with grouped resources
- [x] Search filtering works with grouped resources
- [x] No linter errors

---

## 🎨 Color Scheme (Olive Green)

- **Primary Badge:** `bg-[#556B2F]/10 text-[#556B2F]` (contributor count)
- **Owner Badge:** `bg-[#5C6B47]/10 text-[#3D4A2B]` (Din resurs)
- **Action Buttons:** `from-[#556B2F] to-[#3D4A2B]` gradient
- **Manage Button:** `bg-[#5C6B47]` olive green

---

## 📝 Files Modified

1. **`rpac-web/src/components/community-resource-hub.tsx`**
   - Added `groupSharedResources()` function
   - Created `GroupedSharedResourceCard` component
   - Enhanced `SharedResourceCard` with owner name display
   - Updated rendering logic to use grouped cards
   - Updated `filterResources()` to handle `resource_category`

---

## 🚀 Future Enhancements

### Potential Improvements
- [ ] Sort contributors by quantity (highest first)
- [ ] Show distance/proximity to each contributor
- [ ] Add "Request from all" button for grouped resources
- [ ] Show history of successful resource shares
- [ ] Add favorites/bookmark system
- [ ] Resource availability calendar view
- [ ] Notification when new resources are shared

---

## 📸 Before & After

### Before
- Every shared resource shown as separate card
- No indication of duplicates
- Hard to see total availability
- Owner names not prominently displayed

### After
✅ Resources intelligently grouped by name  
✅ Total availability shown at a glance  
✅ All contributors listed clearly  
✅ Owner names prominently displayed  
✅ Expandable details for individual offers  
✅ Clean, organized UI even with many resources  

---

**Status:** ✅ COMPLETED  
**Ready for Testing:** Yes  
**Approved for Production:** Pending user testing

