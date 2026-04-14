# 🚀 Backend Authentication - Railway Deployment Guide

## Quick Deploy Steps

### 1. Setup Railway Account
- Go to [Railway.app](https://railway.app)
- Sign up/login with GitHub

### 2. Create New Project
- Click "New Project" > "Deploy from GitHub repo"
- Select your repository
- Set **Root Directory**: `backend/`
- Click "Deploy"

### 3. Configure Environment Variables
In Railway dashboard > your project > Variables:

```
JWT_SECRET=ae8852eec7020eb4fdd7502db2767c2d79735876801072d9cb61a3201b8b6346
ALLOWED_ORIGIN=https://inverted-exe.shop
FIREBASE_PROJECT_ID=inverted-exe-database
FIREBASE_DB_URL=https://inverted-exe-database-default-rtdb.firebaseio.com/
```

### 4. Update Frontend URLs
Replace `http://localhost:3000` in these files with your Railway URL:
- `admin/login.html`
- `admin/admin.js`

Example: `https://your-app.up.railway.app`

## 🧪 Local Testing

```bash
cd backend
npm run test
```

Open `backend/test.html` in browser to test API endpoints.

## 📋 API Endpoints

- `POST /api/auth/login` - Admin login
- `POST /api/auth/test-login` - Test login (dev only)
- `POST /api/auth/verify` - Verify session
- `GET /api/admin/data` - Get admin data
- `POST /api/admin/save` - Save admin data

## 🔐 Security Features

- JWT tokens (24h expiry)
- Rate limiting (5 attempts/15min)
- Admin email whitelist
- CORS protection
- Session-based auth

## 🔄 Next Steps After Deploy

1. Test login with Railway URL
2. Add Firebase service account credentials to Railway env vars
3. Switch from test server to production server
4. Update Firebase Database security rules