# Supabase Authentication Implementation

## 🔐 Overview

This document describes the complete Supabase authentication system implemented for SnapAsset.

## Architecture

```
src/
├── contexts/
│   └── AuthContext.jsx          # Global auth state management
├── components/auth/
│   ├── Login.jsx                # Login component
│   ├── Signup.jsx               # Signup component
│   ├── ForgotPassword.jsx       # Password reset
│   ├── AuthCallback.jsx         # OAuth callback handler
│   ├── UserProfile.jsx          # User profile management
│   ├── ProtectedRoute.jsx       # Route protection wrapper
│   ├── Auth.css                 # Authentication styles
│   └── UserProfile.css          # Profile styles
├── pages/
│   ├── Home.jsx                 # Main application page
│   └── Home.css                 # Home page styles
└── App.jsx                      # Router and auth provider setup
```

---

## Features Implemented

### 1. **AuthContext** (`src/contexts/AuthContext.jsx`)

Central authentication state management using React Context API.

**Provides:**
- `user` - Current authenticated user object
- `session` - Current session object
- `loading` - Loading state for async operations
- `error` - Error messages

**Methods:**
- `signUp(email, password, metadata)` - Create new account
- `signIn(email, password)` - Sign in with credentials
- `signInWithMagicLink(email)` - Passwordless authentication
- `signInWithProvider(provider)` - OAuth authentication
- `signOut()` - Sign out user
- `updateProfile(updates)` - Update user metadata
- `resetPassword(email)` - Send password reset email

**Usage:**
```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signOut } = useAuth()
  // Use auth methods
}
```

---

### 2. **Authentication Methods**

#### Email/Password Authentication
```jsx
const { error } = await signUp('user@example.com', 'password123', {
  full_name: 'John Doe'
})

const { error } = await signIn('user@example.com', 'password123')
```

#### Magic Link (Passwordless)
```jsx
const { error } = await signInWithMagicLink('user@example.com')
// User receives email with one-time login link
```

#### Social Login (OAuth)
```jsx
// Supported providers: google, github, discord
const { error } = await signInWithProvider('google')
```

---

### 3. **Login Component** (`src/components/auth/Login.jsx`)

**Features:**
- Email/password login form
- Magic link toggle option
- Social login buttons (Google, GitHub, Discord)
- Form validation
- Error handling
- Loading states
- Link to signup page
- Link to password reset

**Social Providers:**
- **Google** - OAuth 2.0 with Google accounts
- **GitHub** - OAuth with GitHub accounts
- **Discord** - OAuth with Discord accounts

**UI Elements:**
- Email input with validation
- Password input (hidden when using magic link)
- "Use magic link instead" checkbox
- "Forgot password?" link
- Social login buttons with provider icons
- Success/error alerts

---

### 4. **Signup Component** (`src/components/auth/Signup.jsx`)

**Features:**
- Full name input (optional)
- Email input with validation
- Password input with strength requirements
- Password confirmation
- Terms of Service agreement checkbox
- Social signup buttons
- Form validation
- Auto-generated avatar
- Success message with email verification notice

**Validation:**
- Email format validation
- Password minimum 6 characters
- Password match confirmation
- Terms acceptance required

**User Metadata:**
- `full_name` - User's display name
- `avatar_url` - Auto-generated from initials

---

### 5. **User Profile** (`src/components/auth/UserProfile.jsx`)

**Features:**
- View user information
- Edit profile (name, avatar)
- Display account details
- Sign out functionality
- Email verification badge

**Displayed Information:**
- Email (with verification status)
- Full name (editable)
- Avatar (editable with URL or auto-generated)
- User ID
- Account creation date
- Last sign-in time

**Profile Actions:**
- Edit mode toggle
- Save changes
- Cancel editing
- Sign out

---

### 6. **Protected Routes** (`src/components/auth/ProtectedRoute.jsx`)

**Purpose:** Restrict access to authenticated users only.

**Behavior:**
- Shows loading spinner while checking auth status
- Redirects to `/auth/login` if not authenticated
- Renders children if authenticated

**Usage:**
```jsx
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  }
/>
```

---

### 7. **Password Reset** (`src/components/auth/ForgotPassword.jsx`)

**Features:**
- Email input for reset link
- Send reset email via Supabase
- Success/error messages
- Link back to login

**Flow:**
1. User enters email
2. System sends reset link to email
3. User clicks link in email
4. Redirected to reset password page
5. User sets new password

---

### 8. **OAuth Callback Handler** (`src/components/auth/AuthCallback.jsx`)

**Purpose:** Handle OAuth redirects after social login.

**Flow:**
1. User clicks social login button
2. Redirected to provider (Google/GitHub/Discord)
3. User authorizes application
4. Provider redirects to `/auth/callback`
5. Component processes session
6. Redirects to home page

---

## Routing Structure

```jsx
Public Routes:
  / (Home)                    - Main application
  /auth/login                 - Login page
  /auth/signup                - Signup page
  /auth/forgot-password       - Password reset
  /auth/callback              - OAuth callback

Protected Routes:
  /profile                    - User profile (requires auth)
```

---

## Supabase Configuration

### 1. **Enable Authentication Providers**

In your Supabase Dashboard:

**Email Authentication:**
1. Go to Authentication > Providers
2. Enable "Email"
3. Configure email templates (optional)

**Magic Links:**
1. Already enabled with email auth
2. Configure in Authentication > Email Templates
3. Customize magic link email

**Google OAuth:**
1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console:
   - Client ID
   - Client Secret
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (development)

**GitHub OAuth:**
1. Go to Authentication > Providers > GitHub
2. Enable GitHub provider
3. Create OAuth App on GitHub:
   - Go to Settings > Developer settings > OAuth Apps
   - Create new app
   - Homepage URL: `http://localhost:5173` (or production URL)
   - Callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Add Client ID and Secret to Supabase

**Discord OAuth:**
1. Go to Authentication > Providers > Discord
2. Enable Discord provider
3. Create app on Discord Developer Portal:
   - Go to https://discord.com/developers/applications
   - Create new application
   - Add OAuth2 redirect URL
4. Add Client ID and Secret to Supabase

### 2. **Configure Redirect URLs**

In Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
```
http://localhost:5173 (development)
https://your-domain.com (production)
```

**Redirect URLs:**
```
http://localhost:5173/auth/callback
https://your-domain.com/auth/callback
```

### 3. **Email Templates**

Customize email templates in Authentication > Email Templates:

- **Confirmation** - Email verification
- **Magic Link** - Passwordless login
- **Password Reset** - Reset password
- **Email Change** - Confirm email change

---

## Environment Setup

### Frontend `.env`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_URL=http://localhost:3001
```

### Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on Settings (gear icon)
3. Go to API section
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## Authentication Flow

### Sign Up Flow
```
1. User fills signup form
2. Submit to Supabase Auth
3. Supabase creates user account
4. Sends verification email
5. User clicks verification link
6. Email confirmed
7. User can sign in
```

### Sign In Flow (Email/Password)
```
1. User enters credentials
2. Submit to Supabase Auth
3. Supabase validates credentials
4. Returns session token
5. AuthContext updates state
6. User redirected to home
```

### Magic Link Flow
```
1. User enters email
2. Supabase sends magic link
3. User clicks link in email
4. Redirected to /auth/callback
5. Session established
6. Redirected to home
```

### Social Login Flow
```
1. User clicks social button
2. Redirected to provider (Google/GitHub/Discord)
3. User authorizes app
4. Provider redirects to Supabase
5. Supabase redirects to /auth/callback
6. Session established
7. Redirected to home
```

### Sign Out Flow
```
1. User clicks sign out
2. Call Supabase signOut()
3. Session cleared
4. AuthContext updates state
5. User redirected to login
```

---

## User Object Structure

```javascript
{
  id: 'uuid',
  email: 'user@example.com',
  email_confirmed_at: '2026-01-24T14:30:00Z',
  created_at: '2026-01-24T14:30:00Z',
  last_sign_in_at: '2026-01-24T14:30:00Z',
  user_metadata: {
    full_name: 'John Doe',
    avatar_url: 'https://...'
  },
  app_metadata: {}
}
```

---

## Security Features

### Row Level Security (RLS)

Recommended policies for user data:

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Password Requirements

- Minimum 6 characters (enforced in signup form)
- Supabase default: 6 characters minimum
- Can be customized in Supabase dashboard

### Email Verification

- Enabled by default
- Users receive verification email on signup
- Must verify email before full access (configurable)

### Session Management

- Sessions stored in browser localStorage
- Auto-refresh before expiration
- Handled automatically by Supabase client
- Default expiry: 1 hour (configurable)

---

## Error Handling

### Common Errors

**Invalid credentials:**
```javascript
{ message: 'Invalid login credentials' }
```

**Email already registered:**
```javascript
{ message: 'User already registered' }
```

**Weak password:**
```javascript
{ message: 'Password should be at least 6 characters' }
```

**Network error:**
```javascript
{ message: 'Failed to fetch' }
```

### Error Display

All authentication components show errors using alert banners:
```jsx
<div className="alert alert-error">
  <span>⚠️</span>
  <p>{error.message}</p>
</div>
```

---

## Testing Authentication

### Test Email/Password

1. Go to `/auth/signup`
2. Enter email and password
3. Submit form
4. Check email for verification link
5. Click verification link
6. Go to `/auth/login`
7. Sign in with credentials

### Test Magic Link

1. Go to `/auth/login`
2. Check "Use magic link instead"
3. Enter email
4. Click "Send Magic Link"
5. Check email
6. Click link in email
7. Automatically signed in

### Test Social Login

1. Configure provider in Supabase dashboard
2. Go to `/auth/login` or `/auth/signup`
3. Click social button (Google/GitHub/Discord)
4. Authorize app on provider
5. Redirected back and signed in

### Test Protected Routes

1. Without being logged in, try to access `/profile`
2. Should redirect to `/auth/login`
3. Sign in
4. Try accessing `/profile` again
5. Should load profile page

---

## Integration with Main App

### Header with Auth State

```jsx
{user ? (
  <div className="user-menu">
    <button onClick={() => navigate('/profile')}>
      <img src={user.user_metadata?.avatar_url} />
      {user.user_metadata?.full_name || user.email}
    </button>
    <button onClick={signOut}>Sign Out</button>
  </div>
) : (
  <div className="auth-buttons">
    <button onClick={() => navigate('/auth/login')}>Sign In</button>
    <button onClick={() => navigate('/auth/signup')}>Sign Up</button>
  </div>
)}
```

### Conditional Feature Access

```jsx
// Show different UI based on auth state
if (!user) {
  return <LoginPrompt />
}

// Or disable features
<button disabled={!user}>Generate Images</button>
```

---

## Styling

### Design System

**Colors:**
- Primary: `#667eea` to `#764ba2` (gradient)
- Success: `#4caf50`
- Error: `#f44336`
- Background: `#f5f7fa`

**Components:**
- Auth cards: White with rounded corners (20px)
- Buttons: Gradient primary, outlined secondary
- Inputs: 2px border with focus states
- Alerts: Colored backgrounds with icons

**Animations:**
- Slide up on mount
- Slide down for alerts
- Smooth transitions

---

## Best Practices

### Security

1. **Never expose service key** - Use anon key in frontend
2. **Enable RLS** - Protect user data with policies
3. **Verify emails** - Require email verification
4. **Use HTTPS** - Always in production
5. **Validate inputs** - Client and server-side

### User Experience

1. **Clear error messages** - Help users understand issues
2. **Loading states** - Show progress during async operations
3. **Success feedback** - Confirm successful actions
4. **Remember me** - Sessions persist across visits
5. **Social login** - Offer convenient alternatives

### Performance

1. **Lazy load auth components** - Reduce initial bundle size
2. **Cache session** - Avoid unnecessary API calls
3. **Optimistic UI** - Update UI before server confirms

---

## Database Schema (Optional)

Create a `user_profiles` table for additional user data:

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Troubleshooting

### "Invalid API key"
- Check `VITE_SUPABASE_ANON_KEY` is correct
- Verify key is for correct project
- Regenerate key if needed

### "Email not confirmed"
- Check spam folder for verification email
- Resend verification from Supabase dashboard
- Or disable email confirmation requirement

### Social login not working
- Verify provider is enabled in Supabase
- Check OAuth credentials are correct
- Verify redirect URLs match exactly
- Check provider app is not in development mode

### Session not persisting
- Check localStorage is enabled
- Verify no browser extensions blocking storage
- Check session expiry settings

### "User already registered"
- User with that email exists
- Try password reset if forgotten
- Or use different email

---

## Advanced Features

### Multi-Factor Authentication (MFA)

```jsx
// Enable MFA for user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})
```

### Email Change

```jsx
const { error } = await supabase.auth.updateUser({
  email: 'newemail@example.com'
})
// Sends confirmation to both old and new email
```

### Password Change

```jsx
const { error } = await supabase.auth.updateUser({
  password: 'newpassword123'
})
```

---

## Production Checklist

- [ ] Enable email verification
- [ ] Configure custom email templates
- [ ] Set up custom domain for emails
- [ ] Add reCAPTCHA to forms (optional)
- [ ] Configure session timeout
- [ ] Set up OAuth providers
- [ ] Test all authentication flows
- [ ] Enable RLS policies
- [ ] Set up monitoring/alerts
- [ ] Review security policies
- [ ] Add rate limiting
- [ ] Test password reset flow
- [ ] Verify redirect URLs
- [ ] Set up Terms of Service page
- [ ] Set up Privacy Policy page

---

## API Reference

### AuthContext Methods

#### signUp(email, password, metadata)
- **Parameters:**
  - `email`: string (required)
  - `password`: string (required)
  - `metadata`: object (optional) - `{ full_name, avatar_url }`
- **Returns:** `{ data, error }`

#### signIn(email, password)
- **Parameters:**
  - `email`: string (required)
  - `password`: string (required)
- **Returns:** `{ data, error }`

#### signInWithMagicLink(email)
- **Parameters:**
  - `email`: string (required)
- **Returns:** `{ data, error }`

#### signInWithProvider(provider)
- **Parameters:**
  - `provider`: 'google' | 'github' | 'discord'
- **Returns:** `{ data, error }`

#### signOut()
- **Parameters:** None
- **Returns:** `{ error }`

#### updateProfile(updates)
- **Parameters:**
  - `updates`: object - User metadata to update
- **Returns:** `{ data, error }`

#### resetPassword(email)
- **Parameters:**
  - `email`: string (required)
- **Returns:** `{ data, error }`

---

## Future Enhancements

1. **Phone Authentication** - SMS-based login
2. **Multi-Factor Authentication** - TOTP-based 2FA
3. **Social Profile Sync** - Import data from social accounts
4. **Account Deletion** - Allow users to delete accounts
5. **Session Management** - View and revoke active sessions
6. **Login History** - Track login attempts and devices
7. **Profile Completion** - Prompt for missing info
8. **Avatar Upload** - Direct file upload to Supabase Storage

---

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [OAuth Provider Setup](https://supabase.com/docs/guides/auth/social-login)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** January 24, 2026  
**Author:** Darshan Pania
