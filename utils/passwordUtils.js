const bcrypt = require('bcrypt');

// Hash a password
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Validate password complexity
exports.validatePasswordStrength = (password) => {
  // At least 8 characters, containing uppercase, lowercase, number, and special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  
  if (!strongPasswordRegex.test(password)) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
    };
  }
  
  return {
    isValid: true,
    message: 'Password meets strength requirements'
  };
};

// Compare password with hashed password
exports.comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
