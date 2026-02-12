# Security Guidelines

## Overview
This document outlines security best practices for the Visual Matters application, focusing on:
- Supabase Row Level Security (RLS) policies
- Secure server endpoints for sensitive operations
- Environment variable management
- Data protection

---

## 1. Authentication & Authorization

### Current Implementation
- Supabase Auth with JWT tokens
- Role-based access control (Client, Creator, Admin)
- Protected routes via `ProtectedRoute` component

### Best Practices
✅ **DO:**
- Always verify `user.id` matches the data being accessed
- Use RLS policies to enforce authorization at the database level
- Never trust client-side role checks alone
- Validate user session on every API call

❌ **DON'T:**
- Store sensitive data in JWT `user_metadata`
- Rely only on frontend role checks
- Allow direct client access to admin-only tables

---

## 2. Row Level Security (RLS) Policies

### Required RLS Policies

**Projects Table**
```sql
-- Users can view their own projects
CREATE POLICY "users_view_own_projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid() OR EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_assignments.project_id = projects.id 
    AND project_assignments.creator_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

-- Clients can create their own projects
CREATE POLICY "clients_create_projects"
  ON projects FOR INSERT
  WITH CHECK (client_id = auth.uid() AND (
    SELECT role FROM user_profiles WHERE id = auth.uid()
  ) = 'client');
```

**User Profiles Table**
```sql
-- Users can view their own profile
CREATE POLICY "users_view_own_profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR (
    SELECT role FROM user_profiles WHERE id = auth.uid()
  ) = 'admin');

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (
    SELECT role FROM user_profiles WHERE id = auth.uid()
  ));
```

**Payments Table**
```sql
-- Creators can view their own payments
CREATE POLICY "creators_view_own_payments"
  ON payments FOR SELECT
  USING (creator_id = auth.uid() OR (
    SELECT role FROM user_profiles WHERE id = auth.uid()
  ) = 'admin');

-- Only admins can create/update payments
CREATE POLICY "admins_manage_payments"
  ON payments FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
```

**Deliverables Table**
```sql
-- Creators can view their own deliverables
CREATE POLICY "creators_view_own_deliverables"
  ON deliverables FOR SELECT
  USING (creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM projects WHERE projects.id = deliverables.project_id
    AND projects.client_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));
```

### Enable RLS on All Tables
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
```

---

## 3. Sensitive Operations (Server-Side Only)

The following operations **MUST** use secure server endpoints:

### ✅ Move to Server Endpoints
1. **Payment Processing**
   - Requires PCI compliance
   - Never expose payment processor API keys to client
   - Validate payment amounts and recipient

2. **User Deletion/Suspension**
   - Irreversible operations
   - Requires audit logging
   - Should require confirmation

3. **Admin Operations**
   - User blocking/unblocking
   - Role changes
   - Data exports

4. **Sensitive Data Access**
   - Payment history details
   - User contact information
   - Financial reports

### Example: Secure Payment Processing

**Frontend (unsafe - don't do this):**
```javascript
// ❌ WRONG - API key exposed on client
const stripe = Stripe('pk_...');
```

**Backend (secure):**
```typescript
// ✅ CORRECT - API key on server only
app.post('/api/process-payment', async (req, res) => {
  const { userId, projectId, amount } = req.body;
  
  // 1. Verify user owns payment record
  const payment = await db.payments.findOne({ id: req.user.id });
  if (!payment) return res.status(403).json({ error: 'Forbidden' });
  
  // 2. Process with Stripe (key is secure on server)
  const charge = await stripe.charges.create({
    amount: amount * 100,
    currency: 'usd',
    source: 'tok_...',
  });
  
  // 3. Update database
  await db.payments.update(payment.id, { status: 'paid' });
  
  return res.json({ success: true });
});
```

---

## 4. Environment Variables

### Required Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SendGrid (optional, for email)
SENDGRID_API_KEY=sg_xxx...
FROM_EMAIL=noreply@visualmatters.co

# Server (optional)
NODE_ENV=production
PING_MESSAGE=pong
```

### Security Rules
✅ **DO:**
- Store all secret keys in `.env.local` (never commit)
- Use different keys for development and production
- Rotate API keys regularly
- Use environment-specific configs

❌ **DON'T:**
- Commit `.env` files
- Hardcode API keys in code
- Share credentials via email
- Use the same key for dev and prod

---

## 5. Data Protection

### Personally Identifiable Information (PII)
- User emails, names, phone numbers
- Payment information
- Portfolio URLs and descriptions

### Protection Measures
1. **Encryption in Transit**
   - All requests use HTTPS only
   - Enable HSTS header on server

2. **Encryption at Rest**
   - Enable Supabase encryption
   - Encrypt sensitive columns in database

3. **Access Control**
   - Users can only access their own data
   - RLS policies enforce this at DB level
   - Audit logging for sensitive access

### Data Deletion
Users can request deletion of their data:
1. Flag record with `deletion_requested` timestamp
2. Implement 30-day grace period
3. Permanently delete after grace period
4. Log deletion in audit trail

---

## 6. Common Vulnerabilities

### SQL Injection
✅ Use parameterized queries (Supabase client does this automatically)
```javascript
// Safe - parameterized query
await supabase.from('users').select().eq('email', email);
```

### XSS (Cross-Site Scripting)
✅ Sanitize user input
```javascript
// Use DOMPurify or similar
const clean = DOMPurify.sanitize(userInput);
```

### CSRF (Cross-Site Request Forgery)
✅ Supabase Auth handles CSRF protection
✅ Use SameSite cookies (automatic)

### CORS
✅ Configure CORS properly in Supabase
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## 7. Audit Logging

Track all sensitive operations:
```typescript
// Log activity in activity_logs table
await supabase.from('activity_logs').insert({
  user_id: userId,
  action: 'payment_processed',
  entity_type: 'payment',
  entity_id: paymentId,
  metadata: {
    amount,
    projectId,
    timestamp: new Date().toISOString(),
  },
});
```

---

## 8. Deployment Security

### Before Going to Production
- [ ] Enable RLS on all tables
- [ ] Review all RLS policies
- [ ] Move admin operations to server
- [ ] Set up API key rotation
- [ ] Enable database backups
- [ ] Configure HTTPS/SSL
- [ ] Set up error logging (Sentry)
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerts

### Netlify Deployment
```toml
# netlify.toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

---

## 9. Security Checklist

- [ ] All tables have RLS enabled
- [ ] RLS policies tested and verified
- [ ] Sensitive operations on server only
- [ ] Environment variables configured
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Audit logging implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] Rate limiting configured
- [ ] Authentication required for sensitive endpoints
- [ ] Data validation on all inputs
- [ ] No console.log of sensitive data in production

---

## 10. Incident Response

If security breach occurs:
1. Isolate affected systems
2. Assess scope (what data was accessed)
3. Notify affected users
4. Review audit logs
5. Implement fixes
6. Monitor for unauthorized access
7. Document lessons learned

---

## References
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Examples](https://supabase.com/docs/guides/auth/row-level-security)
