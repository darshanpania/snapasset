/**
 * Admin Middleware
 * Checks if user has admin role
 */

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user has admin role
    const { data, error } = await req.app.locals.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin status',
    });
  }
};