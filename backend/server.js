const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

// Security middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://inverted-exe.shop',
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, idToken } = req.body;

    if (!email || !idToken) {
      return res.status(400).json({ error: 'Email and ID token required' });
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (rateLimit.blocked) {
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${rateLimit.remainingTime} minutes.`
      });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Verify admin access
      if (!ALLOWED_ADMINS.includes(email)) {
        recordAttempt(email);
        return res.status(403).json({ error: 'Not authorized as admin' });
      }

      // Create session token
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
      console.error('Firebase verification failed:', firebaseError.message);
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

// Protected: Upload images
app.post('/api/admin/upload-images', async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);
    const { images, type } = req.body; // images: array of base64 strings, type: 'shop' or 'gallery'

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const bucket = admin.storage().bucket();
    const uploadedUrls = [];

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];
      if (!base64Data.startsWith('data:image/')) {
        continue; // Skip non-image data
      }

      // Extract mime type and base64 data
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) continue;

      const mimeType = matches[1];
      const base64String = matches[2];
      const buffer = Buffer.from(base64String, 'base64');

      // Create unique filename
      const fileName = `${type}_${Date.now()}_${i}.${mimeType}`;
      const file = bucket.file(`images/${fileName}`);

      // Upload to Firebase Storage
      await file.save(buffer, {
        metadata: {
          contentType: `image/${mimeType}`,
        },
        public: true, // Make file publicly accessible
      });

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/images/${fileName}`;
      uploadedUrls.push(publicUrl);
    }

    res.json({ urls: uploadedUrls });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Logout

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});