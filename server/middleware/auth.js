const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const getSessionId = (req, res, next) => {
  let sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    const { v4: uuidv4 } = require('uuid');
    sessionId = uuidv4();
    res.setHeader('X-Session-ID', sessionId);
    
    // Create session in database
    db.createSession(sessionId, (err) => {
      if (err) {
        console.error('Error creating session:', err);
      }
    });
  }
  
  req.sessionId = sessionId;
  next();
};

module.exports = {
  authenticateToken,
  authenticateOptional,
  requireAdmin,
  getSessionId
};