const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');

// Register a new user
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await global.db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Insert new user
    const newUser = await global.db.query(
      `INSERT INTO users 
       (username, email, password_hash, verification_token, is_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [username, email, hashedPassword, verificationToken, false]
    );
    
    // Assign default role (Normal User)
    await global.db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [newUser.rows[0].id, 3] // Assuming 3 is Normal User role ID
    );
    
    // Send verification email
    const verificationUrl = `${process.env.API_URL}/api/auth/verify-email?token=${verificationToken}`;
    await emailService.sendVerificationEmail(email, username, verificationUrl);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: newUser.rows[0].id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email address
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  
  try {
    // Find user with the verification token
    const result = await global.db.query(
      'SELECT * FROM users WHERE verification_token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }
    
    const user = result.rows[0];
    
    // Mark user as verified
    await global.db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user
    const result = await global.db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      isVerified: user.is_verified
    });
    
    const refreshToken = tokenService.generateRefreshToken(user.id);
    
    // Store refresh token in database
    await global.db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
      [user.id, refreshToken.token, refreshToken.expiresAt]
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken: refreshToken.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }
  
  try {
    // Verify the refresh token exists in the database and is valid
    const tokenResult = await global.db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Get user data
    const userResult = await global.db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.id = $1',
      [tokenData.user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generate new access token
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      isVerified: user.is_verified
    });
    
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    // Remove refresh token from database
    await global.db.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
