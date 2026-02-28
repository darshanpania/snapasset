/**
 * Authentication Middleware
 * Verifies JWT tokens using the active provider (Supabase or Local)
 */

export const authMiddleware = async (req, res, next) => {
  try {
    const providers = req.app.locals.providers;
    if (!providers?.auth) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const user = await providers.auth.verifyToken(token);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};