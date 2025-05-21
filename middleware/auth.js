const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if email is verified
exports.isEmailVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  
  next();
};

// Role-based middleware for Super Admin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin access required'
    });
  }
  
  next();
};

// Role-based middleware for Admin or Super Admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
};

// Role-based middleware for any authenticated user
exports.isUser = (req, res, next) => {
  if (!req.user.role) {
    return res.status(403).json({
      success: false,
      message: 'User role required'
    });
  }
  
  next();
};
