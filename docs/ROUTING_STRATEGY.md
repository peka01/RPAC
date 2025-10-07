# 🗺️ RPAC Navigation & Routing Strategy

**Version:** 1.0  
**Last Updated:** 2025-01-28  
**Status:** ✅ IMPLEMENTED

## 📋 Overview

The RPAC application implements a comprehensive navigation system with hierarchical side menu for desktop and bottom navigation for mobile. The routing strategy supports both direct page navigation and URL parameter-based sub-navigation for optimal user experience.

## 🏗️ Navigation Architecture

### Desktop Navigation (Side Menu)
- **Location**: Fixed left sidebar (280px width)
- **Design**: Glass morphism with olive green accents
- **Structure**: Hierarchical tree with expandable sections
- **Logo**: Large Beready logo in header
- **Responsive**: Collapsible with icon-only mode

### Mobile Navigation (Bottom Bar)
- **Location**: Fixed bottom bar
- **Design**: Touch-optimized with 44px minimum targets
- **Structure**: Flat navigation with main sections
- **Icons**: Lucide React icons with emoji indicators

## 🛣️ Complete Routing Structure

### 1. Individual Level (`/individual`)

#### Main Route
```
/individual
```

#### Sub-sections (URL Parameters)
```
/individual?section=cultivation  # Default: Min odling
/individual?section=resources   # Resurser
```

#### Content Structure
- **Cultivation Section** (`?section=cultivation`)
  - Cultivation planning interface
  - Crop selection and management
  - Seasonal planning tools
  - Reminder system
  - Progress tracking

- **Resources Section** (`?section=resources`)
  - Personal resource inventory
  - Resource management tools
  - Emergency preparedness items
  - Resource categorization
  - Availability tracking

### 2. Local Community (`/local`)

#### Main Route
```
/local
```

#### Sub-sections (URL Parameters)
```
/local                    # Default: Översikt
/local?tab=discover       # Hitta fler
/local?tab=resources      # Resurser
/local?tab=messages       # Meddelanden
```

#### Content Structure
- **Overview** (Default)
  - Community dashboard
  - Member statistics
  - Recent activity
  - Quick actions

- **Discovery** (`?tab=discover`)
  - Community discovery
  - Member search and connection
  - Community recommendations
  - Join requests

- **Resources** (`?tab=resources`)
  - Shared community resources
  - Resource requests and offers
  - Community resource management
  - Resource sharing protocols

- **Messages** (`?tab=messages`)
  - Community messaging
  - Emergency communications
  - Group discussions
  - Notification center

### 3. Regional Level (`/regional`)

#### Main Route
```
/regional
```

#### Content Structure
- Regional coordination
- Cross-community resources
- Regional emergency planning
- Inter-community communication
- Regional resource sharing

### 4. Settings (`/settings`)

#### Main Route
```
/settings
```

#### Content Structure
- User profile management
- Privacy settings
- Notification preferences
- Account management
- Security settings

## 🔧 Technical Implementation

### Navigation Components

#### Core Components
- **`SideMenu`**: Desktop hierarchical navigation
- **`TopMenu`**: Desktop header with user menu and notifications
- **`MobileNavigation`**: Mobile bottom navigation
- **`SideMenuResponsive`**: Responsive wrapper component
- **`ResponsiveLayoutWrapper`**: Main layout orchestrator

#### Component Hierarchy
```
ResponsiveLayoutWrapper
├── SideMenuResponsive
│   ├── TopMenu (Desktop only)
│   ├── SideMenu (Desktop only)
│   └── MobileNavigation (Mobile only)
└── Main Content Area
```

### URL Parameter Strategy

#### Individual Page Navigation
```typescript
// Navigation to cultivation section
router.push('/individual?section=cultivation')

// Navigation to resources section
router.push('/individual?section=resources')
```

#### Local Community Navigation
```typescript
// Navigation to discovery tab
router.push('/local?tab=discover')

// Navigation to resources tab
router.push('/local?tab=resources')

// Navigation to messages tab
router.push('/local?tab=messages')
```

### State Management

#### URL Parameter Handling
```typescript
// Individual page
const searchParams = useSearchParams()
const section = searchParams.get('section') || 'cultivation'

// Local community page
const tab = searchParams.get('tab') || 'home'
```

#### Menu State Management
```typescript
// Side menu state
const [isCollapsed, setIsCollapsed] = useState(false)
const [expandedSections, setExpandedSections] = useState<string[]>([])

// Active navigation tracking
const [activeSection, setActiveSection] = useState('')
const [activeSubsection, setActiveSubsection] = useState('')
```

## 🎨 Design System Integration

### Color Palette
- **Primary**: Olive green (`#3D4A2B`)
- **Secondary**: Dark olive (`#2A331E`)
- **Light**: Light olive (`#5C6B47`)
- **Background**: Glass morphism with gradients
- **Text**: High contrast for accessibility
- **Accents**: Subtle highlights for active states

### Typography
- **Navigation**: `text-base` for readability
- **Hierarchy**: Clear visual distinction between levels
- **Localization**: All text via `t()` function from `sv.json`

### Responsive Breakpoints
- **Desktop**: `lg:` (1024px+) - Side menu
- **Mobile**: `< lg` - Bottom navigation
- **Touch Targets**: Minimum 44px for mobile

## 📱 Mobile-First Considerations

### Touch Optimization
- **Target Size**: 44px minimum for all interactive elements
- **Gesture Support**: Swipe navigation for mobile
- **Performance**: Optimized for mobile networks
- **Accessibility**: Voice-over and screen reader support

### Progressive Enhancement
- **Base**: Functional navigation on all devices
- **Enhanced**: Advanced features on capable devices
- **Fallback**: Graceful degradation for older browsers

## 🔗 Integration Points

### Authentication Flow
- **Login**: Redirects to appropriate section based on user state
- **Session**: Persistent across navigation
- **Logout**: Clean state management and redirect

### Data Loading
- **Lazy Loading**: Components load on demand
- **Caching**: Intelligent data persistence
- **Error Handling**: Graceful failure recovery
- **Offline Support**: Cached navigation structure

### Notification System
- **Real-time Updates**: Live notification center
- **Context Awareness**: Notifications relevant to current section
- **User Preferences**: Customizable notification settings

## 📊 Performance Metrics

### Navigation Speed
- **Initial Load**: < 2s for navigation
- **Route Changes**: < 500ms transitions
- **Memory Usage**: Optimized component lifecycle
- **Bundle Size**: Optimized for production

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Proper focus handling

## 🚀 Future Enhancements

### Planned Features
- **Breadcrumb Navigation**: Enhanced context awareness
- **Search Integration**: Global search across sections
- **Customization**: User-configurable navigation
- **Analytics**: Navigation pattern tracking
- **Deep Linking**: Direct links to specific sections

### Technical Improvements
- **Route Preloading**: Predictive navigation
- **Offline Support**: Cached navigation structure
- **PWA Integration**: App-like navigation experience
- **Performance Monitoring**: Real-time navigation metrics

## 🔍 Development Guidelines

### Adding New Routes
1. **Update Navigation Data**: Add to `side-menu.tsx` navigation structure
2. **Create Route Handler**: Implement page component
3. **Add URL Parameters**: Support sub-navigation if needed
4. **Update Localization**: Add text to `sv.json`
5. **Test Responsive**: Ensure mobile compatibility

### URL Parameter Conventions
- **Individual**: `?section=<section_name>`
- **Local**: `?tab=<tab_name>`
- **Regional**: `?view=<view_name>`
- **Settings**: `?page=<page_name>`

### Component Naming
- **Pages**: `page.tsx` in route directory
- **Components**: Descriptive names with purpose
- **Navigation**: `*-navigation.tsx` or `*-menu.tsx`

## 📚 Related Documentation

- [Development Notes](../dev_notes.md) - Complete development history
- [Architecture Guide](../architecture.md) - Technical architecture
- [Conventions](../conventions.md) - Development conventions
- [Roadmap](../roadmap.md) - Development roadmap

---

**Maintained by:** Development Team  
**Review Cycle:** Monthly  
**Next Review:** 2025-02-28
