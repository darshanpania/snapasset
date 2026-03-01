import { Router } from 'express';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../utils/encryption.js';

const router = Router();

// GET /api/settings/api-key — returns key status
router.get('/api-key', async (req, res) => {
  try {
    const db = req.app.locals.providers?.db;
    if (!db?.users?.getApiKey) {
      return res.json({ hasKey: false, source: null, maskedKey: null });
    }
    const result = await db.users.getApiKey(req.user.id);
    if (!result?.encryptedKey) {
      return res.json({ hasKey: false, source: null, maskedKey: null });
    }
    const plainKey = decryptApiKey(result.encryptedKey);
    return res.json({
      hasKey: true,
      source: result.source || 'manual',
      maskedKey: maskApiKey(plainKey),
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return res.status(500).json({ error: 'Failed to retrieve API key status' });
  }
});

// PUT /api/settings/api-key — store a new key
router.put('/api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey is required' });
    }
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return res.status(400).json({
        error: 'Invalid OpenAI API key format. Keys start with sk- and are at least 20 characters.',
      });
    }
    const db = req.app.locals.providers?.db;
    if (!db?.users?.setApiKey) {
      return res.status(503).json({ error: 'User settings not available' });
    }
    const encrypted = encryptApiKey(apiKey);
    await db.users.setApiKey(req.user.id, encrypted, 'manual');
    return res.json({ success: true, maskedKey: maskApiKey(apiKey), source: 'manual' });
  } catch (error) {
    console.error('Set API key error:', error);
    return res.status(500).json({ error: 'Failed to save API key' });
  }
});

// DELETE /api/settings/api-key — remove stored key
router.delete('/api-key', async (req, res) => {
  try {
    const db = req.app.locals.providers?.db;
    if (!db?.users?.removeApiKey) {
      return res.status(503).json({ error: 'User settings not available' });
    }
    await db.users.removeApiKey(req.user.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({ error: 'Failed to remove API key' });
  }
});

export default router;
