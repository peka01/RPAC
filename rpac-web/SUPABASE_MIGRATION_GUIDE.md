# RPAC Supabase Migration Guide

## 🎯 **Migration Overview**

This guide will help you migrate RPAC from localStorage to Supabase for production-ready data persistence, real-time updates, and better scalability.

## 📋 **Prerequisites**

- ✅ Supabase project created
- ✅ Environment variables configured
- ✅ Database schema ready
- ✅ Migration scripts created

## 🚀 **Step-by-Step Migration Process**

### **Step 1: Database Setup**

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com/dashboard
   # Create new project: "rpac-web"
   # Choose region: Stockholm (for Swedish users)
   # Set strong database password
   ```

2. **Run Database Schema**
   ```sql
   -- Copy and paste the entire content of supabase-schema-complete.sql
   -- into Supabase SQL Editor and execute
   ```

3. **Verify Tables Created**
   ```sql
   -- Check that all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### **Step 2: Environment Configuration**

1. **Update .env.local**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Migration Mode (set to false to enable Supabase)
   NEXT_PUBLIC_DEMO_MODE=false
   ```

2. **Get Supabase Credentials**
   - Go to Supabase Dashboard → Settings → API
   - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Step 3: Test Database Connection**

1. **Start Development Server**
   ```bash
   cd rpac-web
   npm run dev
   ```

2. **Test Authentication**
   - Go to `http://localhost:3000`
   - Try to register a new account
   - Check Supabase Dashboard → Authentication → Users

3. **Verify Database Integration**
   - Check Supabase Dashboard → Table Editor
   - Verify data is being inserted correctly

### **Step 4: Enable Migration Wizard**

1. **Add Migration Component**
   ```tsx
   // In your main layout or dashboard component
   import { MigrationWizard } from '@/components/migration-wizard';
   
   // Add after user authentication
   <MigrationWizard 
     user={user} 
     onMigrationComplete={() => {
       // Refresh data or show success message
     }} 
   />
   ```

2. **Test Migration Process**
   - Login with existing demo user
   - Migration wizard should appear automatically
   - Follow the migration steps

### **Step 5: Update Components**

1. **Replace localStorage with Supabase**
   ```tsx
   // Before (localStorage)
   const savedData = localStorage.getItem('key');
   
   // After (Supabase)
   const { data, error } = await supabase
     .from('table_name')
     .select('*')
     .eq('user_id', user.id);
   ```

2. **Update Service Functions**
   - Use existing service functions in `src/lib/supabase.ts`
   - Replace localStorage calls with Supabase queries
   - Add proper error handling

### **Step 6: Real-time Features**

1. **Enable Real-time Subscriptions**
   ```tsx
   // Example: Real-time resource updates
   useEffect(() => {
     const subscription = supabase
       .channel('resources')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'resources' },
         (payload) => {
           // Update UI with new data
           setResources(prev => [...prev, payload.new]);
         }
       )
       .subscribe();
   
     return () => subscription.unsubscribe();
   }, []);
   ```

2. **Test Real-time Updates**
   - Open app in two browser tabs
   - Make changes in one tab
   - Verify updates appear in other tab

## 🔧 **Migration Components**

### **Files Created/Updated:**

1. **Database Schema**
   - `supabase-schema-complete.sql` - Complete database schema
   - Includes all cultivation, community, and messaging tables

2. **Migration Service**
   - `src/lib/migration-service.ts` - Handles data migration
   - `src/components/migration-wizard.tsx` - User-friendly migration UI

3. **Updated Locales**
   - `src/lib/locales/sv.json` - Added migration translations

### **Key Features:**

- ✅ **Complete Schema**: All cultivation, community, and messaging tables
- ✅ **Row Level Security**: User data isolation and security
- ✅ **Real-time Updates**: Live data synchronization
- ✅ **Migration Wizard**: User-friendly data transfer
- ✅ **Error Handling**: Robust error handling and rollback
- ✅ **Swedish Localization**: All UI text in Swedish

## 🧪 **Testing Checklist**

### **Database Tests**
- [ ] All tables created successfully
- [ ] RLS policies working correctly
- [ ] Triggers and functions operational
- [ ] Indexes created for performance

### **Authentication Tests**
- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Session persistence works

### **Migration Tests**
- [ ] Migration wizard appears for users with localStorage data
- [ ] All data types migrate correctly
- [ ] No data loss during migration
- [ ] localStorage cleanup works

### **Component Tests**
- [ ] User profiles load from Supabase
- [ ] Resources load from Supabase
- [ ] Cultivation data loads from Supabase
- [ ] Community data loads from Supabase
- [ ] Real-time updates work

### **Performance Tests**
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] Real-time updates responsive
- [ ] No memory leaks

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Invalid API key" Error**
   ```bash
   # Check .env.local file
   # Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
   # Ensure no extra spaces or quotes
   ```

2. **"Failed to fetch" Error**
   ```bash
   # Check NEXT_PUBLIC_SUPABASE_URL
   # Verify Supabase project is active
   # Check network connectivity
   ```

3. **"Row Level Security" Error**
   ```bash
   # Verify RLS policies are created
   # Check user authentication status
   # Ensure user_id matches in queries
   ```

4. **Migration Fails**
   ```bash
   # Check browser console for errors
   # Verify localStorage data format
   # Check Supabase connection
   ```

### **Debug Mode**

Enable debug logging:
```tsx
// In supabase.ts
const supabase = createClient(
  config.supabase.url, 
  config.supabase.anonKey,
  {
    auth: {
      debug: true
    }
  }
);
```

## 📊 **Migration Status Tracking**

### **Current Progress:**
- ✅ **Database Schema**: Complete
- ✅ **Migration Scripts**: Complete  
- ✅ **Migration Wizard**: Complete
- 🔄 **Auth Integration**: In Progress
- ⏳ **Component Updates**: Pending
- ⏳ **Real-time Features**: Pending
- ⏳ **Testing**: Pending

### **Next Steps:**
1. **Complete Auth Integration** - Update auth components to use Supabase
2. **Update Components** - Replace localStorage with Supabase calls
3. **Implement Real-time** - Add live data synchronization
4. **Comprehensive Testing** - Test all features end-to-end
5. **Production Deployment** - Deploy to production environment

## 🎉 **Success Criteria**

Migration is complete when:
- ✅ All user data migrates successfully
- ✅ Real-time updates work across devices
- ✅ Performance is equal or better than localStorage
- ✅ No data loss occurs
- ✅ All features work as expected
- ✅ Users can seamlessly continue using the app

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for errors
4. Verify environment variables
5. Test with a fresh Supabase project

---

**Ready to migrate? Let's get your RPAC data into Supabase! 🚀**
