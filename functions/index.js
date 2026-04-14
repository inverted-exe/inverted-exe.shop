const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

admin.initializeApp();

const app = express();
app.use(cors({ origin: 'https://inverted-exe.shop' }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const ALLOWED_ADMINS = ['admin@inverted-exe.shop'];

// Rate limiting helper
const loginAttempts = new Map();

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];

  // Remove old attempts (older than 15 minutes)
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

  // Keep only recent attempts
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
  loginAttempts.set(email, recentAttempts);
}

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (rateLimit.blocked) {
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${rateLimit.remainingTime} minutes.`
      });
    }

    try {
      // Verify admin access
      if (!ALLOWED_ADMINS.includes(email)) {
        recordAttempt(email);
        return res.status(403).json({ error: 'Not authorized as admin' });
      }

      // Get user by email
      const user = await admin.auth().getUserByEmail(email);

      // Create session token
      const sessionToken = jwt.sign(
        {
          uid: user.uid,
          email: user.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful login
      console.log(`Admin login successful: ${email}`);

      res.json({
        sessionToken,
        email: user.email,
        displayName: user.displayName || email
      });

    } catch (authError) {
      recordAttempt(email);
      console.error('Authentication error:', authError.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify session token
app.post('/verify-session', (req, res) => {
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
app.get('/admin/data', async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);

    // Fetch data from Firebase (server-side only)
    const snapshot = await admin.database().ref('content').get();
    const data = snapshot.val();

    res.json(data);

  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Protected: Save admin data
app.post('/admin/save', async (req, res) => {
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

    // Save to database (server-side only)
    await admin.database().ref(`content/${type}`).set(data);

    // Log admin action
    await admin.database().ref('admin-logs').push({
      action: 'save_' + type,
      email: decoded.email,
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown'
    });

    console.log(`Admin ${decoded.email} saved ${type} data`);

    res.json({ success: true, message: `${type} saved successfully` });

  } catch (error) {
    console.error('Save error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Logout (token invalidation)
app.post('/logout', (req, res) => {
  // In production, you might want to add token to blacklist
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

exports.auth = functions.https.onRequest(app);
//   response.send("Hello from Firebase!");
// });
