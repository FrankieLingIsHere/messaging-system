const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Generate access token
exports.generateAccessToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  });
};

// Generate refresh token
exports.generateRefreshToken = (userId) => {
  const token = uuidv4();
  
  // Set expiry date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return {
    token,
    expiresAt
  };
};

// Verify access token
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
