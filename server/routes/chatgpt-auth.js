import { Router } from 'express';
import { generatePkcePair, generateState } from '../auth/pkce.js';
import { ChatgptOAuthClient } from '../auth/chatgpt-oauth.js';
import { OAuthStateStore } from '../auth/oauth-state-store.js';
import { encryptApiKey } from '../utils/encryption.js';
import bcrypt from 'bcrypt';

const router = Router();
const stateStore = new OAuthStateStore();

function getOAuthClient(req) {
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  return new ChatgptOAuthClient({
    clientId: process.env.CHATGPT_CLIENT_ID,
    clientSecret: process.env.CHATGPT_CLIENT_SECRET,
    baseUrl,
  });
}

// GET /api/auth/chatgpt/start — initiate OAuth flow
// Pass ?userToken=<jwt> to link the API key to an existing logged-in user (Settings flow)
router.get('/start', (req, res) => {
  try {
    if (!process.env.CHATGPT_CLIENT_ID) {
      return res.status(503).json({ error: 'ChatGPT auth not configured' });
    }
    const client = getOAuthClient(req);
    const { codeVerifier, codeChallenge } = generatePkcePair();
    const state = generateState();
    const returnTo = req.query.returnTo || '/';
    const userToken = req.query.userToken || null;

    stateStore.set(state, { codeVerifier, returnTo, userToken });

    const authorizationUrl = client.buildAuthorizeUrl({ codeChallenge, state });

    if (req.query.redirect === '1') {
      return res.redirect(authorizationUrl);
    }
    return res.json({ authorizationUrl, state });
  } catch (error) {
    console.error('ChatGPT auth start error:', error);
    return res.status(500).json({ error: 'Failed to start ChatGPT auth' });
  }
});

// GET /api/auth/chatgpt/callback — handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/?error=${encodeURIComponent(oauthError)}`);
    }
    if (!code || !state) {
      return res.redirect('/?error=missing_code_or_state');
    }

    // Validate and consume state
    const stateRecord = stateStore.consume(state);
    if (!stateRecord) {
      return res.redirect('/?error=invalid_or_expired_state');
    }

    const client = getOAuthClient(req);

    // Exchange code for tokens
    const tokens = await client.exchangeCode(code, stateRecord.codeVerifier);
    const claims = client.decodeJwtClaims(tokens.id_token || tokens.access_token);

    if (!claims.email) {
      return res.redirect('/?error=no_email_in_token');
    }

    // Try to exchange for OpenAI API key
    let apiKey = null;
    try {
      if (tokens.id_token) {
        apiKey = await client.exchangeForApiKey(tokens.id_token);
      }
    } catch (err) {
      console.warn('API key exchange failed (non-fatal):', err.message);
    }

    const db = req.app.locals.providers?.db;
    const auth = req.app.locals.providers?.auth;
    if (!db?.users || !auth) {
      return res.redirect('/?error=auth_service_unavailable');
    }

    const returnTo = stateRecord.returnTo || '/';

    // --- Link-to-existing-user flow (Settings page) ---
    if (stateRecord.userToken) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(stateRecord.userToken, process.env.JWT_SECRET);
        const userId = decoded.sub || decoded.id;

        if (!apiKey) {
          const sep = returnTo.includes('?') ? '&' : '?';
          return res.redirect(`${returnTo}${sep}chatgpt_error=no_api_key`);
        }

        const encrypted = encryptApiKey(apiKey);
        await db.users.setApiKey(userId, encrypted, 'chatgpt');

        if (claims.chatgptAccountId) {
          await db.users.setChatgptAccountId(userId, claims.chatgptAccountId);
        }

        const sep = returnTo.includes('?') ? '&' : '?';
        return res.redirect(`${returnTo}${sep}chatgpt_linked=1`);
      } catch (err) {
        console.error('Link-to-user failed:', err.message);
        const sep = returnTo.includes('?') ? '&' : '?';
        return res.redirect(`${returnTo}${sep}chatgpt_error=link_failed`);
      }
    }

    // --- Sign-in flow (create/find user, issue JWT) ---
    let user = await db.users.findByEmail(claims.email);
    if (!user) {
      const sentinel = await bcrypt.hash(`chatgpt_oauth_${Date.now()}`, 10);
      user = await db.users.create(claims.email, sentinel, {
        auth_method: 'chatgpt',
        chatgpt_plan_type: claims.chatgptPlanType,
      });
    }

    if (claims.chatgptAccountId) {
      await db.users.setChatgptAccountId(user.id, claims.chatgptAccountId);
    }

    if (apiKey) {
      const encrypted = encryptApiKey(apiKey);
      await db.users.setApiKey(user.id, encrypted, 'chatgpt');
    }

    const token = auth.generateToken
      ? auth.generateToken(user)
      : (await import('jsonwebtoken')).default.sign(
          { sub: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

    const separator = returnTo.includes('?') ? '&' : '?';
    return res.redirect(`${returnTo}${separator}token=${token}`);
  } catch (error) {
    console.error('ChatGPT auth callback error:', error);
    return res.redirect('/?error=auth_callback_failed');
  }
});

export default router;
