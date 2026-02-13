# 🚀 Railway Deployment Quick Start

Get SnapAsset deployed on Railway in under 10 minutes!

## ⚡ 5-Minute Deploy

### Step 1: Prerequisites (1 minute)

- Railway account: [railway.app/new](https://railway.app/new)
- Supabase project: [app.supabase.com](https://app.supabase.com)
- GitHub repo: Fork or use `darshanpania/snapasset`

### Step 2: Deploy to Railway (2 minutes)

**Option A: One-Click Deploy**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/snapasset)

**Option B: Manual Deploy**

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select `snapasset` repository
4. Click "Deploy Now"

### Step 3: Configure Environment (2 minutes)

In Railway project settings → Variables, add:

```bash
# Required
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
ALLOWED_ORIGINS=https://your-app.railway.app

# Optional
OPENAI_API_KEY=sk-...
```

**Get Supabase credentials:**
1. Open [app.supabase.com](https://app.supabase.com)
2. Go to Settings → API
3. Copy URL and service_role key

### Step 4: Verify Deployment (< 1 minute)

```bash
# Check health
curl https://your-app.railway.app/health

# Expected:
# {"status":"ok","timestamp":"...","uptime":...}
```

🎉 **Done!** Your app is live at `https://your-app.railway.app`

---

## 📋 Complete Deployment Checklist

### Before Deployment
- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] Storage buckets configured
- [ ] RLS policies enabled
- [ ] Environment variables ready

### Deployment
- [ ] Railway project created
- [ ] GitHub repo connected
- [ ] Environment variables set
- [ ] Deploy triggered

### After Deployment
- [ ] Health check passes
- [ ] Frontend loads
- [ ] API responding
- [ ] Database connected
- [ ] Custom domain (optional)

---

## 🔧 Common Configurations

### Custom Domain

```bash
# 1. Add domain in Railway settings
# 2. Add DNS CNAME record:
#    Type: CNAME
#    Name: your-app
#    Value: your-app.railway.app

# 3. Update ALLOWED_ORIGINS:
ALLOWED_ORIGINS=https://your-domain.com
```

### Database Connection

```bash
# Already handled by Supabase!
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Static Assets

```bash
# Automatically served from dist/ directory
# No configuration needed!
```

---

## 🐛 Quick Troubleshooting

### Build Fails

```bash
# Check logs in Railway dashboard
# Common fix: Clear build cache

railway run npm cache clean --force
```

### Server Won't Start

```bash
# Verify environment variables are set
railway variables

# Required variables:
# - NODE_ENV
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

### 404 on Frontend

```bash
# Check build artifacts
ls -la dist/

# Should contain:
# index.html, assets/, etc.
```

### CORS Errors

```bash
# Update ALLOWED_ORIGINS in Railway
ALLOWED_ORIGINS=https://your-app.railway.app,https://your-domain.com
```

---

## 📚 Full Documentation

- **Complete Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Environment Variables**: [.env.railway.example](../.env.railway.example)
- **Configuration Files**: 
  - `railway.json` - Project config
  - `nixpacks.toml` - Build config

---

## 🔄 Update Deployed App

```bash
# Just push to main branch!
git add .
git commit -m "Update app"
git push origin main

# Railway auto-deploys 🚀
```

---

## 🆘 Need Help?

- [Railway Discord](https://discord.gg/railway)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/darshanpania/snapasset/issues)
- [Full Deployment Guide](./RAILWAY_DEPLOYMENT.md)

---

## ✅ Deployment Success!

Once deployed, you should have:

✅ Frontend at `https://your-app.railway.app`  
✅ API at `https://your-app.railway.app/api`  
✅ Health check at `https://your-app.railway.app/health`  
✅ Auto-deployments on push  
✅ SSL certificate (automatic)  

**What's next?**

1. ✨ Configure custom domain
2. 📊 Set up monitoring
3. 🎨 Customize your app
4. 🚀 Share with users!

---

**Deployed successfully?** Give the repo a ⭐ star!
