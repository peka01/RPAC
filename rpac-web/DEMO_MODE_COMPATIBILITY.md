# RPAC Demo Mode Compatibility Guide

## 🎯 **Overview**

This guide ensures that the demo version of RPAC continues to work seamlessly during the Supabase migration process. The demo mode system provides a smooth transition path while maintaining full functionality.

## 🔧 **Demo Mode System**

### **How Demo Mode Works:**

1. **Environment-Based Control**
   ```env
   # .env.local
   NEXT_PUBLIC_DEMO_MODE=true   # Enable demo mode
   NEXT_PUBLIC_DEMO_MODE=false  # Disable demo mode (use Supabase)
   ```

2. **Automatic Fallback**
   - If Supabase is not configured → Automatically falls back to demo mode
   - If Supabase connection fails → Falls back to demo mode
   - If user chooses demo mode → Uses localStorage

3. **User Preference Storage**
   - User choice is stored in localStorage
   - Persists across browser sessions
   - Can be changed at any time

## 📋 **Demo Mode Features**

### ✅ **What Works in Demo Mode:**

- **Complete Cultivation System**
  - Cultivation calendar with Swedish climate zones
  - Garden planning and layout tools
  - Cultivation reminders and notifications
  - Crisis cultivation planning
  - Nutrition calculations
  - AI cultivation advisor (mock)

- **Resource Management**
  - MSB-recommended resources
  - User-added resources
  - Resource inventory tracking
  - Expiration date management

- **Community Features**
  - Local community creation
  - Help requests and sharing
  - Messaging system (demo data)

- **User Profiles**
  - Complete profile management
  - Location and climate settings
  - Garden size and experience level
  - Growing preferences

- **All UI Components**
  - Dashboard with real-time updates
  - Individual planning tools
  - Community hub
  - External communication
  - Plant diagnosis (mock)

### 🔄 **Data Persistence:**

- **localStorage**: All data saved locally
- **Cross-session**: Data persists between browser sessions
- **Export/Import**: Can export data for backup
- **Migration Ready**: Easy migration to Supabase when ready

## 🚀 **Migration Path**

### **Phase 1: Demo Mode (Current)**
```typescript
// Demo mode configuration
const demoMode = {
  enabled: true,
  useLocalStorage: true,
  useSupabase: false,
  showMigrationWizard: false
};
```

### **Phase 2: Migration Available**
```typescript
// When Supabase is configured
const demoMode = {
  enabled: true,
  useLocalStorage: true,
  useSupabase: true,
  showMigrationWizard: true  // Shows migration option
};
```

### **Phase 3: Production Mode**
```typescript
// After migration
const demoMode = {
  enabled: false,
  useLocalStorage: false,
  useSupabase: true,
  showMigrationWizard: false
};
```

## 🛠️ **Implementation Details**

### **Demo Mode Manager**

```typescript
import { demoMode } from '@/lib/demo-mode';

// Check if demo mode is enabled
if (demoMode.isDemoMode()) {
  // Use localStorage
  const data = demoMode.getDemoData('resources', userId);
} else {
  // Use Supabase
  const { data } = await supabase.from('resources').select('*');
}
```

### **Component Integration**

```typescript
// In any component
const { shouldUseLocalStorage, shouldUseSupabase } = demoMode.getConfig();

if (shouldUseLocalStorage) {
  // Load from localStorage
  const resources = demoMode.getDemoData('rpac-demo-resources');
} else if (shouldUseSupabase) {
  // Load from Supabase
  const { data: resources } = await supabase
    .from('resources')
    .select('*');
}
```

### **Migration Wizard Integration**

```typescript
// Show migration wizard when appropriate
if (demoMode.shouldShowMigrationWizard()) {
  return <MigrationWizard user={user} onComplete={handleMigration} />;
}
```

## 🔒 **Data Safety**

### **Demo Mode Data Protection:**

1. **No Data Loss**
   - All demo data is preserved
   - Migration is optional
   - Can switch back to demo mode anytime

2. **Backup Options**
   - Export localStorage data
   - Manual backup before migration
   - Rollback capability

3. **Validation**
   - Data integrity checks
   - Migration validation
   - Error handling and recovery

## 🧪 **Testing Demo Mode**

### **Test Scenarios:**

1. **Fresh Installation**
   ```bash
   # Set demo mode
   NEXT_PUBLIC_DEMO_MODE=true
   npm run dev
   # Should work with localStorage
   ```

2. **Supabase Available**
   ```bash
   # Set demo mode with Supabase configured
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   npm run dev
   # Should show migration wizard
   ```

3. **Production Mode**
   ```bash
   # Disable demo mode
   NEXT_PUBLIC_DEMO_MODE=false
   npm run dev
   # Should use Supabase only
   ```

### **Verification Checklist:**

- [ ] Demo mode loads with localStorage
- [ ] All cultivation features work
- [ ] Data persists between sessions
- [ ] Migration wizard appears when appropriate
- [ ] Can switch between modes
- [ ] No data loss during transitions
- [ ] Fallback works when Supabase unavailable

## 🎛️ **Configuration Options**

### **Environment Variables:**

```env
# Demo Mode Control
NEXT_PUBLIC_DEMO_MODE=true          # Enable/disable demo mode
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase key

# Auto-fallback behavior
NEXT_PUBLIC_FALLBACK_TO_DEMO=true   # Fallback to demo if Supabase fails
```

### **Runtime Configuration:**

```typescript
// Programmatically control demo mode
demoMode.enableDemoMode();   // Switch to demo
demoMode.disableDemoMode();  // Switch to Supabase
demoMode.refreshConfig();    // Reload configuration
```

## 📊 **Demo Mode Status**

### **Status Indicators:**

```typescript
const status = demoMode.getStatusInfo();
// Returns:
// {
//   mode: 'demo' | 'production' | 'fallback',
//   message: 'Demo-läge aktiverat',
//   canMigrate: true,
//   showWarning: false
// }
```

### **UI Integration:**

```tsx
// Show demo mode status in UI
const status = demoMode.getStatusInfo();

{status.mode === 'demo' && (
  <div className="demo-mode-indicator">
    <span>Demo-läge: Data sparas lokalt</span>
    {status.canMigrate && (
      <button onClick={showMigrationWizard}>
        Migrera till Supabase
      </button>
    )}
  </div>
)}
```

## 🔄 **Migration Process**

### **User Experience:**

1. **Demo Mode Active**
   - User sees "Demo-läge" indicator
   - All features work normally
   - Data saved to localStorage

2. **Migration Available**
   - Migration wizard appears
   - User can choose to migrate
   - Data is transferred to Supabase

3. **Production Mode**
   - Demo mode indicator disappears
   - All data from Supabase
   - Real-time features enabled

### **Data Migration:**

```typescript
// Migration process
const migrationService = createMigrationService(user);
const results = await migrationService.migrateAllData();

// Results include:
// - User profile migration
// - Resources migration
// - Cultivation data migration
// - Community data migration
// - localStorage cleanup
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Demo Mode Not Working**
   ```bash
   # Check environment variables
   echo $NEXT_PUBLIC_DEMO_MODE
   
   # Check localStorage
   localStorage.getItem('rpac-demo-mode')
   ```

2. **Migration Wizard Not Showing**
   ```bash
   # Verify Supabase configuration
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Data Not Persisting**
   ```bash
   # Check localStorage permissions
   # Verify browser storage limits
   # Check for localStorage errors
   ```

### **Debug Mode:**

```typescript
// Enable debug logging
console.log('Demo Mode Config:', demoMode.getConfig());
console.log('Demo Mode Status:', demoMode.getStatusInfo());
console.log('Available Keys:', demoMode.getAllDemoDataKeys());
```

## 🎉 **Benefits**

### **For Development:**
- ✅ No database setup required
- ✅ Instant development environment
- ✅ Full feature testing
- ✅ Easy debugging

### **For Users:**
- ✅ Immediate access to all features
- ✅ No account creation required
- ✅ Data privacy (local storage)
- ✅ Smooth migration path

### **For Production:**
- ✅ Gradual rollout capability
- ✅ A/B testing support
- ✅ Fallback reliability
- ✅ User choice preservation

---

**Demo mode ensures RPAC works perfectly in all scenarios while providing a smooth path to production! 🚀**
