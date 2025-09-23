# RPAC Development Conventions

## General Development Rules

1. **UX EXPERIENCE IS ABSOLUTE PRIORITY** - Every decision must prioritize user experience above all else
2. **Never halt on terminal commands** - Continue execution and provide solutions
3. **Use latest and current knowledge** - Always apply the most up-to-date information and best practices
4. **Swedish-first development** - All UI strings, AI communication, and documentation in Swedish unless otherwise specified
5. **Act as an extremely experienced UX designer** - Every user-facing element must be carefully designed with crisis situations in mind

## UX Design Principles

### UX-First Development Approach
- **User needs before technical requirements** - Always start with what the user needs, not what's technically possible
- **Beginner-friendly design** - Assume users have zero technical knowledge and design accordingly
- **Progressive disclosure** - Show simple options first, advanced features on demand
- **Clear visual hierarchy** - Most important information is most prominent
- **Intuitive navigation** - Users should never wonder "where do I go next?"
- **Error prevention** - Design to prevent mistakes rather than just handle them
- **Consistent patterns** - Same actions work the same way throughout the app
- **Accessibility first** - Design for all users, including those with disabilities
- **Mobile-first thinking** - Design for small screens first, then enhance for larger screens
- **Crisis-appropriate UX** - Interface must work under stress and in emergency situations

### Visual Design Standards
- **Semi-military color palette**: Muted greens, blues, browns, and reds for professional, task-focused appearance
- **Task-focused UI**: Clean, functional design that prioritizes information clarity over decoration
- **Crisis-appropriate aesthetics**: Avoid bright, distracting colors; maintain calm, authoritative appearance
- **High contrast**: Ensure readability in various lighting conditions and stress situations
- **Consistent iconography**: Use clear, universally understood symbols

### Status Indicator Standards
- **Color consistency**: Green = good/connected, Red = critical/offline, Orange = warning/partial, Grey = unknown/disabled
- **Visual clarity**: Status indicators must match their text labels (no green dots for "offline" states)
- **Crisis communication**: Status messages must be immediately understandable under stress
- **Hierarchical information**: Most critical information prominently displayed

### Layout and Information Architecture
- **Card-based design**: Group related information in clear, bordered sections
- **Progressive disclosure**: Show essential information first, details on demand
- **Touch-friendly**: Adequate spacing and button sizes for mobile use
- **Offline-first indicators**: Clear visual cues about connectivity and functionality status

## Language and Tone of Voice

### Swedish Language Requirements
- **Primary language**: Swedish for all user-facing content
- **Fallback**: English only for external connectors or technical fallbacks
- **Crisis-adapted tone**: Clear, empathetic, and reassuring communication suitable for emergency situations
- **Localized text integration**: All placeholder strings must be replaced with proper Swedish translations

### Crisis Communication Tone Guidelines
- **Clarity**: Use simple, direct language that's easy to understand under stress
- **Empathy**: Show understanding and support in all messages
- **Reassurance**: Provide confidence and hope while being realistic
- **Action-oriented**: Focus on practical steps and solutions
- **Calm authority**: Sound knowledgeable and trustworthy without being alarmist
- **Immediate comprehension**: Messages must be understood instantly, even under duress

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
2. Always load `/docs/charter.md` and `/docs/architecture.md` for context
3. Use Swedish in variable names and UI where possible
4. Document all new features in `/docs/dev_notes.md`
5. Test offline functionality thoroughly
6. Ensure crisis-appropriate messaging throughout

## UX Validation Checklist

Before implementing any new feature, ask:
- [ ] **Is this intuitive for a complete beginner?**
- [ ] **Does this work under stress/emergency conditions?**
- [ ] **Is the visual hierarchy clear and logical?**
- [ ] **Are error states handled gracefully?**
- [ ] **Is the Swedish text natural and crisis-appropriate?**
- [ ] **Does this follow established patterns in the app?**
- [ ] **Is this accessible to users with disabilities?**
- [ ] **Does this work on mobile devices?**
- [ ] **Are loading states and feedback clear?**
- [ ] **Is the user's next action obvious?**

## UX Red Flags - STOP and Redesign If:
- User has to read documentation to understand the interface
- More than 3 clicks to complete a common task
- Technical jargon in user-facing text
- No clear visual feedback for user actions
- Inconsistent styling or behavior
- Hidden or hard-to-find important features
- Confusing error messages
- No offline fallback for critical functions
