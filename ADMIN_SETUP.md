# Admin Setup Guide - Project Assignments

This guide explains how to properly configure admin operations that require bypassing Row Level Security (RLS) policies.

## The Problem

When admins try to assign creators to projects, they get an RLS (Row Level Security) policy violation:

```
Error: new row violates row-level security policy for table "project_assignments"
```

This happens because:
1. RLS policies are designed to prevent unauthorized access
2. The browser client doesn't have admin privileges to insert directly
3. The server endpoint needs a service role key to bypass RLS

## The Solution

There are two ways to fix this:

### Option 1: Quick Fix (Development) - Direct Permissions

**Temporarily disable RLS** (for development only):

1. Go to your Supabase dashboard
2. Navigate to **Authentication → Policies**
3. Find `project_assignments` table
4. Click the policy list and disable RLS temporarily for testing

⚠️ **WARNING**: This is NOT secure for production. Only use for testing.

### Option 2: Proper Fix (Recommended) - Service Role Key

This is the secure, production-ready approach.

#### Step 1: Get Your Service Role Key

1. Go to **Supabase Dashboard** → **Project Settings**
2. Navigate to **API** section
3. Find **Service Role** (the one with the long key starting with `eyJ...`)
4. Copy it (keep it VERY SECRET - don't commit to git)

#### Step 2: Set Environment Variables

**For Development (.env.local):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Add this line
```

**For Production (Netlify/Vercel):**

1. Go to your deployment platform's settings
2. Add environment variable:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: your-service-role-key (paste the long key)
   ```

#### Step 3: Create RLS Policies

Run this SQL in your Supabase dashboard (**SQL Editor** → paste → Run):

```sql
-- Enable RLS on project_assignments table
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admins_manage_assignments" ON project_assignments;
DROP POLICY IF EXISTS "clients_view_own_assignments" ON project_assignments;
DROP POLICY IF EXISTS "creators_view_own_assignments" ON project_assignments;

-- Allow admins to do anything with assignments
CREATE POLICY "admins_manage_assignments"
  ON project_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow clients to view assignments for their own projects
CREATE POLICY "clients_view_own_assignments"
  ON project_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Allow creators to view their assignments
CREATE POLICY "creators_view_own_assignments"
  ON project_assignments
  FOR SELECT
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.client_id = auth.uid()
    )
  );
```

#### Step 4: Restart Dev Server

After adding the service role key to your environment:

```bash
# The dev server will restart automatically when you save changes
# Or manually restart it if needed
```

## How It Works

### Without Service Role Key:
1. Admin clicks "Assign Creator"
2. Browser attempts direct insert to Supabase
3. RLS policy blocks it ❌
4. Error: "row violates row-level security policy"

### With Service Role Key:
1. Admin clicks "Assign Creator"  
2. Browser calls `/api/admin/assign-creator` endpoint
3. Server (with service role key) inserts into Supabase
4. Service role bypasses RLS restrictions ✅
5. Success!

## Troubleshooting

### Issue: "SUPABASE_SERVICE_ROLE_KEY not configured"

**Solution**: 
- Check that the key is added to your `.env.local` file
- Restart the dev server after adding the variable
- For Netlify/Vercel, the environment variable must be set in the deployment platform settings

### Issue: Still getting RLS errors with service key set

**Solution**:
- Verify the service role key is correct (starts with `eyJ...`)
- Check server logs: look for `[ADMIN] Service Role Key: configured` message
- Try disabling RLS temporarily to test

### Issue: Assignment works in development but not production

**Solution**:
- Ensure the service role key is set in Netlify/Vercel environment variables
- Verify RLS policies are enabled on the `project_assignments` table
- Check production logs for errors

## Security Notes

⚠️ **CRITICAL**: 
- The service role key is extremely powerful - it bypasses ALL RLS policies
- NEVER commit it to git
- NEVER expose it to the client (use environment variables)
- Keep it secret like a password
- Rotate it periodically in production

✅ **Safe Practices**:
- Only store in `.env.local` and production environment variables
- Use the key only on the server-side
- Rotate the key if you suspect it's been leaked
- Monitor Supabase logs for unauthorized access

## Testing

Once configured, test the assignment:

1. Log in as an admin user
2. Go to **Admin → Projects**
3. Click "Assign Creators" on a project
4. Select creators and click "Assign"
5. Should see: "✅ Successfully assigned X creator(s)!"

If it still fails:
1. Check browser console for errors
2. Check server logs: `npm run dev` terminal output
3. Verify environment variables are set
4. Ensure RLS policies are created

## Next Steps

After setup is complete:
- ✅ Creator assignments should work
- ✅ Other admin operations are more secure
- ✅ You can scale to production with proper security

If you need help, check:
1. Server logs for `[ADMIN]` messages
2. Browser console for error details
3. Supabase logs for policy violations
4. Environment variables are correctly set
