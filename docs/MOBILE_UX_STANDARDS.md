# RPAC Mobile UX Standards & Patterns
**The Definitive Guide to Mobile Development in RPAC**

> **MANDATORY READING**: All mobile development MUST follow these standards and patterns. This guide represents best-in-class mobile UX that rivals top consumer apps like Instagram, Apple Health, Spotify, and Things 3.

---

## 📱 Mobile UX Philosophy

### Core Principles

**"Make it so good that users forget they're using a web app. Make it so intuitive that no instructions are needed. Make it so beautiful that they want to show it to friends. Make it so smooth that it feels like magic."**

1. **Native App Feel**: Every interaction should feel like a native iOS/Android app
2. **Zero Learning Curve**: Users should understand everything immediately
3. **Delightful Interactions**: Smooth animations and satisfying feedback
4. **Performance First**: 60fps animations, no jank, instant feedback
5. **Touch-Optimized**: Every target must be easy to hit, even with gloves
6. **Visual Consistency**: Follow established patterns religiously

---

## 🏗️ Architecture Pattern

### Component Structure

**ALWAYS use separate mobile components, NOT responsive CSS.**

```
component-name.tsx              ← Desktop/tablet version
component-name-mobile.tsx       ← Mobile-optimized version
component-name-responsive.tsx   ← Wrapper that switches based on screen width
```

### Responsive Wrapper Template

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ComponentNameDesktop } from '@/components/component-name';
import { ComponentNameMobile } from '@/components/component-name-mobile';

interface ComponentNameResponsiveProps {
  // Your props
}

export function ComponentNameResponsive(props: ComponentNameResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <ComponentNameMobile {...props} />
  ) : (
    <ComponentNameDesktop {...props} />
  );
}
```

**Key Points:**
- Breakpoint: **768px** (iPad mini portrait and below)
- Hydration-safe with `useState`
- Clean separation of concerns
- Easy to maintain and test

---

## 🎨 Visual Design Patterns

### Pattern 1: Hero Header with Gradient

**When to use:** Top of every mobile screen, establishes context and brand

```tsx
<div className="bg-gradient-to-br from-[color1] to-[color2] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
  {/* Icon + Title Section */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <Icon size={32} className="text-white" strokeWidth={2} />
    </div>
    <div className="flex-1">
      <h1 className="text-2xl font-bold mb-1">Title</h1>
      <p className="text-white/80 text-sm">Subtitle</p>
    </div>
  </div>

  {/* Stats Grid (optional) */}
  <div className="grid grid-cols-3 gap-3">
    {stats.map(stat => (
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
        <div className="text-2xl font-bold mb-1">{stat.value}</div>
        <div className="text-white/80 text-xs">{stat.label}</div>
      </div>
    ))}
  </div>
</div>
```

**Gradient Selection:**
- Success/Health: `from-green-500 to-emerald-600`
- Info/Calm: `from-blue-500 to-cyan-600`
- Warning/Attention: `from-amber-500 to-orange-600`
- Error/Critical: `from-red-500 to-rose-600`
- Brand/Olive: `from-[#556B2F] to-[#3D4A2B]`

### Pattern 2: Action Card

**When to use:** Any clickable item that performs an action

```tsx
<button
  onClick={handleAction}
  className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left"
>
  <div className="flex items-center gap-4">
    {/* Icon */}
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon size={24} style={{ color }} strokeWidth={2} />
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    
    {/* Arrow */}
    <ArrowRight size={20} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
  </div>
</button>
```

**Key Classes:**
- `touch-manipulation`: Disables double-tap zoom
- `active:scale-98`: Touch feedback animation
- `flex-shrink-0`: Prevents icon squishing
- `min-w-0`: Enables text truncation

### Pattern 3: Bottom Sheet Modal

**When to use:** Forms, detailed views, any temporary overlay content

```tsx
{showModal && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
      onClick={() => setShowModal(false)}
    />
    
    {/* Sheet */}
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in pointer-events-none">
      <div className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all touch-manipulation active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Form fields or content */}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <button className="w-full bg-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98">
            Primary Action
          </button>
          <button className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all touch-manipulation active:scale-98">
            Secondary Action
          </button>
        </div>
      </div>
    </div>
  </>
)}
```

### Pattern 4: Status Badge

**When to use:** Show status, priority, or category

```tsx
<span
  className="px-3 py-1 rounded-full text-xs font-bold"
  style={{
    backgroundColor: `${color}20`,
    color: color
  }}
>
  {label}
</span>
```

**Status Color Mapping:**
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#10B981';
    case 'good': return '#3B82F6';
    case 'fair': return '#F59E0B';
    case 'poor': return '#EF4444';
    case 'critical': return '#7F1D1D';
    default: return '#6B7280';
  }
};
```

### Pattern 5: Progress Bar

**When to use:** Show completion, loading, or percentage

```tsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div
    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**Progress Indicator (Circular):**
```tsx
<div className="relative inline-block">
  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
    <div className="text-5xl font-bold">{score}%</div>
  </div>
  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/30 backdrop-blur-sm rounded-full">
    <span className="text-sm font-bold">Label</span>
  </div>
</div>
```

### Pattern 6: Empty State

**When to use:** No data available, guide users to action

```tsx
<div className="text-center py-16">
  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <Icon size={40} className="text-gray-400" />
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-2">Empty State Title</h3>
  <p className="text-gray-600 mb-6">
    Explanation of why it's empty and what to do
  </p>
  <button className="px-6 py-3 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95">
    Primary Action
  </button>
</div>
```

### Pattern 7: Loading State

**When to use:** Data is being fetched or processed

```tsx
<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
  <div className="text-center">
    <Icon className="w-16 h-16 mx-auto mb-4 text-[#3D4A2B] animate-pulse" />
    <p className="text-gray-600 font-medium">Loading message...</p>
  </div>
</div>
```

---

## 📐 Layout & Spacing Standards

### Safe Areas & Fixed Positioning

**CRITICAL**: Mobile navigation bar is 64px (16 × 4px) high at the bottom.

```tsx
// Main container with bottom padding
<div className="min-h-screen bg-gradient-to-br from-[color] to-[color] pb-32">
  {/* Content */}
</div>

// Fixed action buttons (above nav bar)
<div className="fixed bottom-16 left-0 right-0 px-6">
  <button className="w-full ...">Action</button>
</div>

// Floating action button (with extra clearance)
<button className="fixed bottom-32 right-6 w-16 h-16 ...">
  <Plus size={32} />
</button>
```

**Spacing Rules:**
- Main content: `pb-32` (128px) - clears nav + extra breathing room
- Fixed buttons: `bottom-16` (64px) - sits exactly above nav
- Floating buttons: `bottom-32` (128px) - extra clearance for visibility

### Grid Layouts

**2-Column Grid (Standard Mobile):**
```tsx
<div className="grid grid-cols-2 gap-3">
  {items.map(item => (
    <div key={item.id} className="...">
      {/* Card content */}
    </div>
  ))}
</div>
```

**3-Column Stats Grid:**
```tsx
<div className="grid grid-cols-3 gap-3">
  {stats.map(stat => (
    <div key={stat.id} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
      <div className="text-2xl font-bold mb-1">{stat.value}</div>
      <div className="text-white/80 text-xs">{stat.label}</div>
    </div>
  ))}
</div>
```

### Container Padding

**Standard horizontal padding:** `px-6` (24px)
- Provides comfortable margins
- Aligns with mobile design standards
- Consistent across all screens

---

## 👆 Touch Optimization

### Minimum Touch Targets

**MANDATORY**: All interactive elements must meet these minimums:

- **44px × 44px**: Apple HIG minimum (use for secondary actions)
- **48px × 48px**: Preferred minimum (use for primary actions)
- **56px × 56px**: Comfortable target (use for important actions)

```tsx
// Good - 48px target
<button className="p-3 ...">  {/* 12px padding = 48px with 24px icon */}
  <Icon size={24} />
</button>

// Better - Explicit sizing
<button className="w-12 h-12 ...">  {/* 48px × 48px */}
  <Icon size={24} />
</button>

// Best - Larger for primary actions
<button className="w-16 h-16 ...">  {/* 64px × 64px */}
  <Icon size={32} />
</button>
```

### Touch Feedback

**ALWAYS provide visual feedback:**

```tsx
className="... touch-manipulation active:scale-98 transition-all"
```

**Breakdown:**
- `touch-manipulation`: Disables 300ms tap delay and double-tap zoom
- `active:scale-98`: Scales down 2% when pressed
- `transition-all`: Smooth animation

**For hover states (on capable devices):**
```tsx
className="... hover:bg-gray-100 hover:shadow-xl"
```

---

## 🎬 Animation Standards

### Hardware-Accelerated Animations

**USE**: `transform`, `opacity` (GPU-accelerated)
**AVOID**: `width`, `height`, `top`, `left` (CPU-intensive)

### Standard Animation Classes

```css
/* Add to globals.css */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-slide-in-bottom {
  animation: slide-in-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Animation Timing

- **Fast**: 150-200ms (small UI feedback)
- **Medium**: 250-350ms (modals, cards)
- **Slow**: 400-500ms (large transitions)

**Easing:**
- Entry: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
- Exit: `ease-in`
- Feedback: `ease-out`

---

## 🎨 Color System

### Olive Green Brand Colors

```tsx
const BRAND_COLORS = {
  primary: '#3D4A2B',
  dark: '#2A331E',
  light: '#5C6B47',
  gray: '#4A5239',
  muted: '#707C5F'
};
```

### Status Colors

```tsx
const STATUS_COLORS = {
  excellent: '#10B981',  // green-500
  good: '#3B82F6',       // blue-500
  fair: '#F59E0B',       // amber-500
  poor: '#EF4444',       // red-500
  critical: '#7F1D1D'    // red-900
};
```

### Gradient Combinations

```tsx
const GRADIENTS = {
  success: 'from-green-500 to-emerald-600',
  info: 'from-blue-500 to-cyan-600',
  warning: 'from-amber-500 to-orange-600',
  error: 'from-red-500 to-rose-600',
  brand: 'from-[#556B2F] to-[#3D4A2B]'
};
```

### Color Psychology

- **Green**: Success, health, growth, safety
- **Blue**: Information, calmness, reliability
- **Amber/Orange**: Warning, attention, action needed
- **Red**: Critical, urgent, danger
- **Olive Green**: RPAC brand, nature, sustainability

---

## 🔤 Typography

### Hierarchy

```tsx
// Page title (hero header)
<h1 className="text-2xl font-bold">Title</h1>

// Section heading
<h2 className="text-xl font-bold">Section</h2>

// Card title
<h3 className="text-lg font-bold">Card Title</h3>

// Small heading
<h4 className="text-base font-bold">Small Heading</h4>

// Body text
<p className="text-sm">Body content</p>

// Caption/secondary
<p className="text-xs text-gray-600">Caption text</p>
```

### Text Colors

```tsx
// Primary text
className="text-gray-900"

// Secondary text
className="text-gray-600"

// Tertiary text (captions)
className="text-gray-500"

// Muted text
className="text-gray-400"

// White text (on colored backgrounds)
className="text-white"

// Semi-transparent white
className="text-white/80"
```

---

## 📋 Form Elements

### Input Field

```tsx
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder text"
  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none transition-colors"
/>
```

### Textarea (Auto-resizing)

```tsx
<textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder text"
  rows={3}
  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none resize-none"
/>
```

### Select/Dropdown Alternative (Button Grid)

**Better UX than native select on mobile:**

```tsx
<div className="grid grid-cols-2 gap-3">
  {options.map(option => (
    <button
      key={option.value}
      onClick={() => setValue(option.value)}
      className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
        value === option.value
          ? 'border-[#3D4A2B] bg-[#3D4A2B]/10'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-3xl mb-2">{option.emoji}</div>
      <div className="text-sm font-medium">{option.label}</div>
    </button>
  ))}
</div>
```

---

## 🎯 Navigation Patterns

### Floating Menu Button

**When to use:** Global navigation that shouldn't cover content

```tsx
<button
  onClick={() => setShowDrawer(true)}
  className="fixed top-20 right-4 z-50 p-4 bg-[#3D4A2B] text-white rounded-full hover:bg-[#2A331E] transition-all active:scale-95 touch-manipulation shadow-2xl"
>
  <Menu size={24} strokeWidth={2.5} />
</button>
```

### Slide-in Drawer

```tsx
{/* Backdrop */}
{showDrawer && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
    onClick={() => setShowDrawer(false)}
  />
)}

{/* Drawer */}
<div
  className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
    showDrawer ? 'translate-x-0' : 'translate-x-full'
  }`}
>
  {/* Drawer content */}
</div>
```

### Tab Navigation

```tsx
<div className="bg-white rounded-2xl p-2 shadow-lg">
  <div className="grid grid-cols-4 gap-2">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`py-3 px-2 rounded-xl font-medium text-sm transition-all touch-manipulation active:scale-95 ${
          activeTab === tab.id
            ? 'bg-[#3D4A2B] text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>
```

---

## 🔄 State Management Patterns

### Loading State

```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch data
      const data = await fetchData();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);

if (loading) {
  return <LoadingState />;
}
```

### Multi-Step Wizard

```tsx
const [step, setStep] = useState<'setup' | 'processing' | 'result'>('setup');

// Setup Step
if (step === 'setup') {
  return <SetupScreen onComplete={() => setStep('processing')} />;
}

// Processing Step
if (step === 'processing') {
  return <ProcessingScreen onComplete={() => setStep('result')} />;
}

// Result Step
if (step === 'result') {
  return <ResultScreen onReset={() => setStep('setup')} />;
}
```

---

## ✅ Quality Checklist

Before submitting mobile code, verify:

### Functionality
- [ ] All desktop features present in mobile version
- [ ] Forms validate correctly
- [ ] Loading states work
- [ ] Error states handled
- [ ] Empty states implemented

### Touch & Interaction
- [ ] All touch targets ≥44px (prefer 48px+)
- [ ] `touch-manipulation` on all interactive elements
- [ ] `active:scale-98` feedback on buttons
- [ ] Smooth 60fps animations
- [ ] No double-tap zoom issues

### Layout & Spacing
- [ ] Main container has `pb-32` padding
- [ ] Fixed buttons use `bottom-16`
- [ ] Floating buttons use `bottom-32`
- [ ] Hero headers use `rounded-b-3xl`
- [ ] Cards use `rounded-2xl`
- [ ] Consistent `px-6` horizontal padding

### Visual Design
- [ ] Olive green brand colors used
- [ ] Status colors consistent
- [ ] Proper gradient selection
- [ ] Typography hierarchy clear
- [ ] Icons sized correctly (24px standard, 32px large)

### Performance
- [ ] Hardware-accelerated animations
- [ ] Efficient re-renders
- [ ] Lazy loading where appropriate
- [ ] No layout shifts
- [ ] Fast initial load

### Accessibility
- [ ] Sufficient color contrast
- [ ] Focus states visible
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Touch targets well-spaced

---

## 📚 Reference Components

Study these exemplary mobile components:

1. **`individual-mobile-nav.tsx`**: Floating menu, slide-in drawer
2. **`personal-dashboard-mobile.tsx`**: Score display, stat cards
3. **`cultivation-reminders-mobile.tsx`**: Bottom sheets, CRUD operations
4. **`crisis-cultivation-mobile.tsx`**: Multi-step wizard, dynamic content
5. **`plant-diagnosis-mobile.tsx`**: Camera integration, AI chat
6. **`cultivation-calendar-mobile.tsx`**: Swipeable navigation, seasonal design
7. **`cultivation-planner-mobile.tsx`**: Wizard flow, dashboard

---

## 🚀 Performance Tips

### Optimize Re-renders

```tsx
// Use memo for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use callback for functions passed to children
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### Lazy Load Heavy Components

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingState />,
  ssr: false
});
```

### Debounce Resize Handlers

```tsx
useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  const checkMobile = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsMobile(window.innerWidth < 768);
    }, 100);
  };

  window.addEventListener('resize', checkMobile);
  return () => {
    window.removeEventListener('resize', checkMobile);
    clearTimeout(timeoutId);
  };
}, []);
```

---

## 🎓 Learning Resources

### External Inspiration
- **Apple Human Interface Guidelines**: Touch targets, gestures
- **Material Design 3**: Motion, elevation
- **Instagram**: Visual hierarchy, stories
- **Spotify**: Navigation, cards
- **Things 3**: Animations, empty states
- **Apple Health**: Data visualization, scores

### Internal References
- `docs/dev_notes.md`: Implementation history
- `docs/conventions.md`: Design philosophy
- This document: Standards and patterns

---

## 💡 Tips & Tricks

### Quick Wins
1. Use `backdrop-blur-sm` for modern glass effect
2. Add `shadow-2xl` to floating elements
3. Use `truncate` to prevent text overflow
4. Add `flex-shrink-0` to prevent icon squishing
5. Use `min-w-0` on flex children for proper truncation

### Common Pitfalls
1. ❌ Forgetting `pb-32` on main containers
2. ❌ Using `bottom-0` instead of `bottom-16/32`
3. ❌ Touch targets smaller than 44px
4. ❌ Missing `touch-manipulation`
5. ❌ Using CPU-intensive animations
6. ❌ Forgetting empty and loading states
7. ❌ Not testing on actual devices

### Testing Checklist
- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android (Chrome)
- [ ] Test landscape orientation
- [ ] Test with slow network
- [ ] Test with screen reader
- [ ] Test all interactive states
- [ ] Test animations at 60fps

---

## 🎯 Success Metrics

A successful mobile implementation should have:

1. **Zero content overlap** - Nothing hidden by navigation
2. **44px+ touch targets** - Everything easy to tap
3. **60fps animations** - Buttery smooth interactions
4. **Native feel** - Users forget it's a web app
5. **Zero learning curve** - Intuitive from first use
6. **Consistent design** - Follows all patterns
7. **Delightful feedback** - Every interaction feels good

---

## 📞 Support

Questions about mobile UX? Reference:
1. This document first
2. Existing mobile components
3. `docs/dev_notes.md` for implementation history
4. `docs/conventions.md` for design philosophy

**Remember:** When in doubt, copy from existing mobile components. They represent best-in-class implementation.

---

**Last Updated:** October 3, 2025  
**Version:** 1.0  
**Status:** ✅ Production Standard

**This document is the law for mobile development in RPAC. Follow it religiously.**

