module.exports = {
  requireRole: (requiredRole) => {
    return (req, res, next) => {
      if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Insufficient permissions.' 
        });
      }
      next();
    };
  },

  requireAnyRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Insufficient permissions.' 
        });
      }
      next();
    };
  }
};