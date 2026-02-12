# Creator Dashboard Test Data Setup

This guide will help you create real test data in Supabase for the Creator Dashboard.

## Step 1: Create Creator User Account

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Click **Create new user**
4. Use these credentials:
   - Email: `creator@visualmatters.co`
   - Password: `TestCreator123!`

After creation, copy the user UUID (you'll need it for the next steps).

## Step 2: Create Creator Profile

Go to **SQL Editor** in Supabase and run this query (replace `{CREATOR_UUID}` with the UUID from Step 1):

```sql
-- Insert creator profile
INSERT INTO public.user_profiles (id, email, role, name, created_at, updated_at)
VALUES (
  '{CREATOR_UUID}',
  'creator@visualmatters.co',
  'creator',
  'Alex Creative Studio',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Create creator profile details
INSERT INTO public.creator_profiles (id, bio, portfolio_links, skills, ai_proficiency, day_rate, status, created_at, updated_at)
VALUES (
  '{CREATOR_UUID}',
  'Professional motion designer and video producer with 5+ years of experience',
  ARRAY['https://alexcreative.com', 'https://dribbble.com/alexcreative'],
  ARRAY['Motion Design', 'Video Production', 'Animation', '3D Modeling'],
  'advanced',
  2500.00,
  'approved',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();
```

## Step 3: Create Test Company (Client)

```sql
INSERT INTO public.companies (id, name, owner_id, description, website, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Creative Agency Inc',
  '{ADMIN_OR_CLIENT_UUID}',
  'Full-service creative agency',
  'https://creativeagency.com',
  NOW(),
  NOW()
) RETURNING id;
```

After running this, copy the returned `id` value for the next step.

## Step 4: Create Test Projects

Replace `{COMPANY_UUID}` with the UUID from Step 3:

```sql
INSERT INTO public.projects (id, title, description, tier, status, company_id, client_id, goals, platforms, timeline, budget, budget_used, created_at, updated_at)
VALUES 
(
  gen_random_uuid(),
  'Summer Campaign 2025',
  'Full-scale summer campaign with video and assets',
  'standard',
  'production',
  '{COMPANY_UUID}',
  NULL,
  'Increase brand awareness and engagement',
  ARRAY['Instagram', 'TikTok', 'YouTube'],
  '3 months',
  15000.00,
  8400.00,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Product Photography Series',
  'Professional product photography and editing',
  'essential',
  'briefing',
  '{COMPANY_UUID}',
  NULL,
  'Create high-quality product images for e-commerce',
  ARRAY['E-commerce', 'Web'],
  '2 months',
  5000.00,
  1200.00,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Brand Identity Refresh',
  'Complete brand visual identity redesign',
  'visionary',
  'pre_production',
  '{COMPANY_UUID}',
  NULL,
  'Modern, professional brand identity',
  ARRAY['Print', 'Digital'],
  '4 months',
  25000.00,
  9100.00,
  NOW(),
  NOW()
);
```

Copy all 3 project IDs returned.

## Step 5: Create Project Assignments

Use the project IDs from Step 4 and creator UUID from Step 1:

```sql
INSERT INTO public.project_assignments (id, project_id, creator_id, role, assigned_at)
VALUES 
(gen_random_uuid(), '{PROJECT_UUID_1}', '{CREATOR_UUID}', 'lead_creator', NOW()),
(gen_random_uuid(), '{PROJECT_UUID_2}', '{CREATOR_UUID}', 'contributor', NOW()),
(gen_random_uuid(), '{PROJECT_UUID_3}', '{CREATOR_UUID}', 'lead_creator', NOW());
```

## Step 6: Create Milestones for Projects

```sql
INSERT INTO public.milestones (id, project_id, title, description, status, due_date, budget_allocation, created_at, updated_at)
VALUES 
(gen_random_uuid(), '{PROJECT_UUID_1}', 'Hero Assets Development', 'Design and deliver hero banner assets', 'in_progress', CURRENT_DATE + INTERVAL '14 days', 2500.00, NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_1}', 'Video Editing', 'Edit and deliver 3 promotional videos', 'pending', CURRENT_DATE + INTERVAL '30 days', 5000.00, NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_2}', 'Photography Shoot', 'Professional product photography', 'pending', CURRENT_DATE + INTERVAL '7 days', 2000.00, NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_3}', 'Brand Concepts', 'Initial brand concepts and variations', 'submitted', CURRENT_DATE + INTERVAL '21 days', 3500.00, NOW(), NOW());
```

Copy the milestone IDs returned.

## Step 7: Create Deliverables

Use the milestone IDs, project IDs, and creator UUID:

```sql
INSERT INTO public.deliverables (id, project_id, creator_id, milestone_id, description, status, created_at, updated_at)
VALUES 
(gen_random_uuid(), '{PROJECT_UUID_1}', '{CREATOR_UUID}', '{MILESTONE_UUID_1}', 'Hero assets in multiple formats', 'in_progress', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_1}', '{CREATOR_UUID}', '{MILESTONE_UUID_2}', 'Three 30-second promotional videos', 'pending', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_2}', '{CREATOR_UUID}', '{MILESTONE_UUID_3}', '50 product photos with editing', 'pending', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_3}', '{CREATOR_UUID}', '{MILESTONE_UUID_4}', 'Brand concept designs', 'submitted', NOW(), NOW());
```

## Step 8: Create Payments/Invoices

```sql
INSERT INTO public.payments (id, project_id, creator_id, milestone_id, amount, status, due_date, created_at, updated_at)
VALUES 
(gen_random_uuid(), '{PROJECT_UUID_1}', '{CREATOR_UUID}', '{MILESTONE_UUID_1}', 2500.00, 'pending', CURRENT_DATE + INTERVAL '14 days', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_1}', '{CREATOR_UUID}', '{MILESTONE_UUID_2}', 5000.00, 'pending', CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_2}', '{CREATOR_UUID}', '{MILESTONE_UUID_3}', 2000.00, 'pending', CURRENT_DATE + INTERVAL '7 days', NOW(), NOW()),
(gen_random_uuid(), '{PROJECT_UUID_3}', '{CREATOR_UUID}', '{MILESTONE_UUID_4}', 3500.00, 'paid', CURRENT_DATE - INTERVAL '5 days', NOW(), NOW());
```

## Verification

Run this query to verify all data is set up correctly:

```sql
SELECT 
  'Deliverables' as type,
  COUNT(*) as count
FROM public.deliverables
WHERE creator_id = '{CREATOR_UUID}'

UNION ALL

SELECT 
  'Projects',
  COUNT(*)
FROM public.project_assignments
WHERE creator_id = '{CREATOR_UUID}'

UNION ALL

SELECT 
  'Payments',
  COUNT(*)
FROM public.payments
WHERE creator_id = '{CREATOR_UUID}';
```

You should see:
- 4 Deliverables
- 3 Projects  
- 4 Payments

Now sign in with the creator account and the dashboard will display all real data!
