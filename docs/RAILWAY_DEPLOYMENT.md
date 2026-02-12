# 🚂 Railway Deployment Guide for SnapAsset

Complete guide to deploying SnapAsset on Railway with both frontend and backend.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment Steps](#deployment-steps)
- [Custom Domain Setup](#custom-domain-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

---

## ✅ Prerequisites

Before deploying to Railway, ensure you have:

1. **Railway Account**: [Sign up at Railway.app](https://railway.app)
2. **Supabase Project**: [Create project at Supabase](https://app.supabase.com)
3. **GitHub Repository**: Your SnapAsset repo
4. **Railway CLI** (optional): `npm install -g @railway/cli`

### Required Services

- **Supabase**: Database, Authentication, and Storage
- **OpenAI API Key** (optional): For AI image generation

---

## 🚀 Quick Start

### Option 1: Deploy via Railway Dashboard

1. **Go to Railway Dashboard**
   - Visit [railway.app/new](https://railway.app/new)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select `darshanpania/snapasset` repository

3. **Configure Environment Variables**
   - Go to project settings → Variables
   - Add all required variables (see [Environment Variables](#environment-variables))

4. **Deploy**
   - Railway will automatically detect configuration and deploy
   - Monitor build progress in the deployment logs

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-key
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## 🔐 Environment Variables

### Required Variables

Copy from `.env.railway.example` and configure:

```bash
# Application
NODE_ENV=production
PORT=3001

# Supabase (REQUIRED)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS - Add your Railway domain
ALLOWED_ORIGINS=https://your-app.railway.app

# OpenAI (for image generation)
OPENAI_API_KEY=sk-...
```

### How to Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`
   - **anon public** → `SUPABASE_ANON_KEY`

### How to Add Variables to Railway

**Via Dashboard:**
1. Open your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable

**Via CLI:**
```bash
railway variables set VARIABLE_NAME=value
```

---

## 📦 Deployment Steps

### 1. Prepare Your Repository

```bash
# Clone repository
git clone https://github.com/darshanpania/snapasset.git
cd snapasset

# Install dependencies
npm install
cd server && npm install && cd ..

# Test build locally
npm run build

# Verify server starts
cd server && npm start
```

### 2. Configure Railway

The repository includes these configuration files:

- **`railway.json`**: Railway project configuration
- **`nixpacks.toml`**: Build configuration
- **`server/index.js`**: Server with static file serving

### 3. Deploy to Railway

**Method 1: GitHub Integration (Recommended)**
- Railway will auto-deploy on every push to `main` branch
- Go to Railway dashboard
- Connect GitHub repository
- Select branch to deploy

**Method 2: Manual Deploy**
```bash
railway up
```

### 4. Monitor Deployment

```bash
# View logs
railway logs

# Check deployment status
railway status
```

### 5. Verify Deployment

Once deployed, test your endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Detailed health check
curl https://your-app.railway.app/health/detailed

# API info
curl https://your-app.railway.app/api
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T03:00:00.000Z",
  "uptime": 123,
  "environment": "production"
}
```

---

## 🌐 Custom Domain Setup

### 1. Add Custom Domain in Railway

1. Go to your Railway project
2. Click on Settings
3. Navigate to "Domains"
4. Click "Custom Domain"
5. Enter your domain (e.g., `app.snapasset.com`)

### 2. Configure DNS

Add these DNS records to your domain provider:

**For apex domain (snapasset.com):**
```
Type: CNAME
Name: @
Value: your-app.railway.app
```

**For subdomain (app.snapasset.com):**
```
Type: CNAME
Name: app
Value: your-app.railway.app
```

### 3. Update Environment Variables

```bash
ALLOWED_ORIGINS=https://app.snapasset.com,https://snapasset.com
```

### 4. Wait for SSL Certificate

- Railway automatically provisions SSL certificates
- Usually takes 5-10 minutes
- Check status in Railway dashboard

---

## 📊 Monitoring & Logging

### Built-in Health Checks

SnapAsset includes multiple health check endpoints:

1. **Basic Health Check**: `/health`
   - Quick status check
   - Uptime and timestamp

2. **Detailed Health Check**: `/health/detailed`
   - Memory usage
   - Service checks (Supabase, API)
   - Version information

3. **Readiness Probe**: `/ready`
   - Checks if all services are ready
   - Used by Railway for deployment validation

4. **Liveness Probe**: `/live`
   - Simple ping endpoint
   - Confirms server is responding

### View Logs

**Via Dashboard:**
- Go to Railway project
- Click on your service
- View "Logs" tab

**Via CLI:**
```bash
# Real-time logs
railway logs

# Follow logs
railway logs --follow

# Filter logs
railway logs | grep ERROR
```

### Monitoring Services (Optional)

**1. Sentry (Error Tracking)**
```bash
# Add to Railway variables
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

**2. LogRocket (Session Replay)**
```bash
LOGROCKET_APP_ID=your-app/project
```

**3. Railway Metrics**
- CPU usage
- Memory usage
- Network traffic
- Request volume

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails

**Problem**: `npm install` or `npm run build` fails

**Solutions**:
```bash
# Check Node.js version (should be 18+)
# In railway.json or nixpacks.toml

# Clear cache and rebuild
railway run --service your-service -- npm cache clean --force

# Check for missing dependencies
npm install
```

#### 2. Server Won't Start

**Problem**: Server exits immediately or crashes

**Check**:
```bash
# View logs
railway logs

# Common issues:
# - Missing environment variables
# - Port binding issues
# - Supabase connection errors
```

**Solutions**:
- Verify all required env variables are set
- Check Supabase credentials
- Ensure PORT is correctly configured

#### 3. Static Files Not Serving

**Problem**: Frontend shows 404 or blank page

**Solutions**:
- Verify `dist` directory exists after build
- Check `server/index.js` static file middleware
- Verify build command in `railway.json`

#### 4. CORS Errors

**Problem**: Frontend can't connect to API

**Solution**:
```bash
# Add your Railway domain to ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-app.railway.app,https://your-domain.com
```

#### 5. Supabase Connection Fails

**Problem**: `Supabase not configured` error

**Check**:
1. Verify `SUPABASE_URL` format: `https://xxx.supabase.co`
2. Verify `SUPABASE_SERVICE_KEY` is the **service_role** key
3. Check Supabase project is active
4. Test connection: `curl $SUPABASE_URL/rest/v1/`

### Debug Commands

```bash
# Check environment variables
railway variables

# SSH into container
railway run bash

# Run health check
curl https://your-app.railway.app/health/detailed

# Test locally first
npm run build && cd server && npm start
```

### Getting Help

- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: [github.com/darshanpania/snapasset/issues](https://github.com/darshanpania/snapasset/issues)

---

## ⚡ Performance Optimization

### 1. Enable Caching

Static assets are cached automatically:
- JS/CSS: 1 year cache
- HTML: No cache (SPA)
- Images: 1 year cache

### 2. Optimize Build

```json
// vite.config.js
{
  "build": {
    "minify": "terser",
    "sourcemap": false,
    "rollupOptions": {
      "output": {
        "manualChunks": {
          "vendor": ["react", "react-dom"],
          "router": ["react-router-dom"],
          "supabase": ["@supabase/supabase-js"]
        }
      }
    }
  }
}
```

### 3. Enable Compression

Compression is enabled by default via Helmet middleware.

### 4. Database Optimization

- Use Supabase connection pooling
- Enable RLS policies
- Add appropriate indexes
- Use prepared statements

### 5. Monitor Performance

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.railway.app/health

# Create curl-format.txt:
# time_total:  %{time_total}\n
# time_connect:  %{time_connect}\n
# time_starttransfer:  %{time_starttransfer}\n
```

### 6. Scale Resources

Railway auto-scales, but you can adjust:
- **Memory**: Settings → Resources
- **Replicas**: Settings → Scaling
- **Region**: Settings → Region (choose closest to users)

---

## 🔄 Continuous Deployment

### Automatic Deployments

Railway automatically deploys when you push to your configured branch:

```bash
# Make changes
git add .
git commit -m "feat: new feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys new version
# 4. Runs health checks
# 5. Switches traffic to new deployment
```

### Rollback

If a deployment fails:

**Via Dashboard:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "Redeploy"

**Via CLI:**
```bash
railway rollback
```

### Preview Deployments

Create preview deployments for pull requests:

1. Go to Railway project settings
2. Enable "PR Deploys"
3. Each PR gets a unique URL
4. Test before merging

---

## 📚 Additional Resources

### Documentation
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Documentation](https://expressjs.com)

### Configuration Files
- `railway.json` - Railway project config
- `nixpacks.toml` - Build configuration
- `.env.railway.example` - Environment template
- `scripts/deploy.sh` - Deployment validation script

### Support
- [Railway Community](https://railway.app/discord)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [SnapAsset Issues](https://github.com/darshanpania/snapasset/issues)

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Supabase project created and configured
- [ ] Database schema created
- [ ] Storage buckets created
- [ ] RLS policies enabled
- [ ] Local build successful (`npm run build`)
- [ ] Server starts locally (`cd server && npm start`)
- [ ] Health checks responding
- [ ] CORS origins configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 🎉 Success!

Your SnapAsset application should now be deployed on Railway!

**Your Application URLs:**
- Production: `https://your-app.railway.app`
- Health Check: `https://your-app.railway.app/health`
- API Info: `https://your-app.railway.app/api`

**Next Steps:**
1. Test all functionality
2. Set up monitoring
3. Configure custom domain
4. Enable automatic deployments
5. Set up staging environment

---

**Need help?** Open an issue on [GitHub](https://github.com/darshanpania/snapasset/issues) or ask in Railway Discord!

**Deployed successfully?** Star the repo ⭐ and share your deployment!
