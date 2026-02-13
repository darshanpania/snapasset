# SnapAsset Authentication System

## \u2728 Quick Overview

A complete authentication system for SnapAsset with multiple sign-in methods and user management.

---

## \ud83d\udd11 Authentication Methods

### 1. **Email & Password** \u2709\ufe0f
Classic authentication with email and password.
- Sign up with email
- Email verification required
- Password minimum 6 characters
- Secure password hashing by Supabase

### 2. **Magic Link** \u2728
Passwordless authentication via email.
- Enter email only
- Receive one-time login link
- Click link to sign in
- No password needed

### 3. **Social Login** \ud83c\udf10
OAuth authentication with popular providers:
- **Google** - Sign in with Google account
- **GitHub** - Sign in with GitHub account  
- **Discord** - Sign in with Discord account

---

## \ud83d\udce6 What's Included

### Components

1. **AuthContext** (`src/contexts/AuthContext.jsx`)
   - Global authentication state
   - All auth methods (signup, signin, signout, etc.)
   - Session management
   - Error handling

2. **Login** (`src/components/auth/Login.jsx`)
   - Email/password login
   - Magic link option
   - Social login buttons
   - Form validation

3. **Signup** (`src/components/auth/Signup.jsx`)
   - Registration form
   - Password confirmation
   - Terms acceptance
   - Social signup
   - Email verification

4. **User Profile** (`src/components/auth/UserProfile.jsx`)
   - View user info
   - Edit profile
   - Update avatar
   - Sign out

5. **Protected Routes** (`src/components/auth/ProtectedRoute.jsx`)
   - Protect pages from unauthenticated access
   - Auto-redirect to login

6. **Forgot Password** (`src/components/auth/ForgotPassword.jsx`)
   - Password reset flow
   - Email-based reset

7. **Auth Callback** (`src/components/auth/AuthCallback.jsx`)
   - Handle OAuth redirects
   - Process magic links
   - Session establishment

### Pages

1. **Home** (`src/pages/Home.jsx`)
   - Main application
   - Auth-aware header
   - User menu
   - Sign in/up buttons

---\n\n## \ud83d\udee0\ufe0f Setup Instructions\n\n### 1. Configure Supabase\n\nFollow the **SUPABASE_SETUP.md** guide for detailed instructions.\n\nQuick steps:\n1. Create Supabase project\n2. Copy API credentials\n3. Enable authentication providers\n4. Configure redirect URLs\n\n### 2. Update Environment Variables\n\n**Frontend `.env`:**\n```env\nVITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key\nVITE_API_URL=http://localhost:3001\n```\n\n### 3. Install Dependencies\n\nAll dependencies already included:\n- `@supabase/supabase-js` - Supabase client\n- `react-router-dom` - Routing\n\n### 4. Run Application\n\n```bash\nnpm install\nnpm run dev\n```\n\nOpen http://localhost:5173\n\n---\n\n## \ud83d\udcdd Routes\n\n| Route | Access | Description |\n|-------|--------|-------------|\n| `/` | Public | Home page |\n| `/auth/login` | Public | Login page |\n| `/auth/signup` | Public | Signup page |\n| `/auth/forgot-password` | Public | Password reset |\n| `/auth/callback` | Public | OAuth callback |\n| `/profile` | Protected | User profile |\n\n---\n\n## \ud83d\udcda Usage Examples\n\n### Using Auth in Components\n\n```jsx\nimport { useAuth } from './contexts/AuthContext'\n\nfunction MyComponent() {\n  const { user, signIn, signOut } = useAuth()\n\n  if (!user) {\n    return <button onClick={() => signIn(email, pass)}>Sign In</button>\n  }\n\n  return (\n    <div>\n      <p>Welcome, {user.email}!</p>\n      <button onClick={signOut}>Sign Out</button>\n    </div>\n  )\n}\n```\n\n### Protecting Routes\n\n```jsx\nimport ProtectedRoute from './components/auth/ProtectedRoute'\n\n<Route\n  path=\"/dashboard\"\n  element={\n    <ProtectedRoute>\n      <Dashboard />\n    </ProtectedRoute>\n  }\n/>\n```\n\n### Conditional Rendering\n\n```jsx\nconst { user } = useAuth()\n\n// Show different UI for authenticated users\n{user ? (\n  <GenerateButton />\n) : (\n  <SignInPrompt />\n)}\n```\n\n---\n\n## \u2699\ufe0f Configuration Options\n\n### Email Templates\n\nCustomize in Supabase Dashboard > Authentication > Email Templates:\n\n- Confirmation email\n- Magic link email  \n- Password reset email\n- Email change confirmation\n\n### Session Settings\n\n- **JWT Expiry:** 3600 seconds (1 hour)\n- **Refresh Token:** Auto-rotation enabled\n- **Session Timeout:** Configurable\n\n### Security\n\n- **Email Verification:** Enabled (recommended)\n- **Password Strength:** Minimum 6 characters\n- **Rate Limiting:** Built-in by Supabase\n\n---\n\n## \ud83c\udfaf Testing\n\n### Test Checklist\n\n- [ ] Sign up with email/password\n- [ ] Verify email\n- [ ] Sign in with email/password\n- [ ] Sign in with magic link\n- [ ] Sign in with Google\n- [ ] Sign in with GitHub\n- [ ] Sign in with Discord\n- [ ] Update profile\n- [ ] Reset password\n- [ ] Sign out\n- [ ] Access protected route without auth (should redirect)\n- [ ] Access protected route with auth (should work)\n\n---\n\n## \ud83d\udc1b Common Issues\n\n### \"Email not confirmed\"\n**Solution:** Check spam folder or resend verification email\n\n### Social login redirects but doesn't work\n**Solution:** \n- Verify redirect URLs match exactly\n- Check OAuth app settings\n- Ensure provider is enabled in Supabase\n\n### \"Invalid API key\"\n**Solution:**\n- Use anon key in frontend (not service key)\n- Verify key is from correct project\n- Check key is not expired\n\n### Session not persisting\n**Solution:**\n- Check localStorage is enabled\n- Verify no ad blockers interfering\n- Clear browser cache and retry\n\n---\n\n## \ud83d\ude80 Next Steps\n\nAfter authentication is working:\n\n1. **Create user profiles table** - Store additional user data\n2. **Add RLS policies** - Secure user data\n3. **Link images to users** - Associate generated images with accounts\n4. **Add usage tracking** - Track user generations\n5. **Implement quotas** - Limit free tier users\n6. **Add user dashboard** - Show user's image history\n\n---\n\n## \ud83d\udcda Resources\n\n- **AUTHENTICATION.md** - Complete technical documentation\n- **SUPABASE_SETUP.md** - Step-by-step Supabase configuration\n- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)\n- [React Router Docs](https://reactrouter.com/)\n\n---\n\n**Authentication system ready!** \ud83c\udf89\n\nUsers can now:\n- Create accounts\n- Sign in with multiple methods\n- Manage their profiles\n- Access protected features\n\nBuilt with \u2764\ufe0f by Darshan Pania\n