// Email validation
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
exports.validateUsername = (username) => {
  // Username should be 3-20 characters, alphanumeric, and may include underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Message content validation
exports.validateMessageContent = (content) => {
  // Ensure message is not empty and within reasonable length (up to 2000 chars)
  return content && content.trim().length > 0 && content.length <= 2000;
};

// Validate registration input
exports.validateRegistration = (userData) => {
  const errors = {};
  
  // Validate username
  if (!userData.username) {
    errors.username = 'Username is required';
  } else if (!exports.validateUsername(userData.username)) {
    errors.username = 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
  }
  
  // Validate email
  if (!userData.email) {
    errors.email = 'Email is required';
  } else if (!exports.validateEmail(userData.email)) {
    errors.email = 'Please provide a valid email address';
  }
  
  // Validate password
  if (!userData.password) {
    errors.password = 'Password is required';
  } else if (userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate login input
exports.validateLogin = (userData) => {
  const errors = {};
  
  // Validate username
  if (!userData.username) {
    errors.username = 'Username is required';
  }
  
  // Validate password
  if (!userData.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate message input
exports.validateMessage = (messageData) => {
  const errors = {};
  
  // Validate recipient
  if (!messageData.recipientId) {
    errors.recipientId = 'Recipient is required';
  }
  
  // Validate content
  if (!messageData.content) {
    errors.content = 'Message content is required';
  } else if (!exports.validateMessageContent(messageData.content)) {
    errors.content = 'Message content must be between 1 and 2000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
