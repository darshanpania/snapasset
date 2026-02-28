import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.use((req, res, next) => {
  if (!req.app.locals.providers?.auth) {
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
  next();
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await req.app.locals.providers.auth.register(email, password, metadata);
    res.status(201).json({ user });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { token, user } = await req.app.locals.providers.auth.login(email, password);
    res.json({ token, user });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

    const user = await req.app.locals.providers.auth.verifyToken(authHeader.substring(7));
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
