# Supabase Authentication Setup Guide

This guide explains how to set up Supabase for the Visual Matters Portal authentication system.

## Overview

The Visual Matters Portal uses **Supabase** for authentication and manages users through three roles:
- **Admin** - Full system control
- **Client** - Manage projects and budgets
- **Creator** - Execute assigned work and track payments

## Prerequisites

- A Supabase account (free tier works fine)
- Node.js and pnpm installed
- The Visual Matters Portal codebase

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `visual-matters` (or your choice)
   - **Database Password**: Create a secure password
   - **Region**: Choose your region
5. Click "Create new project"
6. Wait for initialization (2-3 minutes)

## Step 2: Get Your Credentials

1. Once the project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "API Settings")
   - **anon public** key (under "Project API keys")

## Step 3: Set Environment Variables

1. Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Restart the dev server:
   ```bash
   npm run dev
   ```

## Step 4: Create the User Roles Schema (Optional but Recommended)

To track user roles in the database, follow these steps:

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and run this SQL:

```sql
-- Create a profiles table to store user roles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'client', 'creator')),
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can read their own profile
CREATE POLICY "Users can read their own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create RLS policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, company_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.user_metadata->>'role' OR 'client',
    NEW.user_metadata->>'company_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();
```

4. Click "Run" to execute the SQL

## Step 5: Create Test Users

In your Supabase dashboard:

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Create three test accounts:

### Admin User
- Email: `admin@visual-matters.com`
- Password: `demo123456`

### Client User
- Email: `client@visual-matters.com`
- Password: `demo123456`

### Creator User
- Email: `creator@visual-matters.com`
- Password: `demo123456`

### Setting User Roles

To assign roles to users, you can either:

**Option A: Via Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click on a user
3. Click "User Metadata"
4. Add:
   ```json
   {
     "role": "admin",
     "company_name": "Visual Matters"
   }
   ```

**Option B: Via SQL Editor**
```sql
-- Set admin role
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'), 
  '{role}', 
  '"admin"'
)
WHERE email = 'admin@visual-matters.com';

-- Set client role
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'), 
  '{role}', 
  '"client"'
),
user_metadata = jsonb_set(
  user_metadata, 
  '{company_name}', 
  '"Sarah''s Agency"'
)
WHERE email = 'client@visual-matters.com';

-- Set creator role
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'), 
  '{role}', 
  '"creator"'
),
user_metadata = jsonb_set(
  user_metadata, 
  '{company_name}', 
  '"Jamie Creative Studio"'
)
WHERE email = 'creator@visual-matters.com';
```

## Step 6: Test the Authentication

1. Go to http://localhost:8080/login
2. Try signing in with one of the test accounts:
   - **Admin**: admin@visual-matters.com / demo123456
   - **Client**: client@visual-matters.com / demo123456
   - **Creator**: creator@visual-matters.com / demo123456

3. After login, you should be automatically redirected to your role's dashboard:
   - Admin → `/admin/dashboard`
   - Client → `/client/dashboard`
   - Creator → `/creator/dashboard`

## How Authentication Works

### Login Flow
1. User enters email and password on `/login`
2. Supabase validates credentials
3. Session is stored in the browser
4. Auth context reads the session and user metadata
5. User is redirected to their role's dashboard
6. All protected routes check authentication and role

### Protected Routes
All dashboard routes are protected with the `ProtectedRoute` component which:
- Checks if user is authenticated
- Verifies user has the required role
- Redirects unauthenticated users to `/login`
- Redirects users to their own dashboard if accessing wrong role

### Logout
- Click the logout button (top right of dashboard)
- Session is cleared
- User is redirected to home page
- All data is cleared from browser

## Troubleshooting

### "Supabase credentials not found"
- Check that `.env.local` exists in the project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the dev server: `npm run dev`

### Login fails with "Invalid credentials"
- Check that the test user exists in Supabase
- Verify the email and password are correct
- Check that the user metadata contains a `role` field

### Redirects to wrong dashboard
- Verify user metadata has the correct `role` value
- Try logging out and back in
- Check browser console for errors

### "useAuth must be used within an AuthProvider" error
- Check that your page is wrapped by the AuthProvider
- The AuthProvider is set in `client/App.tsx` at the root

## Next Steps

Once authentication is working:

1. **Database Integration** - Connect projects, milestones, and assets to Supabase
2. **RLS Policies** - Set up Row Level Security to enforce data access control
3. **Real-time Updates** - Use Supabase subscriptions for live updates
4. **File Storage** - Use Supabase Storage for asset uploads
5. **Email Notifications** - Set up email templates for notifications

## Support

For more Supabase documentation, visit:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
