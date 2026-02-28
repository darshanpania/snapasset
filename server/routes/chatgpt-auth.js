import { Router } from 'express';
import { generatePkcePair, generateState } from '../auth/pkce.js';
import { ChatgptOAuthClient } from '../auth/chatgpt-oauth.js';
import { OAuthStateStore } from '../auth/oauth-state-store.js';
import { encryptApiKey } from '../utils/encryption.js';
import jwt from 'jsonwebtoken';

const router = Router();
const stateStore = new OAuthStateStore();

// POST /api/auth/chatgpt/start — initiate OAuth flow (called from frontend)
router.post('/start', (req, res) => {
  try {
    const { userToken } = req.body;
    if (!userToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    jwt.verify(userToken, process.env.JWT_SECRET);

    const client = new ChatgptOAuthClient();
    const { codeVerifier, codeChallenge } = generatePkcePair();
    const state = generateState();

    stateStore.set(state, { codeVerifier, userToken });

    const authorizationUrl = client.buildAuthorizeUrl({ codeChallenge, state });
    return res.json({ authorizationUrl });
  } catch (error) {
    console.error('ChatGPT auth start error:', error);
    return res.status(500).json({ error: 'Failed to start ChatGPT auth' });
  }
});

export default router;

// Separate callback handler — mounted at /callback (root level, matching Codex redirect URI)
export function createCallbackHandler() {
  const callbackRouter = Router();

  callbackRouter.get('/auth/callback', async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const settingsUrl = `${frontendUrl}/settings`;

    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`${settingsUrl}?chatgpt_error=${encodeURIComponent(oauthError)}`);
      }
      if (!code || !state) {
        return res.redirect(`${settingsUrl}?chatgpt_error=missing_code`);
      }

      const stateRecord = stateStore.consume(state);
      if (!stateRecord) {
        return res.redirect(`${settingsUrl}?chatgpt_error=invalid_state`);
      }

      const client = new ChatgptOAuthClient();
      const tokens = await client.exchangeCode(code, stateRecord.codeVerifier);

      // Exchange id_token for a real OpenAI API key
      let apiKey = null;
      let exchangeError = null;
      try {
        if (tokens.id_token) {
          apiKey = await client.exchangeForApiKey(tokens.id_token);
        }
      } catch (err) {
        exchangeError = err.message;
        console.warn('API key exchange failed:', err.message);
      }

      if (!apiKey) {
        // Check id_token claims to give specific guidance
        const claims = client.decodeJwtClaims(tokens.id_token);
        console.warn('Token exchange failed. Claims:', JSON.stringify(claims));

        if (exchangeError?.includes('organization_id')) {
          return res.redirect(`${settingsUrl}?chatgpt_error=needs_platform_setup`);
        }
        return res.redirect(`${settingsUrl}?chatgpt_error=no_api_key`);
      }

      // Store API key for the user
      const decoded = jwt.verify(stateRecord.userToken, process.env.JWT_SECRET);
      const userId = decoded.sub || decoded.id;
      const db = req.app.locals.providers?.db;

      if (!db?.users) {
        return res.redirect(`${settingsUrl}?chatgpt_error=db_unavailable`);
      }

      const encrypted = encryptApiKey(apiKey);
      await db.users.setApiKey(userId, encrypted, 'chatgpt');

      const claims = client.decodeJwtClaims(tokens.id_token);
      if (claims.chatgptAccountId) {
        await db.users.setChatgptAccountId(userId, claims.chatgptAccountId);
      }

      return res.redirect(`${settingsUrl}?chatgpt_linked=1`);
    } catch (error) {
      console.error('ChatGPT callback error:', error);
      return res.redirect(`${settingsUrl}?chatgpt_error=callback_failed`);
    }
  });

  return callbackRouter;
}
