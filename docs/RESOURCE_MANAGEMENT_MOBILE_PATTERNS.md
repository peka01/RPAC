# Resource Management - Mobile UX Patterns (RPAC Standards)
**Date**: 2025-10-04  
**Reference**: Following `docs/MOBILE_UX_STANDARDS.md`  
**Status**: 🎯 DESIGN SPECIFICATION

---

## 📱 Mobile Component Architecture

Following RPAC's proven pattern of separate mobile components:

```
resource-management-hub.tsx              ← Desktop version
resource-management-hub-mobile.tsx       ← Mobile version
resource-management-responsive.tsx       ← Wrapper (768px breakpoint)
```

---

## 🎨 Individual Resource Management Mobile

### Hero Header Pattern (from cultivation-calendar-mobile.tsx)

```tsx
<div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
  {/* Icon + Title */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <Package size={32} className="text-white" strokeWidth={2} />
    </div>
    <div className="flex-1">
      <h1 className="text-2xl font-bold mb-1">Min beredskapsstatus</h1>
      <p className="text-white/80 text-sm">Hantera dina resurser</p>
    </div>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-3 gap-3">
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
      <div className="text-2xl font-bold mb-1">67%</div>
      <div className="text-white/80 text-xs">Beredskap</div>
    </div>
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
      <div className="text-2xl font-bold mb-1">4</div>
      <div className="text-white/80 text-xs">Dagar</div>
    </div>
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
      <div className="text-2xl font-bold mb-1">12</div>
      <div className="text-white/80 text-xs">Resurser</div>
    </div>
  </div>
</div>
```

### Category Health Cards (from personal-dashboard-mobile.tsx)

```tsx
<div className="grid grid-cols-2 gap-3 px-6 mb-6">
  {categoryData.map(category => {
    const Icon = category.icon;
    const statusColor = category.health >= 80 ? '#556B2F' : 
                       category.health >= 50 ? '#B8860B' : '#8B4513';
    
    return (
      <button
        key={category.name}
        className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
      >
        {category.needsAttention && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Icon size={28} style={{ color: statusColor }} strokeWidth={2} />
        </div>
        
        <h4 className="font-bold text-gray-900 mb-1">{category.emoji} {category.name}</h4>
        
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor
            }}
          >
            {category.health}%
          </span>
          <span className="text-sm font-bold text-gray-900">
            {category.items} st
          </span>
        </div>
        
        <div className="text-xs text-gray-600">
          {category.daysRemaining > 0 ? 
            `${category.daysRemaining} dagar kvar` : 
            'Behöver uppmärksamhet'}
        </div>
      </button>
    );
  })}
</div>
```

### Quick-Add Bottom Sheet (from cultivation-reminders-mobile.tsx)

```tsx
{showAddModal && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
      onClick={() => setShowAddModal(false)}
    />
    
    {/* Bottom Sheet */}
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in pointer-events-none">
      <div className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Lägg till resurs</h3>
          <button
            onClick={() => setShowAddModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all touch-manipulation active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Quick-Add Templates */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 mb-3">Vanliga resurser</h4>
          <div className="space-y-2">
            {quickAddTemplates.map(template => (
              <button
                key={template.name}
                onClick={() => handleQuickAdd(template)}
                className="w-full bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 rounded-xl p-4 transition-all touch-manipulation active:scale-98 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-600">
                      {template.quantity} {template.unit}
                    </div>
                  </div>
                </div>
                <Plus size={20} className="text-[#3D4A2B]" strokeWidth={2.5} />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Add */}
        <div className="border-t pt-6">
          <h4 className="font-bold text-gray-900 mb-3">Egen resurs</h4>
          {/* Form fields here */}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <button className="w-full bg-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98">
            Lägg till
          </button>
          <button className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all touch-manipulation active:scale-98">
            Avbryt
          </button>
        </div>
      </div>
    </div>
  </>
)}
```

### Floating Action Button (Fixed Bottom-Right)

```tsx
<button
  onClick={() => setShowAddModal(true)}
  className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all touch-manipulation active:scale-95 flex items-center justify-center z-30"
>
  <Plus size={24} strokeWidth={3} />
</button>
```

**Note**: `bottom-24` leaves room for mobile navigation (bottom-16 + extra spacing).

---

## 🏘️ Community Resource Management Mobile

### Three-Tier Tab Navigation (from messaging-system-mobile.tsx)

```tsx
<div className="sticky top-0 bg-white z-10 border-b border-gray-200">
  <div className="flex overflow-x-auto no-scrollbar">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          flex-1 min-w-[100px] px-4 py-3 font-bold transition-all touch-manipulation
          ${activeTab === tab.id 
            ? 'text-[#3D4A2B] border-b-2 border-[#3D4A2B]' 
            : 'text-gray-600 border-b-2 border-transparent'}
        `}
      >
        <div className="flex flex-col items-center gap-1">
          <tab.icon size={20} strokeWidth={2.5} />
          <span className="text-xs">{tab.label}</span>
        </div>
      </button>
    ))}
  </div>
</div>
```

### Resource Card with Actions (Swipeable Pattern)

```tsx
<div className="bg-white rounded-2xl p-4 shadow-lg mb-3 relative overflow-hidden touch-manipulation">
  {/* Resource Header */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
        <span className="text-2xl">{resource.emoji}</span>
      </div>
      <div>
        <h4 className="font-bold text-gray-900">{resource.name}</h4>
        <p className="text-sm text-gray-600">
          {resource.quantity} {resource.unit}
        </p>
      </div>
    </div>
    
    {resource.isOwn && (
      <div className="flex gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation active:scale-95">
          <Edit2 size={16} className="text-[#3D4A2B]" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation active:scale-95">
          <Trash2 size={16} className="text-[#8B4513]" />
        </button>
      </div>
    )}
  </div>

  {/* Resource Details */}
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-gray-600">
      <User size={14} />
      <span>{resource.sharer}</span>
    </div>
    <div className="flex items-center gap-2 text-gray-600">
      <Clock size={14} />
      <span>{resource.availableDays} dagar</span>
    </div>
  </div>

  {/* Action Button */}
  {!resource.isOwn && (
    <button className="w-full mt-3 bg-[#3D4A2B] text-white py-3 rounded-xl font-bold touch-manipulation active:scale-98">
      Begär
    </button>
  )}
</div>
```

### Admin CRUD Modal (Full-Screen Overlay)

```tsx
{showAdminModal && (
  <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
    {/* Sticky Header */}
    <div className="sticky top-0 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-4 shadow-lg z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAdminModal(false)}
          className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Lägg till samhällsresurs</h2>
          <p className="text-white/80 text-sm">För hela samhället</p>
        </div>
      </div>
    </div>

    {/* Form Content */}
    <div className="p-6 space-y-6">
      {/* Resource Type Selection */}
      <div>
        <label className="block font-bold text-gray-900 mb-3">Typ av resurs</label>
        <div className="grid grid-cols-2 gap-3">
          {resourceTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`
                p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98
                ${selectedType === type.id
                  ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                  : 'border-gray-200 bg-white'}
              `}
            >
              <span className="text-2xl mb-2 block">{type.emoji}</span>
              <span className="font-bold text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form fields... */}
    </div>

    {/* Fixed Bottom Actions */}
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 space-y-3">
      <button className="w-full bg-[#3D4A2B] text-white py-4 rounded-xl font-bold touch-manipulation active:scale-98">
        Spara samhällsresurs
      </button>
      <button className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold touch-manipulation active:scale-98">
        Avbryt
      </button>
    </div>
  </div>
)}
```

---

## 🎯 Mobile UX Principles Applied

### 1. Touch Optimization
- ✅ All buttons: **48px+ height** (`py-4` = 16px × 2 = 32px + text height)
- ✅ Touch targets: **44px minimum**
- ✅ Active states: `active:scale-98` or `active:scale-95`
- ✅ Touch manipulation: `touch-manipulation` class on all interactive elements

### 2. Bottom Navigation Clearance
- ✅ Floating buttons: `bottom-24` (leaves room for nav)
- ✅ Content padding: `pb-32` (prevents content hiding behind nav)
- ✅ Fixed actions: Account for `bottom-16` mobile nav height

### 3. Animations (60fps)
```css
/* globals.css patterns */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-slide-in-bottom {
  animation: slideInBottom 0.3s ease-out;
}

.active\:scale-98:active {
  transform: scale(0.98);
}

.active\:scale-95:active {
  transform: scale(0.95);
}
```

### 4. Color Usage
- ✅ Primary olive: `#3D4A2B` for buttons, active states
- ✅ Dark olive: `#2A331E` for hover states
- ✅ Gradients: `from-[#556B2F] to-[#3D4A2B]` for hero headers
- ✅ Transparency: `bg-white/20` for glass effects
- ✅ Status colors: Sparingly, only for urgency

### 5. Typography
- ✅ Headers: `text-2xl font-bold` (hero), `text-xl font-bold` (sections)
- ✅ Body: `text-base font-medium`
- ✅ Secondary: `text-sm text-gray-600`
- ✅ Metadata: `text-xs text-gray-600`

### 6. Spacing
- ✅ Card padding: `p-4` to `p-6`
- ✅ Gaps: `gap-3` (12px) for grids, `gap-2` (8px) for compact
- ✅ Margins: `mb-6` between sections, `mb-3` between cards

---

## 📋 Component Checklist for Each Mobile Component

When creating mobile resource components, ensure:

- [ ] Separate `-mobile.tsx` file (not responsive CSS)
- [ ] Hero header with gradient (olive green)
- [ ] Stats grid with frosted glass cards
- [ ] 44px+ touch targets on all buttons
- [ ] `active:scale-98` feedback on taps
- [ ] `touch-manipulation` class on interactive elements
- [ ] Bottom sheets for modals (not centered overlays)
- [ ] Floating action button at `bottom-24 right-6`
- [ ] Content `pb-32` for nav clearance
- [ ] Emoji + icons for visual language
- [ ] Swedish localization via `t()` function
- [ ] Loading states with spinners
- [ ] Empty states with helpful CTAs
- [ ] Optimistic UI updates
- [ ] Error handling with user-friendly messages

---

## 🎨 Proven Patterns to Copy

**Hero Headers**: Copy from `cultivation-calendar-mobile.tsx`  
**Category Cards**: Copy from `personal-dashboard-mobile.tsx`  
**Bottom Sheets**: Copy from `cultivation-reminders-mobile.tsx`  
**Full-Screen Modals**: Copy from `crisis-cultivation-mobile.tsx`  
**Tab Navigation**: Copy from `messaging-system-mobile.tsx`  
**Floating FAB**: Copy from `cultivation-calendar-mobile.tsx`

---

## ✅ Mobile Implementation Priority

1. **ResourceManagementHubMobile.tsx** - Main dashboard
2. **CategoryDetailViewMobile.tsx** - Per-category management
3. **QuickAddModalMobile.tsx** - Quick-add bottom sheet
4. **CommunityResourceHubMobile.tsx** - Community dashboard
5. **CommunityResourceCRUDMobile.tsx** - Admin full-screen modal

---

**This document ensures resource management mobile UX perfectly matches RPAC's proven mobile patterns!** ✨


