# AI Intake Error - Debugging Guide

## Error
```
Error: Failed to get AI response
    at handleSendMessage
```

## Root Causes (in order of likelihood)

### 1. **OPENAI_API_KEY Not Set** ⚠️ MOST LIKELY
The OpenAI API key environment variable is missing or invalid.

**Check:**
```bash
# In terminal, verify the key is set
echo $OPENAI_API_KEY

# Should output: sk-proj-...
```

**Fix:**
```bash
# Set the environment variable
export OPENAI_API_KEY="sk-proj-..."

# Verify it's set
echo $OPENAI_API_KEY

# Then restart dev server
pnpm dev
```

### 2. **OpenAI API Key Invalid or Expired**
The API key might be incorrect, revoked, or expired.

**Fix:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (it's only shown once)
4. Update your environment variable

### 3. **OpenAI API Quota Exceeded**
You might have exceeded your OpenAI API usage quota.

**Check:**
1. Visit https://platform.openai.com/account/billing/overview
2. Check your usage and limits
3. Add a payment method or increase credits

### 4. **Network/CORS Issue**
The fetch request might be blocked by network or CORS settings.

**Check in browser console:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try sending a message in the chat
4. Look for the `/api/ai-intake` request
5. Check if it's a 4xx or 5xx error

### 5. **Dev Server Not Running**
The backend API might not be running.

**Fix:**
```bash
# Terminal 1: Start dev server
pnpm dev

# You should see:
# VITE v7.x.x  ready in XXX ms
# ➜  Local:   http://localhost:8080/
```

---

## Debug Steps

### Step 1: Check Environment Variables
```bash
# View all environment variables
env | grep OPENAI

# Should show:
# OPENAI_API_KEY=sk-proj-...
```

### Step 2: Check .env File
```bash
# View .env file
cat .env

# Should contain:
# OPENAI_API_KEY=sk-proj-...
```

### Step 3: Test API Directly
```bash
# Test the endpoint manually
curl -X POST http://localhost:8080/api/ai-intake \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hello",
    "conversationHistory": [],
    "systemPrompt": "You are helpful"
  }'

# Should return:
# {
#   "response": "...",
#   "extractedData": {...},
#   "success": true
# }
```

### Step 4: Check Server Logs
Look at the terminal where `pnpm dev` is running:

**Error: OPENAI_API_KEY is not configured**
```
❌ OPENAI_API_KEY is not configured in environment variables
```
→ Set the environment variable (see Fix #1)

**Error: OpenAI API error: 401**
```
❌ OpenAI API error: HTTP 401: Unauthorized
```
→ Your API key is invalid (see Fix #2)

**Error: OpenAI API error: 429**
```
❌ OpenAI API error: HTTP 429: Too Many Requests
```
→ You've exceeded rate limits or quota (see Fix #3)

---

## Quick Fix Checklist

- [ ] `echo $OPENAI_API_KEY` returns a value starting with `sk-proj-`
- [ ] `.env` file contains `OPENAI_API_KEY=sk-proj-...`
- [ ] Dev server is running (`pnpm dev`)
- [ ] No error messages in server terminal
- [ ] Browser DevTools Network tab shows `/api/ai-intake` responding 200-299

---

## If Still Not Working

1. **Restart everything:**
   ```bash
   # Stop dev server (Ctrl+C)
   # Clear cache
   rm -rf node_modules/.vite
   
   # Restart
   pnpm dev
   ```

2. **Verify OpenAI API:**
   ```bash
   # Test OpenAI API directly (if you have jq installed)
   curl -s https://api.openai.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"hi"}]}' | jq .
   ```

3. **Check logs for details:**
   Look at the server terminal for the exact error message from OpenAI

---

## Testing After Fix

1. **Open browser:** http://localhost:8080
2. **Sign up** as a Business user
3. **Go to:** `/business/intake`
4. **Type:** "I need payroll services in Illinois"
5. **Check:**
   - Message appears in chat
   - Loading spinner shows
   - AI response appears
   - Project data is extracted

---

## Environment Variable Setup

### For Linux/Mac:
```bash
# Add to ~/.bashrc or ~/.zshrc
export OPENAI_API_KEY="sk-proj-..."

# Then reload
source ~/.bashrc  # or source ~/.zshrc
```

### For Windows (CMD):
```cmd
set OPENAI_API_KEY=sk-proj-...
```

### For Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY="sk-proj-..."
```

### For Development (Recommended):
Create a `.env.local` file:
```bash
OPENAI_API_KEY=sk-proj-...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Still Stuck?

Check these resources:
- OpenAI Status: https://status.openai.com/
- OpenAI Docs: https://platform.openai.com/docs/api-reference/chat/create
- Rate Limits: https://platform.openai.com/account/rate-limits

The error message in the chat and server logs will help identify the exact issue.
