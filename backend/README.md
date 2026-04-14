# Backend Authentication Setup

## Overview
This backend provides secure authentication for the !nverted.exe admin panel, moving sensitive operations from the client-side to server-side.

## Security Benefits
- ✅ API keys hidden from frontend
- ✅ Authentication logic server-side only
- ✅ Database access controlled by backend
- ✅ Session tokens with expiration
- ✅ Rate limiting on login attempts
- ✅ Audit logging for admin actions

## Deployment Options

### Option 1: Railway (Free Tier Available)
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `backend/` folder
4. Set environment variables in Railway dashboard

### Option 2: Render (Free Tier Available)
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo pointing to `backend/` folder
4. Set environment variables

### Option 3: Vercel (Free Tier Available)
1. Go to [Vercel.com](https://vercel.com)
2. Import project from GitHub
3. Set root directory to `backend/`
4. Configure environment variables

### Option 4: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`
4. Set config vars: `heroku config:set KEY=value`

## Environment Variables Setup

### Firebase Service Account
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Download JSON file
4. Extract values for environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_DB_URL=https://your-project-default-rtdb.firebaseio.com/
```

### JWT Secret
```bash
JWT_SECRET=your-super-secure-jwt-secret-key
```

### Server Config
```bash
ALLOWED_ORIGIN=https://yourdomain.com
PORT=3000
```

## Frontend Configuration

After deploying backend, update these URLs in your frontend files:

### admin/login.html
Replace `https://your-backend-url.com` with your actual backend URL

### admin/admin.js
Replace `https://your-backend-url.com` with your actual backend URL

## Testing

1. Start backend locally: `cd backend && npm start`
2. Test health endpoint: `curl http://localhost:3000/health`
3. Test with frontend login

## API Endpoints

- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify session token
- `GET /api/admin/data` - Get admin data
- `POST /api/admin/save` - Save admin data
- `POST /api/auth/logout` - Logout
- `GET /health` - Health check

## Security Features

- Rate limiting (5 attempts per 15 minutes)
- JWT tokens with 24h expiration
- Admin email whitelist
- Firebase ID token verification
- Audit logging
- CORS protection
- Input validation

## Migration from Client-Side Auth

1. ✅ Deploy this backend
2. ✅ Update frontend URLs
3. ✅ Test login flow
4. ✅ Remove client-side Firebase Auth logic
5. ✅ Update database rules to restrict public access

## Troubleshooting

### Common Issues:
- **CORS errors**: Check ALLOWED_ORIGIN environment variable
- **Firebase errors**: Verify service account credentials
- **JWT errors**: Check JWT_SECRET is set correctly
- **Database errors**: Ensure Firebase DB URL is correct

### Logs:
Check deployment platform logs for detailed error messages.