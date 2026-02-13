# ✅ SnapAsset Deployment Checklist

Complete pre-deployment and post-deployment checklist for Railway.

## 🎯 Pre-Deployment Checklist

### 1. Prerequisites

- [ ] Railway account created
- [ ] Supabase project created
- [ ] OpenAI API key obtained (optional)
- [ ] GitHub repository accessible
- [ ] Domain name ready (optional)

### 2. Supabase Configuration

- [ ] Database schema created
- [ ] Storage buckets configured (`generated-images`, `user-avatars`, `temp-uploads`)
- [ ] RLS policies enabled on all tables
- [ ] Auth providers configured (email, Google, GitHub, Discord)
- [ ] Email templates customized
- [ ] Redirect URLs added (`https://your-app.railway.app/auth/callback`)

### 3. Environment Variables Ready

**Required:**
- [ ] `SUPABASE_URL` - From Supabase Settings → API
- [ ] `SUPABASE_SERVICE_KEY` - Service role key from Supabase
- [ ] `SUPABASE_ANON_KEY` - Anon public key from Supabase
- [ ] `ALLOWED_ORIGINS` - Your Railway domain

**Optional:**
- [ ] `OPENAI_API_KEY` - For AI image generation
- [ ] `SENTRY_DSN` - For error tracking
- [ ] `LOGROCKET_APP_ID` - For session replay

### 4. Code Validation

- [ ] All tests passing (`npm test`)
- [ ] Linter passing (`npm run lint`)
- [ ] Build successful locally (`npm run build`)
- [ ] Server starts correctly (`cd server && npm start`)
- [ ] No console errors
- [ ] No TypeScript errors (if using TS)

### 5. Repository Configuration

- [ ] `.gitignore` includes `.env` files
- [ ] No sensitive data in repository
- [ ] `railway.json` configured
- [ ] `nixpacks.toml` configured
- [ ] `package.json` scripts correct
- [ ] Dependencies up to date

---

## 🚀 Deployment Checklist

### 1. Create Railway Project

- [ ] Go to [railway.app/new](https://railway.app/new)
- [ ] Click "Deploy from GitHub repo"
- [ ] Select `darshanpania/snapasset` repository
- [ ] Wait for project creation

### 2. Configure Environment Variables

**In Railway Dashboard → Variables:**

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001` (or Railway auto-assigns)
- [ ] `SUPABASE_URL` = `https://xxx.supabase.co`
- [ ] `SUPABASE_SERVICE_KEY` = `eyJhbG...` (service role)
- [ ] `SUPABASE_ANON_KEY` = `eyJhbG...` (anon public)
- [ ] `ALLOWED_ORIGINS` = `https://your-app.railway.app`
- [ ] `OPENAI_API_KEY` = `sk-...` (if using AI generation)

### 3. Configure Build Settings

**Should be automatic, but verify:**

- [ ] Build command: `npm install && npm run build && cd server && npm install`
- [ ] Start command: `cd server && npm start`
- [ ] Root directory: `/`
- [ ] Health check path: `/health`

### 4. Deploy

- [ ] Click "Deploy" in Railway dashboard
- [ ] OR push to main branch (auto-deploys)
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Monitor build logs for errors

### 5. Verify Deployment

**Health Checks:**
- [ ] Access `https://your-app.railway.app/health`
- [ ] Response: `{"status":"ok",...}`
- [ ] Access `https://your-app.railway.app/health/detailed`
- [ ] All checks show "ok"

**Frontend:**
- [ ] Access `https://your-app.railway.app/`
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Supabase connects

**API:**
- [ ] Access `https://your-app.railway.app/api`
- [ ] Returns API info
- [ ] Try a test endpoint

---

## 🌐 Post-Deployment Checklist

### 1. Custom Domain (Optional)

- [ ] Add custom domain in Railway Settings → Domains
- [ ] Add CNAME record to DNS provider
- [ ] Wait for DNS propagation (~5-30 minutes)
- [ ] Verify SSL certificate provisioned
- [ ] Update `ALLOWED_ORIGINS` with custom domain
- [ ] Test custom domain

### 2. Update Supabase Configuration

- [ ] Add Railway domain to Supabase Auth → URL Configuration
  - Site URL: `https://your-app.railway.app`
  - Redirect URLs: `https://your-app.railway.app/auth/callback`
- [ ] Update CORS settings if needed
- [ ] Test authentication flow

### 3. Monitoring Setup

**Basic (Included):**
- [ ] View logs in Railway dashboard
- [ ] Monitor health checks
- [ ] Check resource usage (CPU, memory)

**Advanced (Optional):**
- [ ] Set up Sentry for error tracking
- [ ] Configure LogRocket for session replay
- [ ] Add uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up alerts for downtime

### 4. Testing

**Functionality Tests:**
- [ ] User signup works
- [ ] User login works
- [ ] OAuth providers work (Google, GitHub, Discord)
- [ ] Image generation works
- [ ] Image upload works
- [ ] Image download works
- [ ] Profile editing works

**Performance Tests:**
- [ ] Health check: <100ms ✓
- [ ] API endpoints: <200ms ✓
- [ ] Page load: <2s ✓
- [ ] No memory leaks
- [ ] No excessive CPU usage

**Security Tests:**
- [ ] HTTPS enforced
- [ ] CORS working correctly
- [ ] Authentication required for protected routes
- [ ] RLS preventing unauthorized access
- [ ] No sensitive data in responses

### 5. Documentation

- [ ] Update README with live URL
- [ ] Add deployment status badge
- [ ] Update API documentation with production URL
- [ ] Document any deployment-specific configurations

---

## 📊 Ongoing Monitoring Checklist

### Daily

- [ ] Check error rates in logs
- [ ] Monitor response times
- [ ] Review health check status
- [ ] Check resource usage

### Weekly

- [ ] Review Sentry errors (if configured)
- [ ] Check uptime percentage
- [ ] Review slow requests
- [ ] Check storage usage (Supabase)
- [ ] Review security logs

### Monthly

- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Check for Railway service updates
- [ ] Review performance trends
- [ ] Audit security configurations
- [ ] Test backup restoration

---

## 🐛 Troubleshooting Checklist

### Build Fails

- [ ] Check build logs in Railway
- [ ] Verify Node.js version (18.x)
- [ ] Check for missing dependencies
- [ ] Verify build command in railway.json
- [ ] Clear build cache: `railway run npm cache clean --force`

### Server Won't Start

- [ ] Check deployment logs
- [ ] Verify environment variables are set
- [ ] Check server/index.js for syntax errors
- [ ] Verify port binding (should be 0.0.0.0)
- [ ] Check for missing dependencies

### Frontend Not Loading

- [ ] Verify build created `dist/` directory
- [ ] Check static file middleware in server/index.js
- [ ] Verify SPA fallback route is configured
- [ ] Check for console errors in browser
- [ ] Verify CORS headers

### Database Connection Fails

- [ ] Verify `SUPABASE_URL` is correct
- [ ] Verify `SUPABASE_SERVICE_KEY` is the service role key
- [ ] Check Supabase project is active
- [ ] Test connection: `curl $SUPABASE_URL/rest/v1/`
- [ ] Check RLS policies aren't blocking

### CORS Errors

- [ ] Verify `ALLOWED_ORIGINS` includes your Railway domain
- [ ] Check CORS middleware configuration
- [ ] Verify Supabase CORS settings
- [ ] Test with browser dev tools

### Health Check Fails

- [ ] Check if server is actually running
- [ ] Verify `/health` endpoint responds
- [ ] Check health check timeout (default 300s)
- [ ] Review health check implementation
- [ ] Check for blocking operations in health check

---

## 📈 Performance Optimization Checklist

### Frontend

- [ ] Enable code splitting
- [ ] Minimize bundle size (<500KB total)
- [ ] Use lazy loading for routes
- [ ] Optimize images before upload
- [ ] Enable service worker (future)

### Backend

- [ ] Enable response compression
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Use connection pooling
- [ ] Cache frequently accessed data

### Infrastructure

- [ ] Enable Railway CDN (automatic)
- [ ] Configure cache headers
- [ ] Use Supabase CDN for storage
- [ ] Monitor response times
- [ ] Scale resources if needed

---

## 🔒 Security Checklist

### Application Security

- [ ] Security headers enabled (Helmet)
- [ ] CORS properly configured
- [ ] Environment variables not exposed
- [ ] No sensitive data in logs
- [ ] Input validation implemented
- [ ] Rate limiting configured (optional)

### Database Security

- [ ] RLS enabled on all tables
- [ ] Service role used only in backend
- [ ] Anon key used in frontend
- [ ] Sensitive data encrypted
- [ ] Regular security audits

### Authentication

- [ ] Auth providers working
- [ ] JWT tokens secure
- [ ] Session management correct
- [ ] Password requirements enforced
- [ ] Email verification working

---

## 📊 Success Criteria

### Deployment Success

✅ **Build completes** without errors  
✅ **Server starts** and stays running  
✅ **Health checks** return 200 OK  
✅ **Frontend loads** without errors  
✅ **API endpoints** respond correctly  
✅ **Database connects** successfully  
✅ **Authentication works** (all providers)  
✅ **SSL certificate** active  
✅ **Custom domain** working (if configured)  

### Performance Success

✅ **Health check:** <100ms  
✅ **API response:** <200ms  
✅ **Page load:** <2s  
✅ **Memory usage:** <200MB  
✅ **CPU usage:** <50%  
✅ **Uptime:** >99%  

### Quality Success

✅ **No errors** in logs  
✅ **No console warnings**  
✅ **All features** working  
✅ **Tests passing** (CI/CD)  
✅ **Documentation** up to date  

---

## 🎉 Deployment Complete!

Once all items are checked:

✅ **Your SnapAsset application is live!**

**URLs:**
- Application: `https://your-app.railway.app`
- Health: `https://your-app.railway.app/health`
- API: `https://your-app.railway.app/api`

**Next Steps:**
1. Share with users
2. Monitor performance
3. Gather feedback
4. Iterate and improve

---

## 📞 Support

- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: [github.com/darshanpania/snapasset/issues](https://github.com/darshanpania/snapasset/issues)
- **Documentation**: [./RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

---

**Congratulations on your deployment!** 🎊
