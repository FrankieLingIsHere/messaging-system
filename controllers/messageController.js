// Message controller for handling message operations

// Send a message from one user to another
exports.sendMessage = async (req, res) => {
  const { content, recipientId } = req.body;
  const senderId = req.user.userId; // From JWT token
  
  try {
    // Check if recipient exists
    const recipientExists = await global.db.query(
      'SELECT * FROM users WHERE id = $1',
      [recipientId]
    );
    
    if (recipientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    
    // Insert message into database
    const result = await global.db.query(
      `INSERT INTO messages 
       (sender_id, recipient_id, content, is_read, sent_at) 
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, sent_at`,
      [senderId, recipientId, content, false]
    );
    
    const newMessage = {
      id: result.rows[0].id,
      senderId,
      recipientId,
      content,
      isRead: false,
      sentAt: result.rows[0].sent_at
    };
    
    // Emit real-time message event to recipient
    if (global.io) {
      global.io.to(`user_${recipientId}`).emit('new_message', newMessage);
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages for the current user
exports.getMessages = async (req, res) => {
  const userId = req.user.userId; // From JWT token
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Different query based on user role
    let result;
    
    if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
      // Admins can see all messages
      result = await global.db.query(
        `SELECT 
          m.id, 
          m.content, 
          m.is_read, 
          m.sent_at, 
          m.read_at,
          sender.id as sender_id, 
          sender.username as sender_username,
          recipient.id as recipient_id, 
          recipient.username as recipient_username
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         JOIN users recipient ON m.recipient_id = recipient.id
         ORDER BY m.sent_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      // Normal users can only see their own messages
      result = await global.db.query(
        `SELECT 
          m.id, 
          m.content, 
          m.is_read, 
          m.sent_at, 
          m.read_at,
          sender.id as sender_id, 
          sender.username as sender_username,
          recipient.id as recipient_id, 
          recipient.username as recipient_username
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         JOIN users recipient ON m.recipient_id = recipient.id
         WHERE m.sender_id = $1 OR m.recipient_id = $1
         ORDER BY m.sent_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
    }
    
    // Get total count for pagination
    let countResult;
    
    if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
      countResult = await global.db.query('SELECT COUNT(*) FROM messages');
    } else {
      countResult = await global.db.query(
        'SELECT COUNT(*) FROM messages WHERE sender_id = $1 OR recipient_id = $1',
        [userId]
      );
    }
    
    const totalMessages = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalMessages / limit);
    
    // Format the messages
    const messages = result.rows.map(msg => ({
      id: msg.id,
      content: msg.content,
      isRead: msg.is_read,
      sentAt: msg.sent_at,
      readAt: msg.read_at,
      sender: {
        id: msg.sender_id,
        username: msg.sender_username
      },
      recipient: {
        id: msg.recipient_id,
        username: msg.recipient_username
      }
    }));
    
    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          totalMessages,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId; // From JWT token
  
  try {
    // Check if message exists and belongs to the user
    const messageResult = await global.db.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    const message = messageResult.rows[0];
    
    // Check permissions - recipient can mark as read, or admins
    if (message.recipient_id !== userId && 
        req.user.role !== 'Super Admin' && 
        req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to mark this message as read'
      });
    }
    
    // Mark as read
    await global.db.query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1',
      [messageId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a message (Super Admin only)
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admins can delete messages'
      });
    }
    
    // Check if message exists
    const messageExists = await global.db.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Delete message
    await global.db.query(
      'DELETE FROM messages WHERE id = $1',
      [messageId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
