# Deployment Guide

This guide covers deploying Visual Matters to production using Netlify or Vercel.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Netlify Deployment](#netlify-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub repository created and pushed
- [ ] Supabase project created with database
- [ ] SendGrid account (optional, for emails)
- [ ] Netlify or Vercel account
- [ ] Domain name (optional but recommended)

---

## Netlify Deployment

### Step 1: Connect GitHub Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select GitHub and authorize
4. Choose your repository
5. Verify build settings:
   - Build command: `npm run build:client`
   - Publish directory: `dist/spa`
   - Functions directory: `netlify/functions`

### Step 2: Configure Environment Variables

1. Go to Site Settings → Environment
2. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SENDGRID_API_KEY=sg_xxx (if using emails)
FROM_EMAIL=noreply@yourdomain.com
NODE_ENV=production
PING_MESSAGE=pong
```

### Step 3: Configure Security Headers

Edit `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

# Redirect non-www to www (optional)
[[redirects]]
  from = "https://example.com/*"
  to = "https://www.example.com/:splat"
  status = 301
  force = true

# API proxy
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### Step 4: Configure Custom Domain

1. Go to Site Settings → Domain management
2. Click "Add custom domain"
3. Enter your domain
4. Follow DNS setup instructions
5. Enable HTTPS (automatic)

### Step 5: Deploy

```bash
# Manual deployment
git push origin main

# Automatic deployment happens on every push to main
```

---

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your GitHub repo
5. Select "Other" as the framework (or let Vercel auto-detect)

### Step 2: Configure Build Settings

```
Build Command: npm run build:client
Output Directory: dist/spa
```

### Step 3: Add Environment Variables

1. Go to Project Settings → Environment Variables
2. Add variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SENDGRID_API_KEY (if using emails)
FROM_EMAIL
NODE_ENV
```

### Step 4: Deploy

```bash
git push origin main
# Vercel auto-deploys on push
```

---

## Environment Variables

### Development
Create `.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SENDGRID_API_KEY=sg_xxx (optional)
FROM_EMAIL=test@example.com
NODE_ENV=development
```

### Production
Set in Netlify/Vercel dashboard (never commit `.env`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SENDGRID_API_KEY=sg_xxx
FROM_EMAIL=noreply@yourdomain.com
NODE_ENV=production
PING_MESSAGE=pong
```

### Important Security Notes
- ✅ VITE_* variables are safe to expose (used in frontend)
- ❌ SENDGRID_API_KEY must only be on server (keep it hidden)
- ❌ Never commit `.env` files
- ✅ Use environment-specific API keys
- ✅ Rotate keys regularly

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Configure database password
4. Wait for project initialization
5. Copy Project URL and Anon Key

### 2. Apply Database Migrations

The application requires the following tables. If not automatically created, use Supabase SQL editor:

```sql
-- Run migrations from migrations/ folder
-- Or create tables manually:

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ... (additional tables documented in SCHEMA.md)
```

### 3. Enable Row Level Security

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

See [SECURITY.md](./SECURITY.md) for RLS policy examples.

### 4. Configure Storage

1. Go to Storage in Supabase dashboard
2. Create bucket: `assets`
3. Make it private (access via authenticated requests)
4. Configure CORS if needed

---

## Monitoring & Logs

### Netlify Functions Logs

```bash
# View logs
netlify functions:invoke api --http POST --payload '{"key": "value"}'

# Or in Netlify dashboard:
# Functions → Logs
```

### Supabase Logs

1. Go to Supabase dashboard
2. Database → Logs
3. View query logs, errors, etc.

### Error Tracking (Optional)

Add Sentry for error monitoring:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

---

## Post-Deployment Checklist

- [ ] Verify site loads without errors
- [ ] Test authentication (signup, login, logout)
- [ ] Test core features (create project, upload asset, etc.)
- [ ] Verify API endpoints respond
- [ ] Check environment variables are set
- [ ] Enable HTTPS/SSL
- [ ] Setup custom domain
- [ ] Configure backups
- [ ] Setup monitoring/alerts
- [ ] Test email notifications (if configured)
- [ ] Verify RLS policies work
- [ ] Setup error tracking
- [ ] Review security checklist in SECURITY.md
- [ ] Create backup of database
- [ ] Document admin account details

---

## Troubleshooting

### Site not deploying
- Check build logs in Netlify/Vercel
- Verify environment variables are set
- Check `netlify.toml` syntax
- Ensure build command matches your setup

### APIs not working
- Check Netlify functions logs
- Verify API endpoint paths are correct
- Check environment variables (SENDGRID_API_KEY, etc.)
- Test locally: `netlify dev`

### Database connection errors
- Verify VITE_SUPABASE_URL is correct
- Check VITE_SUPABASE_ANON_KEY is valid
- Ensure Supabase project is active
- Check network connectivity

### Emails not sending
- Verify SENDGRID_API_KEY is set
- Check email address format
- Review SendGrid logs
- Test endpoint manually

---

## Rollback

If deployment breaks production:

### Netlify Rollback
1. Go to Deploys
2. Click previous deployment
3. Click "Publish deploy"

### Vercel Rollback
1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

---

## Performance Optimization

### Frontend
- Enable caching in `netlify.toml`
- Minimize bundle size (tree-shake unused code)
- Use lazy loading for routes
- Optimize images

### Backend
- Add database indexes
- Cache responses where appropriate
- Use connection pooling
- Monitor function execution time

---

## Scaling

As your app grows:
1. **Database**: Add read replicas, archive old data
2. **Files**: Use CDN for asset delivery
3. **Functions**: Upgrade Netlify/Vercel plan
4. **Monitoring**: Increase log retention
5. **Email**: Upgrade SendGrid plan

---

## Support

For deployment issues:
- Netlify Support: https://support.netlify.com
- Vercel Support: https://vercel.com/support
- Supabase Community: https://supabase.com/community
