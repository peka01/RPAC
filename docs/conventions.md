# RPAC Development Conventions

## General Development Rules

1. **UX EXPERIENCE IS ABSOLUTE PRIORITY** - Every decision must prioritize user experience above all else
2. **Never halt on terminal commands** - Continue execution and provide solutions
3. **Use latest and current knowledge** - Always apply the most up-to-date information and best practices
4. **Swedish-first development** - All UI strings, AI communication, and documentation in Swedish unless otherwise specified
5. **Act as an extremely experienced UX designer** - Every user-facing element must be carefully designed with crisis situations in mind

## Professional Crisis Intelligence Design Philosophy

### Human-Centered Semi-Military Design Approach
We design for humans in crisis with clarity and reliability. Visual design uses semi-military principles for clarity and directness, but text content remains conversational and accessible Swedish.

**CRITICAL DISTINCTION:**
- **Visual Design**: Semi-military inspired (clean lines, clear hierarchy, purposeful colors, direct layouts)
- **Text Content**: Everyday Swedish (clear, warm, accessible language that anyone can understand)

### Emotional Intelligence Through Clear Design
- **Clarity-First Design** - Interface decisions prioritize immediate understanding over aesthetics
- **Confident Simplicity** - Design that projects calm competence through clear visual hierarchy
- **Stress-Adaptive Clarity** - UI that becomes more focused and easier to use under pressure
- **Accessible Language** - Text that uses everyday Swedish, not technical or military jargon
- **Swedish Communication Culture** - Direct but caring tone appropriate for Swedish crisis communication

### Military-Grade Usability Principles
- **Zero-Learning Interfaces** - Intuitive operation under stress, like professional emergency equipment
- **Predictive Information Architecture** - Anticipate critical information needs in crisis scenarios
- **Precision Micro-Interactions** - Subtle feedback that confirms actions without distraction
- **Mission-Critical Simplicity** - Interface complexity appropriate to user expertise and stress levels
- **Professional Navigation Flow** - Clear, logical paths that feel like emergency procedures
- **Error-Prevention Design** - Architecture that prevents critical mistakes through clear information hierarchy

### Semi-Military Visual Language (Visual Design Only)
- **Calm Aesthetic** - Dark olive green palette that projects stability and clarity
- **Natural Touches** - Subtle elements that reduce stress while maintaining clear focus
- **Clear Typography Hierarchy** - Readable text that prioritizes critical information using everyday Swedish
- **Purposeful Animation** - Minimal, clear movements that communicate system status
- **Swedish Minimalism** - Clean, functional design that reduces cognitive load
- **Universal Design** - Accessibility that feels reliable and clear to all users

### Professional Interaction Paradigms
- **Military-Grade Touch Patterns** - Precise interactions that work with gloves and under stress
- **Multi-Modal Professional Interface** - Optimized for touch, voice, and emergency conditions
- **Information-On-Demand Architecture** - Critical data accessible immediately, details available when needed
- **Team Coordination Interface** - UI optimized for emergency team collaboration
- **Cross-Platform Mission Continuity** - Seamless operation across all devices during crisis
- **Offline-First Professional Experience** - Full capability without network dependency

### Crisis Psychology Foundations
- **Cognitive Load Optimization** - Information hierarchy that preserves mental capacity for decision-making
- **Stress-Validated Design** - Patterns tested under actual emergency conditions
- **Community Resilience Integration** - Interfaces that build social preparedness networks
- **Decision Support Architecture** - Clear options that reduce fatigue and improve outcomes
- **Professional Trauma-Awareness** - Design that maintains dignity and control during vulnerability
- **Mission-Focus Optimization** - Interactions that maintain concentration on critical tasks

### 📱 Mobile UX Standards - MANDATORY

**All mobile development MUST follow:** `docs/MOBILE_UX_STANDARDS.md`

This comprehensive guide establishes best-in-class mobile patterns that rival top consumer apps (Instagram, Apple Health, Spotify). It represents the gold standard for mobile development in RPAC.

**Key Requirements:**
- **Separate mobile components** (not responsive CSS)
- **Responsive wrapper pattern** at 768px breakpoint
- **44px+ touch targets** (48px+ preferred)
- **60fps animations** (hardware-accelerated)
- **Fixed positioning:** `bottom-16` for buttons, `pb-32` for content
- **Bottom sheet modals** with backdrop blur
- **Hero headers** with gradients and stats
- **Consistent color psychology** across all mobile screens

**Reference these exemplary components:**
- `individual-mobile-nav.tsx` - Navigation patterns
- `personal-dashboard-mobile.tsx` - Score displays, stat cards
- `cultivation-reminders-mobile.tsx` - CRUD, modals
- `crisis-cultivation-mobile.tsx` - Multi-step wizards
- `plant-diagnosis-mobile.tsx` - Camera, AI chat

See complete documentation: `docs/MOBILE_UX_STANDARDS.md`

---

### Military-Grade Color Palette
- **Primary Olive Green**: `#3D4A2B` - Main actions, navigation, primary elements
- **Dark Olive**: `#2A331E` - Hover states, active elements, emphasis
- **Light Olive**: `#5C6B47` - Secondary elements, borders, dividers
- **Olive Gray**: `#4A5239` - Background elements, cards, containers
- **Muted Olive**: `#707C5F` - Text, icons, subtle elements
- **Accent Colors**: Minimal use of muted amber `#B8860B` for warnings, muted red `#8B4513` for critical states

### Professional Status Communication
- **Authority-Building Indicators** - Visual cues that communicate competence and reliability
- **Community Readiness Metrics** - Professional-grade community health visualization
- **Achievement Recognition** - Subtle acknowledgment of preparedness milestones
- **Clear Uncertainty Communication** - Professional honesty about unknowns and limitations
- **Information Hierarchy Excellence** - Critical data always prioritized and accessible

## Language and Tone of Voice

### ⚠️ FUNDAMENTAL PRINCIPLE: ALL TEXT MUST BE IN JSON
**MANDATORY**: Every single user-facing text string MUST be in the localization JSON file and accessed via `t()` function. No exceptions.

- **NO hardcoded Swedish text** - Every string must be editable via `/lib/locales/sv.json`
- **Use `t('key.name')` for all text** - Including placeholders, error messages, status text, everything
- **Audit regularly** - Check codebase for Swedish characters (åäöÅÄÖ) outside of JSON files
- **Test international readiness** - All text must be translatable without code changes
- **CLEAN UP JSON** - Remove unused strings when refactoring or changing features
- **ZERO TOLERANCE** - Any hardcoded Swedish text is a critical bug that must be fixed immediately

### Swedish Language Requirements
- **Primary language**: Swedish for all user-facing content
- **Fallback**: English only for external connectors or technical fallbacks
- **Crisis-adapted tone**: Clear, empathetic, and reassuring communication suitable for emergency situations
- **Localized text integration**: All placeholder strings must be replaced with proper Swedish translations

### Crisis Communication Tone Guidelines
**IMPORTANT**: Text content should NEVER use military terminology or jargon. Use everyday Swedish.

- **Clarity**: Use simple, everyday Swedish that's easy to understand under stress
- **Warmth**: Show understanding and support in all messages - be human, not institutional
- **Reassurance**: Provide confidence through clear, helpful language
- **Action-oriented**: Focus on practical steps using normal Swedish words
- **Calm clarity**: Sound helpful and trustworthy using accessible language
- **Immediate comprehension**: Messages must be understood instantly by anyone, using familiar words

**Examples of Good vs. Bad Text:**
- ✅ Good: "Laddar ditt hem" (Loading your home)
- ❌ Bad: "Initialiserar beredskapssystem" (Initializing preparedness system)
- ✅ Good: "Hämtar din information" (Fetching your information)  
- ❌ Bad: "Laddar operativ databas" (Loading operational database)

### Swedish Technical Terms
- Use proper Swedish technical terminology
- Maintain consistency across all modules
- Adapt English technical terms to Swedish when appropriate
- Use Swedish measurements (meter, liter, kilogram)
- Crisis-specific vocabulary: "krisläge", "beredskap", "ömsesidig hjälp", "samhällsstöd"

## Architecture Principles

- **Offline-first design** in all components
- **Swedish cultural adaptation** for all content
- **Crisis-ready technology** that works when infrastructure fails
- **Modular code** for future integration
- **Privacy defaults** with user control

## Development Workflow

1. **UX-First Planning** - Always start with user needs and experience before technical implementation
2. Always load `/docs/charter.md`, `/docs/architecture.md`, and `/docs/roadmap.md` for context
3. **Check current Sprint priorities** from roadmap.md before starting new work
4. Use Swedish in variable names and UI where possible
5. Document all new features in `/docs/dev_notes.md`
6. Test offline functionality thoroughly
7. **CRITICAL**: Ensure text uses everyday Swedish - NO military jargon in user-facing text

## Visual vs. Text Design Principles

### ✅ **Visual Design**: Semi-Military Inspired
- Clean, direct layouts
- Clear visual hierarchy
- Purposeful olive green color scheme
- Minimal, focused animations
- Professional spacing and typography

### ✅ **Text Content**: Everyday Swedish
- Use words any Swedish person understands immediately
- Warm, helpful tone (not cold or institutional)
- Clear, simple instructions
- Familiar terminology from daily life
- Human-centered language

### ❌ **NEVER DO**: Military Text Content
- Don't use: "operativ", "system", "databas", "initialisera"
- Don't use: "beredskapssystem", "taktisk", "mission"
- Don't use: formal/institutional language
- Don't sound like a government agency or military system

## PROVEN SUCCESS PATTERNS - USE THESE! ⭐️

**BREAKTHROUGH ACHIEVED**: Perfect balance of tone, visual appearance, and hard/easy UI elements!

### ✅ Proven Design Patterns That Work
- **Emoji Section Headers** (🏠🌱🛠️📚) - Instantly recognizable, reduces cognitive load
- **Card-based Progressive Disclosure** - Summary → Detail, works perfectly for crisis UX
- **Dashboard → Individual → Settings** - Logical information architecture that users understand immediately
- **Seasonal Color Coding** - Visual cues that feel natural and reduce stress
- **Everyday Swedish + Semi-Military Visual** - Perfect balance of approachable and professional

### ✅ Proven Technical Patterns
- **useUserProfile Hook** - Centralized profile management with localStorage fallback
- **t() Localization** - All text externalized, makes maintenance and translation effortless
- **Component Key Props** - Prevents React re-mounting and UI flashing
- **Smart useEffect Dependencies** - Performance optimization that actually works
- **Location-based Personalization** - Profile data enhances every feature contextually
- **URL Parameter Handling** - useSearchParams for direct navigation to specific sections
- **Dual Storage Strategy** - Supabase + localStorage for offline capability and performance
- **AI Error Recovery** - Graceful fallbacks when AI services are unavailable
- **Backward Compatibility** - Support for legacy data formats during system evolution

### ✅ Proven Content Organization
- **Hemöversikt First** - Personal dashboard at top of Individual page feels right
- **Cultivation as Core Feature** - Self-sufficiency tools are central to RPAC mission
- **Progressive Tool Complexity** - Simple summary cards → detailed management tools
- **Clear Visual Hierarchy** - h2 for main sections, h3 for subsections, proper spacing

### ✅ User Experience Breakthroughs
- **Crisis-Ready but Warm** - Professional capability without coldness
- **Zero Learning Curve** - Intuitive navigation through emoji and clear structure
- **Stress-Adaptive** - Information hierarchy that works under pressure
- **Swedish Communication Culture** - Direct but caring tone that builds confidence

### ✅ Enhanced Cultivation Planning Patterns (NEW)
- **5-Step Progressive Flow** - Profile → Nutrition → Crops → Plan → Gaps analysis
- **Real-time Calculations** - Live updates of space, cost, and nutrition as users adjust
- **AI-Powered Personalization** - OpenAI GPT-4 integration for contextual recommendations
- **Plan Management System** - Save, load, edit, and delete multiple named plans
- **Crop Amount Controls** - Dynamic quantity adjustment with immediate feedback
- **Gap Analysis Intelligence** - AI-driven identification of nutritional needs and grocery recommendations
- **URL Parameter Navigation** - Direct links to specific planning sections for bookmarking and sharing

**MANDATE**: Use these proven patterns for all future development. They work!

## Current Development Priorities

Aktuella roadmap-fokusområden:
- **Kommunikationssystem** ✅ - Real-time meddelanden och extern kommunikation
- **Odlingskalender & Planering** ✅ - COMPLETED and PERFECTED! 
- **Supabase-migrering** - Från localStorage till produktion
- **AI-integration** - Riktig GPT-4 och Computer Vision

Se `/docs/roadmap.md` för detaljerad prioriteringsplanering.

## Revolutionary UX Validation Framework

### The Crisis-Moment Design Test
Before shipping ANY feature, validate against these human-centered criteria:

#### Emotional Intelligence Validation
- [ ] **Does this make a scared person feel more capable and less alone?**
- [ ] **Would this interface work for someone's grandmother during a power outage?**
- [ ] **Does this reduce anxiety rather than create it?**
- [ ] **Is the emotional tone appropriate for Swedish crisis communication culture?**
- [ ] **Does this build community connection rather than technological dependence?**
- [ ] **Does ALL text use everyday Swedish that anyone can understand immediately?**
- [ ] **Is the language warm and human, not cold or institutional?**

#### Breakthrough Usability Standards
- [ ] **Can this be used successfully by someone who's never seen it before, within 10 seconds?**
- [ ] **Does this work perfectly with one hand, in the dark, while stressed?**
- [ ] **Is every micro-interaction delightful rather than just functional?**
- [ ] **Does this anticipate user needs before they're expressed?**
- [ ] **Is the cognitive load so low it feels effortless?**

#### Next-Generation Accessibility
- [ ] **Does this work better for disabled users than most "normal" interfaces?**
- [ ] **Is this usable across all ages, abilities, and technical skill levels?**
- [ ] **Does this interface improve with assistive technologies rather than just tolerate them?**
- [ ] **Are we leading accessibility innovation, not just meeting compliance?**

#### Future-Ready Interaction Design
- [ ] **Is this optimized for voice, touch, and gesture interaction?**
- [ ] **Does this work seamlessly across all device sizes and contexts?**
- [ ] **Is the offline experience superior to most online experiences?**
- [ ] **Does this contribute to current development priorities while pushing UX boundaries?**

### UX Excellence Red Flags - STOP and Revolutionize If:

#### Fundamental Design Failures
- **Cognitive burden exists** - Users thinking about interface instead of their goals
- **Stress amplification** - Design that increases rather than reduces anxiety
- **Cultural tone-deafness** - Not feeling authentically Swedish and crisis-appropriate
- **Accessibility afterthought** - Universal design not baked into core experience
- **Information overwhelm** - Too much data without intelligent prioritization

#### Interaction Design Mediocrity
- **Multi-step common actions** - Critical tasks requiring more than one intuitive action
- **Hidden capabilities** - Important features not discoverable through natural exploration
- **Inconsistent mental models** - Same concepts behaving differently across contexts
- **Feedback gaps** - User actions without immediate, clear, and emotionally appropriate responses
- **Emergency failure** - Any critical function that doesn't work under stress/offline conditions

#### Future-Backwards Thinking
- **Device-specific limitations** - Experiences that don't transcend platform boundaries
- **Static information architecture** - Content that doesn't adapt to context and user needs
- **Community isolation** - Individual-focused design that doesn't strengthen social connections
- **Technical exposure** - Users forced to understand system complexity rather than human goals

### The RPAC UX Excellence Standard
*"Every interaction should feel like having a wise, calm, technically capable friend helping during your most challenging moments."*

Our UX success metric isn't usability compliance—it's **human empowerment during crisis**.

## Språkstandarder

- **Primärspråk**: Svenska
- **Fallback**: Engelska
- **Internationalisering**: Använd `t()` funktionen
- **Filstruktur**: `/lib/locales/sv.json`

### Svenska Språkregler
- **Versaler**: Endast första ordet i en mening får stor bokstav
- **Titlar**: Inte som engelska - "Taktisk kommunikation" (INTE "Taktisk Kommunikation") 
- **Knappar**: "Begär assistans" (INTE "Begär Assistans")
- **Rubriker**: "Operationell status" (INTE "Operationell Status")
- **Undantag**: Egennamn och akronymer (RPAC, Stockholm)
- **Exempel**: 
  - ✅ "Externa kommunikationslänkar"
  - ❌ "Externa Kommunikationslänkar"
  - ✅ "Systemintegritet och övervakning"
  - ❌ "Systemintegritet Och Övervakning"
