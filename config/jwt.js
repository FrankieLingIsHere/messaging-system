require('dotenv').config();

module.exports = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  },
  refreshToken: {
    expiryDays: process.env.JWT_REFRESH_EXPIRY_DAYS || 30
  }
};
