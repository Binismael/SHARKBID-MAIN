# Sharkbid MVP - Deployment Guide

This guide covers deploying Sharkbid to production using Netlify or Vercel with www.shrkbid.com as the primary domain.

## Prerequisites

- GitHub repository with the Sharkbid code
- Supabase project configured with migrations applied
- Netlify or Vercel account
- Domain: www.shrkbid.com registered and DNS configured

## Environment Variables Setup

Before deploying, gather all required environment variables:

1. **Supabase Credentials:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

2. **OpenAI Credentials:**
   - `OPENAI_API_KEY` - Your OpenAI API key (for AI intake chat)

3. **SendGrid Credentials** (optional for email):
   - `SENDGRID_API_KEY` - Your SendGrid API key
   - `FROM_EMAIL` - Sender email address

4. **Builder.io Configuration** (optional):
   - `VITE_PUBLIC_BUILDER_KEY` - Your Builder.io public key

## Deployment Options

### Option 1: Netlify Deployment

#### Step 1: Connect GitHub Repository
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Select GitHub and authorize
4. Choose the `Binismael/SHARKBID-MAIN` repository
5. Select the `warlock-ledger-4jajub8c` branch (or your current branch)

#### Step 2: Configure Build Settings
In Netlify UI, set:
- **Build command:** `pnpm build`
- **Publish directory:** `dist/spa`
- **Node version:** 20.x

#### Step 3: Add Environment Variables
In Netlify Dashboard → Site settings → Build & deploy → Environment:
```
VITE_SUPABASE_URL=https://kpytttekmeoeqskfopqj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_lreQ-onfcl54cNK1onBAMQ_T9GB1lJe
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-proj-your-key
SENDGRID_API_KEY=SG.your-key
FROM_EMAIL=noreply@sharkbid.co
VITE_PUBLIC_BUILDER_KEY=__BUILDER_PUBLIC_KEY__
```

#### Step 4: Configure Custom Domain
1. In Netlify → Domain settings
2. Add custom domain: `www.shrkbid.com`
3. Follow DNS configuration instructions
4. Netlify will provision SSL certificate automatically

#### Step 5: Set Redirect Rules
Create `netlify.toml` in root:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Option 2: Vercel Deployment

#### Step 1: Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import GitHub repository: `Binismael/SHARKBID-MAIN`
4. Select the current branch

#### Step 2: Configure Project Settings
- **Framework:** Vite
- **Build Command:** `pnpm build`
- **Output Directory:** `dist/spa`
- **Install Command:** `pnpm install`

#### Step 3: Add Environment Variables
In Vercel → Project settings → Environment Variables:
```
VITE_SUPABASE_URL=https://kpytttekmeoeqskfopqj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_lreQ-onfcl54cNK1onBAMQ_T9GB1lJe
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-proj-your-key
SENDGRID_API_KEY=SG.your-key
FROM_EMAIL=noreply@sharkbid.co
VITE_PUBLIC_BUILDER_KEY=__BUILDER_PUBLIC_KEY__
```

#### Step 4: Configure Custom Domain
1. In Vercel → Domains
2. Add: `www.shrkbid.com`
3. Update DNS records as instructed
4. Vercel automatically manages SSL

#### Step 5: Server Function Configuration
For API routes, Vercel automatically converts `/server/routes` to Vercel Functions. No additional configuration needed.

## Post-Deployment Checklist

- [ ] Test all three portals (Business, Vendor, Admin) in production
- [ ] Verify Supabase connection and RLS policies are working
- [ ] Test AI intake chat with OpenAI
- [ ] Confirm lead routing is triggering
- [ ] Test vendor bid submission
- [ ] Check email notifications (if SendGrid configured)
- [ ] Verify SSL certificate is active
- [ ] Set up CDN caching for static assets
- [ ] Configure monitoring/alerting

## Troubleshooting

### Build Failures
- Ensure all required environment variables are set
- Check Node version matches (20.x or higher)
- Verify pnpm dependencies with `pnpm install --frozen-lockfile`

### API Issues
- Verify Supabase keys are correct
- Check CORS settings in Supabase
- Review API logs in Supabase dashboard

### Email Not Sending
- Confirm SENDGRID_API_KEY is set
- Verify FROM_EMAIL domain is verified in SendGrid
- Check email routing logs in SendGrid dashboard

## Continuous Deployment

Both Netlify and Vercel support automatic deployments:
1. Push to your deployment branch (e.g., `main`, `production`)
2. The site automatically rebuilds and deploys
3. Deployments are previewed before going live

## Monitoring

### Supabase Monitoring
- Monitor database performance in Supabase dashboard
- Check API usage and quotas
- Review RLS policy violations in logs

### Application Monitoring
- Set up error tracking (Sentry recommended)
- Monitor API response times
- Track user engagement

## Scaling Considerations

For production scale:
1. **Supabase:** Upgrade to paid plan for higher limits
2. **CDN:** Ensure static assets are cached at edge
3. **Database:** Monitor for slow queries, optimize indexes
4. **Rate Limiting:** Implement on API endpoints if needed

## Support

For deployment issues:
- Netlify Support: https://support.netlify.com/
- Vercel Support: https://vercel.com/support
- Supabase Documentation: https://supabase.com/docs
- OpenAI Documentation: https://platform.openai.com/docs
