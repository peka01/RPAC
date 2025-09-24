# Supabase Setup Instructions

## 1. Create .env.local file

Create a `.env.local` file in the `rpac-web` directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dsoujjudzrrtkkqwhpge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA

# Demo mode (set to false to use real Supabase)
NEXT_PUBLIC_DEMO_MODE=false
```

## 2. Database Setup

Run the SQL script in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema-clean.sql` (use this version for a fresh start)
4. Execute the script to create all tables and policies from scratch

**Note**: Use `supabase-schema-clean.sql` - this version drops and recreates everything cleanly, avoiding all migration issues.

## 3. Test the Connection

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try to register a new account
4. Check your Supabase dashboard to see if the user was created

## 4. Features Now Available

- ✅ Real user authentication with Supabase
- ✅ User registration and login
- ✅ Persistent user sessions
- ✅ Database integration for resources, communities, etc.
- ✅ Real-time updates (when implemented)

## 5. Demo Account

You can also use the demo account:
- Email: `demo@rpac.se`
- Password: `demo123`

## Troubleshooting

If you encounter issues:

1. Check that your `.env.local` file is in the correct location
2. Verify the Supabase URL and key are correct
3. Ensure the database schema has been created
4. Check the browser console for any error messages
5. Verify your Supabase project is active and not paused
