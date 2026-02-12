# Supabase Setup Guide for SnapAsset

## 📋 Prerequisites

- Supabase account ([Sign up free](https://supabase.com))
- SnapAsset repository cloned locally
- Node.js 18+ installed

---

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (or use existing)
4. Click "New Project"
5. Fill in project details:
   - **Name:** snapasset (or your choice)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for project setup

---

### Step 2: Get API Credentials

1. In your project dashboard, click **Settings** (gear icon)
2. Go to **API** section
3. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (for backend only)

4. Add to your `.env` files:

**Frontend `.env`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:3001
```

**Backend `server/.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

---

### Step 3: Configure Authentication

#### Enable Email Authentication

1. Go to **Authentication** in sidebar
2. Click **Providers**
3. **Email** should be enabled by default
4. Configure settings:
   - ✅ Enable email confirmations (recommended)
   - ✅ Enable email change confirmations
   - Set minimum password length (default: 6)

#### Configure URLs

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL:**
   ```
   http://localhost:5173
   ```
   (Change to production URL when deploying)

3. Add **Redirect URLs:**
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/**
   ```
   (Add production URLs when deploying)

---

### Step 4: Set Up Social Authentication (Optional)

#### 🔵 Google OAuth

**1. Create Google OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to **Credentials**
5. Create **OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Add **Authorized redirect URIs:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
8. Copy **Client ID** and **Client Secret**

**2. Configure in Supabase:**

1. Go to **Authentication** > **Providers**
2. Find **Google**
3. Toggle **Enable**
4. Paste **Client ID** and **Client Secret**
5. Click **Save**

#### 🐙 GitHub OAuth

**1. Create GitHub OAuth App:**

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in:
   - **Application name:** SnapAsset
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** 
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Generate **Client Secret**
6. Copy **Client ID** and **Client Secret**

**2. Configure in Supabase:**

1. Go to **Authentication** > **Providers**
2. Find **GitHub**
3. Toggle **Enable**
4. Paste **Client ID** and **Client Secret**
5. Click **Save**

#### 💬 Discord OAuth

**1. Create Discord Application:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Enter name: **SnapAsset**
4. Go to **OAuth2** tab
5. Add **Redirect:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Copy **Client ID** and **Client Secret**

**2. Configure in Supabase:**

1. Go to **Authentication** > **Providers**
2. Find **Discord**
3. Toggle **Enable**
4. Paste **Client ID** and **Client Secret**
5. Click **Save**

---

### Step 5: Customize Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize templates:
   - **Confirm signup** - Email verification
   - **Magic Link** - Passwordless login
   - **Reset Password** - Password reset
   - **Change Email** - Email change confirmation

**Example Magic Link Template:**
```html
<h2>Welcome to SnapAsset!</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In to SnapAsset</a></p>
<p>This link expires in 24 hours.</p>
```

---

### Step 6: Test Authentication

1. Start your development servers:
   ```bash
   npm run dev
   cd server && npm run dev
   ```

2. Open http://localhost:5173

3. Test each auth method:
   - Email/password signup
   - Email/password login
   - Magic link login
   - Google login (if configured)
   - GitHub login (if configured)
   - Discord login (if configured)
   - Password reset
   - Profile update

---

## 🔒 Security Configuration

### Row Level Security (RLS)

If you create custom tables, always enable RLS:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Email Rate Limiting

Supabase automatically rate limits:
- Email sends: 4 per hour per user
- Password resets: 2 per hour per user

Configure in **Authentication** > **Rate Limits**

### Security Settings

1. Go to **Authentication** > **Settings**
2. Configure:
   - **JWT expiry:** 3600 seconds (1 hour) - default
   - **Refresh token rotation:** Enabled
   - **Session timeout:** Configurable

---

## 📊 Monitoring

### View Users

1. Go to **Authentication** > **Users**
2. See all registered users
3. View user details, metadata
4. Manually verify emails if needed
5. Delete test users

### Auth Logs

1. Go to **Authentication** > **Logs**
2. View sign-in attempts
3. Track errors and issues
4. Filter by event type

---

## 🚀 Production Deployment

### Update Environment Variables

**Frontend:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_API_URL=https://your-api-domain.com
```

**Backend:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Update Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Update **Site URL:** `https://your-domain.com`
3. Add **Redirect URLs:**
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/**
   ```

### Update OAuth Apps

For each OAuth provider:
1. Add production callback URL
2. Add production homepage URL
3. Update authorized domains

---

## 💰 Pricing

**Supabase Free Tier:**
- 50,000 monthly active users
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests
- Social OAuth included

**Perfect for:**
- Development
- Small projects
- MVPs
- Testing

**Upgrade when:**
- Need more storage
- Higher bandwidth
- Custom SMTP
- Better support

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] API keys copied to .env files
- [ ] Email authentication enabled
- [ ] Redirect URLs configured
- [ ] Social providers enabled (if using)
- [ ] OAuth apps created and configured
- [ ] Email templates customized (optional)
- [ ] RLS policies created (if using custom tables)
- [ ] Tested signup flow
- [ ] Tested login flow
- [ ] Tested magic link
- [ ] Tested social login
- [ ] Tested password reset
- [ ] Tested profile update
- [ ] Verified email verification works

---

## 🆘 Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** Report bugs in repository

---

**Setup Complete!** 🎉

You now have a fully functional authentication system with Supabase!
