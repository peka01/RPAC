# RPAC Database Setup Guide

**Date:** 2025-10-23  
**Status:** Production Ready  
**Version:** 2.0

## 📋 Overview

This guide provides comprehensive instructions for setting up and maintaining the RPAC database infrastructure. The database uses Supabase (PostgreSQL) with Row Level Security (RLS) policies and real-time capabilities.

## 🗄️ Database Architecture

### Core Tables
- **user_profiles**: User information and preferences
- **communities**: Local community groups
- **community_memberships**: User-community relationships
- **resources**: Individual resource inventory
- **resource_sharing**: Community resource sharing
- **resource_requests**: Help requests and assistance
- **messages**: Real-time messaging system
- **cultivation_plans**: AI-generated cultivation plans
- **notifications**: System notifications

### Security Model
- **Row Level Security (RLS)**: All tables protected with RLS policies
- **Foreign Key Constraints**: Proper referential integrity
- **Authentication**: Supabase Auth integration
- **Role-based Access**: Creator/Admin/Member permissions

## 🚀 Quick Start

### 1. Supabase Project Setup
```bash
# Create new Supabase project
# Go to https://supabase.com/dashboard
# Create new project: "rpac-production"
# Note down: Project URL, anon key, service role key
```

### 2. Environment Configuration
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Schema Deployment
```bash
# Run the complete schema
psql -h your_db_host -U postgres -d postgres -f rpac-web/database/supabase-schema-complete.sql
```

## 📊 Schema Details

### User Management
```sql
-- User profiles with location data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR(100),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Community System
```sql
-- Communities with geographic data
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Resource Management
```sql
-- Individual resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  quantity INTEGER,
  unit VARCHAR(20),
  expiry_date DATE,
  is_shareable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Security Implementation

### RLS Policies
All tables have comprehensive RLS policies:

```sql
-- Example: User can only see their own resources
CREATE POLICY "Users can view own resources" ON resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resources" ON resources
  FOR UPDATE USING (auth.uid() = user_id);
```

### Authentication Functions
```sql
-- Get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔄 Migration Strategy

### From localStorage to Supabase
1. **Data Export**: Export existing localStorage data
2. **Schema Validation**: Ensure all tables exist
3. **Data Import**: Migrate user data to Supabase
4. **RLS Testing**: Verify security policies work
5. **Real-time Setup**: Configure real-time subscriptions

### Migration Scripts
```bash
# Run migrations in order
psql -f database/add-user-profiles.sql
psql -f database/add-communities.sql
psql -f database/add-resources.sql
psql -f database/add-messaging.sql
```

## 🛠️ Maintenance

### Regular Tasks
- **Backup Verification**: Weekly automated backups
- **Performance Monitoring**: Query performance analysis
- **Security Audits**: RLS policy verification
- **Data Cleanup**: Remove obsolete records

### Monitoring Queries
```sql
-- Check active users
SELECT COUNT(*) FROM user_profiles 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Check resource sharing activity
SELECT COUNT(*) FROM resource_sharing 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Check community growth
SELECT COUNT(*) FROM communities 
WHERE created_at > NOW() - INTERVAL '30 days';
```

## 🚨 Troubleshooting

### Common Issues

#### RLS Policy Errors
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Disable RLS temporarily for debugging
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

#### Authentication Issues
```sql
-- Check user authentication
SELECT auth.uid(), auth.role();

-- Verify user exists
SELECT * FROM auth.users WHERE id = auth.uid();
```

#### Real-time Connection Issues
- Check Supabase project status
- Verify API keys are correct
- Test connection with simple query
- Check browser console for errors

### Performance Optimization

#### Index Management
```sql
-- Add indexes for common queries
CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_communities_postal_code ON communities(postal_code);
```

#### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for slow queries
EXPLAIN ANALYZE SELECT * FROM resources 
WHERE user_id = auth.uid() AND category = 'food';
```

## 📈 Scaling Considerations

### Current Limits
- **Users**: 1,000+ concurrent users
- **Communities**: 100+ active communities
- **Resources**: 10,000+ resources per community
- **Messages**: Real-time messaging for 50+ users

### Future Scaling
- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: PgBouncer for connection management
- **Caching**: Redis for frequently accessed data
- **CDN**: Static asset optimization

## 🔐 Security Best Practices

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **Access Control**: Principle of least privilege
- **Audit Logging**: Track all data modifications
- **GDPR Compliance**: User data deletion capabilities

### API Security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **CORS Configuration**: Restrict cross-origin requests
- **Authentication**: JWT token validation

## 📚 Additional Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

### Support
- **Database Issues**: Check Supabase status page
- **Performance**: Use Supabase dashboard metrics
- **Security**: Review RLS policies regularly
- **Backups**: Verify automated backup completion

---

**Last Updated:** 2025-10-23  
**Maintained By:** RPAC Development Team  
**Status:** Production Ready ✅
