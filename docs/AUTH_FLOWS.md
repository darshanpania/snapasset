# Authentication Flows - Visual Guide

This document provides visual representations of all authentication flows in SnapAsset.

---

## \ud83d\udcdd Table of Contents

1. [Sign Up Flow (Email/Password)](#sign-up-flow)
2. [Sign In Flow (Email/Password)](#sign-in-flow)
3. [Magic Link Flow](#magic-link-flow)
4. [Social Login Flow (OAuth)](#social-login-flow)
5. [Password Reset Flow](#password-reset-flow)
6. [Profile Update Flow](#profile-update-flow)
7. [Protected Route Flow](#protected-route-flow)
8. [Sign Out Flow](#sign-out-flow)

---

## Sign Up Flow

**Email/Password Registration**

```
User Action:
  1. Navigate to /auth/signup
  2. Fill in form:
     - Full name (optional)
     - Email
     - Password
     - Confirm password
     - Accept terms
  3. Click \"Create Account\"
     \u2193
Frontend:
  4. Validate form
  5. Call signUp() from AuthContext
     \u2193
AuthContext:
  6. Call supabase.auth.signUp()
  7. Pass email, password, metadata
     \u2193
Supabase:
  8. Create user account
  9. Hash password
  10. Send verification email
  11. Return user object (unconfirmed)
     \u2193
Frontend:
  12. Show success message\n  13. Display \"Check your email\" notice
  14. (Optional) Redirect to login after 3s
     \u2193
User:
  15. Check email
  16. Click verification link
  17. Email confirmed
  18. Can now sign in
```

**User Metadata Saved:**\n```javascript\n{\n  full_name: \"John Doe\",\n  avatar_url: \"https://ui-avatars.com/api/...\"\n}\n```

---

## Sign In Flow

**Email/Password Login**

```
User Action:
  1. Navigate to /auth/login
  2. Enter email and password
  3. Click \"Sign In\"
     \u2193
Frontend:
  4. Validate inputs
  5. Call signIn() from AuthContext
     \u2193
AuthContext:
  6. Call supabase.auth.signInWithPassword()
  7. Pass email and password
     \u2193
Supabase:
  8. Verify credentials
  9. Check if email is verified
  10. Create session
  11. Generate JWT tokens
  12. Return session + user
     \u2193
AuthContext:
  13. Update state with user and session
  14. Trigger onAuthStateChange
     \u2193
Frontend:
  15. Navigate to home page \"/\"\n  16. Update header with user info
  17. User is now authenticated
```

**Session Object:**\n```javascript\n{\n  access_token: \"eyJ...\",\n  refresh_token: \"...\",\n  expires_in: 3600,\n  user: { ... }\n}\n```

---

## Magic Link Flow

**Passwordless Authentication**

```
User Action:
  1. Navigate to /auth/login
  2. Check \"Use magic link instead\"
  3. Enter email only
  4. Click \"Send Magic Link\"
     \u2193
Frontend:
  5. Call signInWithMagicLink()
     \u2193
AuthContext:
  6. Call supabase.auth.signInWithOtp()
  7. Pass email and redirect URL
     \u2193
Supabase:
  8. Generate one-time token
  9. Create magic link URL
  10. Send email with link
  11. Return success
     \u2193
Frontend:
  12. Show \"Check your email\" message
     \u2193
User:
  13. Check email
  14. Click magic link
  15. Browser opens /auth/callback
     \u2193
AuthCallback Component:
  16. Extract token from URL
  17. Call supabase.auth.getSession()
  18. Establish session
     \u2193
Supabase:
  19. Verify token\n  20. Create session\n  21. Return user + session
     \u2193
Frontend:
  22. Redirect to home \"/\"\n  23. User is now authenticated\n```

**Magic Link Email:**\n```\nSubject: Your SnapAsset Magic Link\n\nClick here to sign in:\n[Sign In Button] \u2192 https://your-project.supabase.co/auth/v1/verify?token=...\n\nThis link expires in 24 hours.\n```

---

## Social Login Flow

**OAuth Authentication (Google/GitHub/Discord)**

```
User Action:
  1. Navigate to /auth/login or /auth/signup
  2. Click social button (e.g., \"Google\")
     \u2193
Frontend:
  3. Call signInWithProvider('google')
     \u2193
AuthContext:
  4. Call supabase.auth.signInWithOAuth()
  5. Pass provider name and redirect URL
     \u2193
Supabase:
  6. Generate OAuth state token
  7. Redirect to provider (Google/GitHub/Discord)
     \u2193
Provider (e.g., Google):
  8. Show authorization screen\n  9. User approves access
  10. Provider redirects to Supabase callback
      URL: https://your-project.supabase.co/auth/v1/callback?code=...
     \u2193
Supabase:
  11. Exchange code for provider tokens\n  12. Get user info from provider
  13. Create or update user account
  14. Create session
  15. Redirect to your app: http://localhost:5173/auth/callback
     \u2193
AuthCallback Component:
  16. Extract session from URL\n  17. Call supabase.auth.getSession()
  18. Session established
     \u2193
Frontend:
  19. Redirect to home \"/\"\n  20. User is now authenticated
```

**Provider Data Retrieved:**\n```javascript\n// From Google\n{\n  email: \"user@gmail.com\",\n  full_name: \"John Doe\",\n  avatar_url: \"https://lh3.googleusercontent.com/...\",\n  email_verified: true\n}\n\n// From GitHub\n{\n  email: \"user@github.com\",\n  full_name: \"John Doe\",\n  avatar_url: \"https://avatars.githubusercontent.com/...\",\n  user_name: \"johndoe\"\n}\n\n// From Discord\n{\n  email: \"user@discord.com\",\n  full_name: \"JohnDoe#1234\",\n  avatar_url: \"https://cdn.discordapp.com/...\"\n}\n```

---

## Password Reset Flow

**Forgot Password Recovery**

```
User Action:
  1. Navigate to /auth/forgot-password\n  2. Enter email\n  3. Click \"Send Reset Link\"
     \u2193
Frontend:
  4. Call resetPassword(email)
     \u2193
AuthContext:
  5. Call supabase.auth.resetPasswordForEmail()
  6. Pass email and redirect URL
     \u2193
Supabase:
  7. Check if email exists\n  8. Generate reset token\n  9. Send email with reset link
  10. Return success
     \u2193
Frontend:
  11. Show \"Check your email\" message
     \u2193
User:
  12. Check email\n  13. Click reset link
  14. Redirected to /auth/reset-password
     \u2193
Reset Password Page:\n  15. Show new password form\n  16. User enters new password
  17. Submit new password
     \u2193
Supabase:
  18. Verify reset token\n  19. Update password\n  20. Invalidate old sessions\n  21. Create new session
     \u2193
Frontend:
  22. Show success message\n  23. Redirect to login or home\n```

**Reset Email:**\n```\nSubject: Reset Your SnapAsset Password\n\nClick here to reset your password:\n[Reset Password Button] \u2192 https://your-app.com/auth/reset-password?token=...\n\nThis link expires in 1 hour.\n```

---

## Profile Update Flow

**Edit User Profile**

```
User Action:
  1. Navigate to /profile (must be logged in)
  2. Click \"Edit Profile\"
  3. Update full name and/or avatar URL
  4. Click \"Save Changes\"
     \u2193
Frontend:
  5. Validate inputs\n  6. Call updateProfile()
     \u2193
AuthContext:
  7. Call supabase.auth.updateUser()
  8. Pass updated metadata
     \u2193
Supabase:
  9. Verify session is valid\n  10. Update user_metadata\n  11. Return updated user object
     \u2193
AuthContext:
  12. Update local user state\n  13. Trigger onAuthStateChange
     \u2193
Frontend:
  14. Show success message\n  15. Update UI with new data
  16. Exit edit mode\n```

**Updated Metadata:**\n```javascript\n{\n  full_name: \"Jane Smith\",  // Updated\n  avatar_url: \"https://...\"  // Updated\n}\n```

---

## Protected Route Flow

**Accessing Protected Pages**

```
User Action:
  1. Navigate to /profile (protected route)
     \u2193
ProtectedRoute Component:
  2. Check loading state
  3. If loading: Show spinner
  4. Check if user exists
     \u2193
If User is Authenticated:
  5. Render protected component (UserProfile)
  6. User sees profile page
     \u2193
If User is NOT Authenticated:
  7. Redirect to /auth/login\n  8. Save intended destination (optional)
  9. After login, redirect back (optional)
```

**Code:**\n```jsx\n<ProtectedRoute>\n  <UserProfile />  {/* Only renders if authenticated */}\n</ProtectedRoute>\n```

---

## Sign Out Flow

**User Logout**

```
User Action:
  1. Click \"Sign Out\" button
     \u2193
Frontend:
  2. Call signOut() from AuthContext
     \u2193
AuthContext:
  3. Call supabase.auth.signOut()
     \u2193
Supabase:
  4. Invalidate session tokens\n  5. Clear session from database
  6. Return success
     \u2193
AuthContext:
  7. Clear user state (set to null)
  8. Clear session state (set to null)
  9. Trigger onAuthStateChange
     \u2193
Frontend:
  10. Update UI (remove user menu)
  11. Show sign in/up buttons
  12. Redirect to /auth/login (optional)
     \u2193
Browser:
  13. Clear localStorage session
  14. User is now logged out
```

---

## Session Management

**Auto-Refresh Flow**

```
Session Active:
  \u2193
Check Expiry:
  - Session expires in 1 hour (default)
  - Auto-refresh triggered at 50 minutes
     \u2193
Supabase Client:
  - Calls refresh endpoint automatically
  - Uses refresh_token
     \u2193
Supabase:
  - Validates refresh_token\n  - Generates new access_token
  - Generates new refresh_token
  - Returns new session
     \u2193
AuthContext:
  - Updates session silently\n  - User stays logged in
  - No interruption to user
```

**Session Expiry:**\n```javascript\n{\n  access_token: \"eyJ...\",\n  refresh_token: \"...\",\n  expires_in: 3600,        // 1 hour\n  expires_at: 1706109000    // Unix timestamp\n}\n```

---

## Error Handling Flows

### Invalid Credentials

```
User enters wrong password
     \u2193
Supabase returns error
     \u2193
AuthContext catches error
     \u2193
Frontend shows error message:\n\"Invalid login credentials\"\n```

### Email Already Exists

```
User signs up with existing email
     \u2193
Supabase returns error
     \u2193
Frontend shows:\n\"User already registered\"\n```

### Unverified Email

```
User tries to login before verifying
     \u2193
Supabase allows login\n(but email_confirmed_at is null)
     \u2193
App can check verification status:\nif (!user.email_confirmed_at) {\n  // Show verification notice\n}\n```

### Network Error

```
No internet connection
     \u2193
Fetch fails\n     \u2193
AuthContext catches error
     \u2193
Frontend shows:\n\"Failed to connect. Check your internet.\"\n```

---

## State Diagram

```
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  Initial Load   \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n        \u2502\n        \u2193\n\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  Check Session  \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2518\n      \u2502        \u2502\n      \u2502        \u2502\n  Session   No Session\n  Exists      \u2502\n      \u2502        \u2502\n      \u2193        \u2193\n\u250c\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2510  \u250c\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2510\n\u2502 Authenticated\u2502  \u2502 Guest  \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2518\n      \u2502              \u2502\n      \u2502              \u2502\n      \u2502         Sign In/Up\n      \u2502              \u2502\n      \u2502              \u2193\n      \u2502        (Auth Flows)\n      \u2502              \u2502\n      \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n              \u2502\n              \u2193\n      \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n      \u2502   Using App    \u2502\n      \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n              \u2502\n         Sign Out\n              \u2502\n              \u2193\n         Back to Guest\n```

---

## Magic Link Flow

**Passwordless Login**

```\nUser at /auth/login\n     \u2193\nCheck \"Use magic link\"\n     \u2193\nEnter email only\n     \u2193\nClick \"Send Magic Link\"\n     \u2193\nSupabase sends email\n     \u2193\nUser receives email:\n  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n  \u2502 Sign in to SnapAsset        \u2502\n  \u2502                             \u2502\n  \u2502 [Click to Sign In]          \u2502\n  \u2502                             \u2502\n  \u2502 Link expires in 24 hours    \u2502\n  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n     \u2193\nUser clicks link\n     \u2193\nRedirects to /auth/callback\n     \u2193\nSession established\n     \u2193\nRedirects to /\n     \u2193\nUser is logged in!\n```

---

## Social Login Flow (Detailed)

**Google OAuth Example**

```\nUser clicks \"Google\" button\n     \u2193\nRedirect to Google:\nhttps://accounts.google.com/o/oauth2/v2/auth?\n  client_id=...\n  redirect_uri=https://your-project.supabase.co/auth/v1/callback\n  scope=openid email profile\n  state=...\n     \u2193\nGoogle Login Screen:\n  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n  \u2502 Sign in with Google      \u2502\n  \u2502                          \u2502\n  \u2502 SnapAsset wants to:      \u2502\n  \u2502 \u2713 View your email       \u2502\n  \u2502 \u2713 View your profile     \u2502\n  \u2502                          \u2502\n  \u2502 [Cancel]  [Allow]       \u2502\n  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n     \u2193\nUser clicks \"Allow\"\n     \u2193\nGoogle redirects to Supabase:\nhttps://your-project.supabase.co/auth/v1/callback?code=...\n     \u2193\nSupabase:\n  - Exchanges code for tokens\n  - Gets user info from Google\n  - Creates/updates user in database\n  - Creates session\n     \u2193\nRedirects to your app:\nhttp://localhost:5173/auth/callback#access_token=...\n     \u2193\nAuthCallback component:\n  - Extracts session\n  - Updates AuthContext\n     \u2193\nRedirects to /\n     \u2193\nUser is logged in with Google account!\n```

---

## Protected Route Flow

**Attempting to Access Protected Page**

```\nUser navigates to /profile\n     \u2193\nProtectedRoute component checks:\n     \u2502\n     \u251c\u2500\u2500\u2500 Is loading? \u2192 Show spinner\n     \u2502\n     \u251c\u2500\u2500\u2500 Is authenticated?\n     \u2502       \u2502\n     \u2502      YES         NO\n     \u2502       \u2502          \u2502\n     \u2502       \u2193          \u2193\n     \u2502   Render     Redirect\n     \u2502   Profile    to /auth/login\n     \u2502       \u2502          \u2502\n     \u2502       \u2502          \u2193\n     \u2502       \u2502    Show login page\n     \u2502       \u2502          \u2502\n     \u2502       \u2502    User signs in\n     \u2502       \u2502          \u2502\n     \u2502       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n     \u2502              \u2502\n     \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                    \u2502\n                    \u2193\n            Access granted to /profile\n```

---

## Sign Out Flow

**User Logout**

```\nUser clicks \"Sign Out\"\n     \u2193\nAuthContext.signOut() called\n     \u2193\nsupabase.auth.signOut()\n     \u2193\nSupabase:\n  - Invalidates access token\n  - Invalidates refresh token\n  - Removes session from database\n     \u2193\nAuthContext:\n  - Sets user to null\n  - Sets session to null\n  - Triggers onAuthStateChange\n     \u2193\nBrowser:\n  - Clears localStorage\n  - Clears session cookies\n     \u2193\nFrontend:\n  - Updates header (shows sign in/up buttons)\n  - Redirects to /auth/login (optional)\n  - User is logged out\n```

---

## Component Interaction Diagram

```\nApp.jsx\n  \u2502\n  \u251c\u2500\u2500 <AuthProvider>  (wraps entire app)\n  \u2502     \u2502\n  \u2502     \u251c\u2500\u2500 Provides: user, session, auth methods\n  \u2502     \u2502\n  \u2502     \u2514\u2500\u2500 <Router>\n  \u2502           \u2502\n  \u2502           \u251c\u2500\u2500 Route: / \u2192 <Home>\n  \u2502           \u2502              \u2502\n  \u2502           \u2502              \u251c\u2500\u2500 useAuth() hook\n  \u2502           \u2502              \u251c\u2500\u2500 Shows user menu if logged in\n  \u2502           \u2502              \u2514\u2500\u2500 Shows sign in/up if not\n  \u2502           \u2502\n  \u2502           \u251c\u2500\u2500 Route: /auth/login \u2192 <Login>\n  \u2502           \u2502                         \u2502\n  \u2502           \u2502                         \u251c\u2500\u2500 useAuth() hook\n  \u2502           \u2502                         \u251c\u2500\u2500 signIn() method\n  \u2502           \u2502                         \u2514\u2500\u2500 signInWithProvider()\n  \u2502           \u2502\n  \u2502           \u251c\u2500\u2500 Route: /auth/signup \u2192 <Signup>\n  \u2502           \u2502                          \u2502\n  \u2502           \u2502                          \u251c\u2500\u2500 useAuth() hook\n  \u2502           \u2502                          \u2514\u2500\u2500 signUp() method\n  \u2502           \u2502\n  \u2502           \u2514\u2500\u2500 Route: /profile \u2192 <ProtectedRoute>\n  \u2502                                  \u2502\n  \u2502                                  \u251c\u2500\u2500 useAuth() hook\n  \u2502                                  \u251c\u2500\u2500 Checks authentication\n  \u2502                                  \u2502\n  \u2502                                  \u2514\u2500\u2500 <UserProfile>\n  \u2502                                        \u2502\n  \u2502                                        \u251c\u2500\u2500 useAuth() hook\n  \u2502                                        \u251c\u2500\u2500 updateProfile()\n  \u2502                                        \u2514\u2500\u2500 signOut()\n  \u2502\n  \u2514\u2500\u2500 Supabase Client (imported in AuthContext)\n```

---

## Data Flow

```\nUser Interaction\n     \u2193\nReact Component\n     \u2193\nuseAuth() Hook\n     \u2193\nAuthContext Methods\n     \u2193\nSupabase Client\n     \u2193\nSupabase API\n     \u2193\nSupabase Database\n     \u2193\nResponse\n     \u2193\nAuthContext State Update\n     \u2193\nComponent Re-renders\n     \u2193\nUI Updates\n```

---

## Session Storage

**Where session data is stored:**

```\nBrowser localStorage:\n  Key: supabase.auth.token\n  Value: {\n    access_token: \"eyJ...\",\n    refresh_token: \"...\",\n    expires_at: 1706109000,\n    user: { ... }\n  }\n\nReact State (AuthContext):\n  - user: User object\n  - session: Session object\n  - Synced with localStorage\n  - Auto-updates on changes\n```

---

## Security Layers

```\n1. Frontend Validation\n   - Form validation\n   - Input sanitization\n   - Client-side checks\n     \u2193\n2. Supabase Client SDK\n   - Token handling\n   - Auto-refresh\n   - Secure storage\n     \u2193\n3. Supabase API\n   - Rate limiting\n   - Input validation\n   - Password hashing\n     \u2193\n4. Database (PostgreSQL)\n   - Row Level Security (RLS)\n   - Data encryption\n   - Access policies\n```

---

## Email Templates

**Emails sent by Supabase:**\n\n1. **Confirmation Email** (Sign up)\n   ```\n   Subject: Confirm Your Email\n   \n   Welcome to SnapAsset!\n   Click here to verify your email:\n   [Verify Email Button]\n   ```\n\n2. **Magic Link Email** (Passwordless login)\n   ```\n   Subject: Your SnapAsset Magic Link\n   \n   Click here to sign in:\n   [Sign In Button]\n   \n   Expires in 24 hours\n   ```\n\n3. **Password Reset Email**\n   ```\n   Subject: Reset Your Password\n   \n   Click here to reset:\n   [Reset Password Button]\n   \n   Expires in 1 hour\n   ```\n\n4. **Email Change Confirmation**\n   ```\n   Subject: Confirm Email Change\n   \n   Confirm your new email:\n   [Confirm Button]\n   ```\n\n---\n\n## Rate Limiting\n\n**Supabase Built-in Limits:**\n\n- **Email sends:** 4 per hour per user\n- **Password resets:** 2 per hour per user  \n- **Sign-in attempts:** 6 per hour per IP\n- **API requests:** Configurable per project\n\nProtects against:\n- Brute force attacks\n- Email spam\n- API abuse\n\n---\n\n## Browser Compatibility\n\n\u2705 Chrome/Edge (latest)  \n\u2705 Firefox (latest)  \n\u2705 Safari (latest)  \n\u2705 Mobile browsers (iOS Safari, Chrome Mobile)  \n\n**Requirements:**\n- localStorage support\n- Fetch API support\n- ES6+ support\n- Cookies enabled\n\n---\n\n## Accessibility Features\n\n\u2705 Semantic HTML  \n\u2705 Form labels  \n\u2705 ARIA attributes  \n\u2705 Keyboard navigation  \n\u2705 Focus indicators  \n\u2705 Screen reader friendly  \n\u2705 Color contrast (WCAG AA)  \n\u2705 Error announcements  \n\n---\n\n**Complete authentication flows documented!** \ud83c\udf89\n\nFor implementation details, see **docs/AUTHENTICATION.md**  \nFor setup instructions, see **docs/SUPABASE_SETUP.md**\n\n---\n\nBuilt with \u2764\ufe0f by Darshan Pania\n