const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Simple in-memory storage for testing (replace with Firebase later)
let testData = {
  shop: [],
  archive: [],
  gallery: []
};

// Security middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-development';
const ALLOWED_ADMINS = ['admin@inverted-exe.shop'];

// Rate limiting helper
const loginAttempts = new Map();

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);

  if (recentAttempts.length >= 5) {
    return { blocked: true, remainingTime: Math.ceil((recentAttempts[0] + 15 * 60 * 1000 - now) / 1000 / 60) };
  }
  return { blocked: false };
}

function recordAttempt(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];
  attempts.push(now);
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
  loginAttempts.set(email, recentAttempts);
}

// Mock Firebase auth for testing
function mockVerifyIdToken(idToken) {
  // Simple mock - in production, use real Firebase verification
  if (idToken === 'test-token') {
    return Promise.resolve({
      uid: 'test-uid',
      email: 'admin@inverted-exe.shop',
      name: 'Admin User'
    });
  }
  return Promise.reject(new Error('Invalid token'));
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, idToken } = req.body;

    if (!email || !idToken) {
      return res.status(400).json({ error: 'Email and ID token required' });
    }

    const rateLimit = checkRateLimit(email);
    if (rateLimit.blocked) {
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${rateLimit.remainingTime} minutes.`
      });
    }

    try {
      const decodedToken = await mockVerifyIdToken(idToken);

      if (!ALLOWED_ADMINS.includes(email)) {
        recordAttempt(email);
        return res.status(403).json({ error: 'Not authorized as admin' });
      }

      const sessionToken = jwt.sign(
        {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`Admin login successful: ${email}`);

      res.json({
        sessionToken,
        email: decodedToken.email,
        displayName: decodedToken.name || email
      });

    } catch (firebaseError) {
      recordAttempt(email);
      console.error('Token verification failed:', firebaseError.message);
      return res.status(401).json({ error: 'Invalid identity token' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify session token
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });

  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// Protected: Get admin data
app.get('/api/admin/data', async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);

    // Return test data (replace with Firebase later)
    res.json(testData);

  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Protected: Save admin data
app.post('/api/admin/save', async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { type, data } = req.body;

    if (!['shop', 'archive', 'gallery'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Save to test data (replace with Firebase later)
    testData[type] = data;

    console.log(`Admin ${decoded.email} saved ${type} data`);

    res.json({ success: true, message: `${type} saved successfully` });

  } catch (error) {
    console.error('Save error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint for development
app.post('/api/auth/test-login', (req, res) => {
  const { email } = req.body;

  if (email === 'admin@inverted-exe.shop') {
    const sessionToken = jwt.sign(
      {
        uid: 'test-uid',
        email: email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      sessionToken,
      email: email,
      displayName: 'Test Admin'
    });
  } else {
    res.status(401).json({ error: 'Test login only for admin@inverted-exe.shop' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Test login available at: http://localhost:${PORT}/api/auth/test-login`);
});