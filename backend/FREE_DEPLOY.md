# 🚀 FREE Backend Deployment - Render

## Render Free Tier Setup

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create Web Service
1. Click "New" > "Web Service"
2. Connect your GitHub repository
3. Configure settings:
   - **Name**: inverted-backend
   - **Root Directory**: `backend/`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Environment Variables
Add these in Render dashboard:

```
JWT_SECRET=ae8852eec7020eb4fdd7502db2767c2d79735876801072d9cb61a3201b8b6346
ALLOWED_ORIGIN=https://inverted-exe.shop
FIREBASE_PROJECT_ID=inverted-exe-database
FIREBASE_DB_URL=https://inverted-exe-database-default-rtdb.firebaseio.com/
NODE_ENV=production
```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Get your URL: `https://your-app.onrender.com`

## Alternative: Railway Free Tier

Railway gives $5 free credit (enough for ~1 month free usage):

1. [Railway.app](https://railway.app)
2. Connect GitHub repo
3. Set root directory: `backend/`
4. Add same environment variables
5. Deploy

## Alternative: Fly.io Free Tier

1. [Fly.io](https://fly.io)
2. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
3. `fly launch` in backend folder
4. `fly deploy`

## Testing Your Backend

After deployment, test with:
```bash
curl https://your-backend-url.onrender.com/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Update Frontend URLs

Replace `http://localhost:3000` with your deployed URL in:
- `admin/login.html`
- `admin/admin.js`