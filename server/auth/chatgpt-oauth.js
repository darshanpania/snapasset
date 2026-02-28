/**
 * OpenAI OAuth client — reuses the same public client ID and endpoints
 * as OpenAI Codex CLI. Uses authorization code flow with PKCE.
 * Redirect URI matches Codex format: http://127.0.0.1:{port}/callback
 */

const ISSUER = 'https://auth.openai.com';
const AUTHORIZE_PATH = '/oauth/authorize';
const TOKEN_PATH = '/oauth/token';
const SCOPES = 'openid profile email offline_access';
const CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

const OAUTH_CALLBACK_PORT = 1455;

export class ChatgptOAuthClient {
  constructor() {
    this.clientId = CODEX_CLIENT_ID;
    this.redirectUri = `http://localhost:${OAUTH_CALLBACK_PORT}/auth/callback`;
  }

  buildAuthorizeUrl({ codeChallenge, state }) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      id_token_add_organizations: 'true',
      codex_cli_simplified_flow: 'true',
      state,
      originator: 'codex_cli_rs',
    });
    return `${ISSUER}${AUTHORIZE_PATH}?${params.toString()}`;
  }

  async exchangeCode(code, codeVerifier) {
    const res = await fetch(`${ISSUER}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  async exchangeForApiKey(idToken) {
    const res = await fetch(`${ISSUER}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token: idToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        requested_token: 'openai-api-key',
        client_id: this.clientId,
      }).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API key exchange failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    return data.access_token;
  }

  decodeJwtClaims(token) {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return {
        email: decoded.email || decoded.preferred_username,
        chatgptAccountId: decoded.sub || decoded.chatgpt_account_id,
        chatgptPlanType: decoded.chatgpt_plan_type,
        organizationId: decoded.organization_id,
      };
    } catch {
      return {};
    }
  }
}
