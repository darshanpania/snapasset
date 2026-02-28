/**
 * ChatGPT OAuth client — handles authorize URL construction,
 * code exchange, JWT decoding, and API key exchange.
 * Ported from divyekant/SignInWithChatGPT.
 */

const ISSUER = 'https://auth.openai.com';
const AUTHORIZE_PATH = '/oauth/authorize';
const TOKEN_PATH = '/oauth/token';
const SCOPES = 'openid profile email offline_access';

export class ChatgptOAuthClient {
  constructor({ clientId, clientSecret, baseUrl }) {
    if (!clientId) throw new Error('CHATGPT_CLIENT_ID is required');
    this.clientId = clientId;
    this.clientSecret = clientSecret || null;
    this.baseUrl = baseUrl;
    this.redirectUri = `${baseUrl}/api/auth/chatgpt/callback`;
  }

  buildAuthorizeUrl({ codeChallenge, state }) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });
    return `${ISSUER}${AUTHORIZE_PATH}?${params.toString()}`;
  }

  async exchangeCode(code, codeVerifier) {
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier,
    };
    if (this.clientSecret) body.client_secret = this.clientSecret;

    const res = await fetch(`${ISSUER}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  async exchangeForApiKey(idToken) {
    const body = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: idToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      audience: 'https://api.openai.com/v1',
      client_id: this.clientId,
    };
    if (this.clientSecret) body.client_secret = this.clientSecret;

    const res = await fetch(`${ISSUER}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API key exchange failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    return data.access_token; // This is the OpenAI API key
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
