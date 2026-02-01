# Deployment Guide

## Overview

SnapAsset uses a multi-environment deployment strategy with automated CI/CD pipelines.

## Environments

### Development
- **Purpose:** Local development
- **URL:** http://localhost:5173
- **Branch:** Any feature branch
- **Deployment:** Local only

### Staging
- **Purpose:** Pre-production testing
- **URL:** https://staging.snapasset.app
- **Branch:** `develop`
- **Deployment:** Automatic on push to develop
- **Platform:** Railway

### Production
- **Purpose:** Live production environment
- **URL:** https://snapasset.app
- **Branch:** `main`
- **Deployment:** Automatic on release
- **Platform:** Railway

## Deployment Process

### Staging Deployment

1. **Automatic Trigger:**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/your-feature
   git push origin develop
   ```

2. **Manual Trigger:**
   - Go to Actions tab
   - Select "Deploy to Staging"
   - Click "Run workflow"
   - Select `develop` branch

3. **Verification:**
   - Check workflow logs
   - Visit staging URL
   - Run smoke tests
   - Verify functionality

### Production Deployment

1. **Create Release:**
   ```bash
   # Ensure main is up to date
   git checkout main
   git pull origin main
   
   # Merge develop into main
   git merge develop
   git push origin main
   ```

2. **Automatic Release:**
   - Semantic release will automatically create a version
   - GitHub Release will be published
   - Production deployment triggers automatically

3. **Manual Release (if needed):**
   - Go to Actions tab
   - Select "Release Automation"
   - Click "Run workflow"
   - Choose release type (patch/minor/major)

4. **Verification:**
   - Monitor deployment logs
   - Check production URL
   - Verify all features work
   - Monitor error tracking (Sentry)

## Environment Configuration

### Required Environment Variables

#### Staging
```env
NODE_ENV=staging
VITE_API_URL=https://staging-api.snapasset.app
VITE_SUPABASE_URL=your_staging_supabase_url
VITE_SUPABASE_ANON_KEY=your_staging_supabase_key
```

#### Production
```env
NODE_ENV=production
VITE_API_URL=https://api.snapasset.app
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
```

### Setting Environment Variables in Railway

1. Go to Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add environment variables
5. Redeploy if needed

## Rollback Procedures

### Quick Rollback (Railway Dashboard)

1. Go to Railway project
2. Navigate to Deployments
3. Find last working deployment
4. Click "Redeploy"

### Git-based Rollback

```bash
# Find the commit to revert to
git log --oneline

# Revert to that commit
git revert <commit-hash>
git push origin main
```

### Emergency Rollback

```bash
# Force rollback (use with caution)
git reset --hard <previous-commit>
git push -f origin main
```

## Monitoring

### Post-Deployment Checks

- [ ] Application loads successfully
- [ ] All routes are accessible
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Database connections are stable
- [ ] No console errors
- [ ] Performance metrics are normal

### Monitoring Tools

1. **Railway Logs:** Real-time application logs
2. **GitHub Actions:** Deployment workflow status
3. **Browser DevTools:** Client-side errors
4. **Lighthouse:** Performance metrics

## Troubleshooting

### Deployment Fails

1. **Check Workflow Logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Review error messages

2. **Common Issues:**
   - Missing environment variables
   - Build failures
   - Railway service issues
   - Network timeouts

3. **Solutions:**
   - Verify all secrets are set
   - Test build locally
   - Check Railway service status
   - Retry deployment

### Application Not Loading

1. Check Railway logs
2. Verify environment variables
3. Check database connection
4. Review recent changes
5. Rollback if necessary

### Performance Issues

1. Check Lighthouse scores
2. Review bundle sizes
3. Check API response times
4. Monitor database queries
5. Review recent changes

## Best Practices

### Before Deployment

- ✅ Run tests locally
- ✅ Build project locally
- ✅ Review code changes
- ✅ Update documentation
- ✅ Test in staging first

### During Deployment

- ✅ Monitor deployment logs
- ✅ Watch for errors
- ✅ Have rollback plan ready
- ✅ Notify team members

### After Deployment

- ✅ Verify functionality
- ✅ Check performance
- ✅ Monitor error rates
- ✅ Update changelog
- ✅ Close related issues

## CI/CD Pipeline Integration

All deployments go through the CI/CD pipeline:

1. **Code pushed to branch**
2. **CI checks run:**
   - Linting
   - Tests
   - Build
   - Security scans
3. **If checks pass:**
   - Deploy to appropriate environment
   - Run smoke tests
   - Send notifications
4. **If checks fail:**
   - Block deployment
   - Notify developer
   - Provide failure details

## Manual Deployment (Emergency Only)

### Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

### Direct Git Push (Not Recommended)

```bash
# Only use in emergencies
railway up --service production
```

## Security Considerations

- Never commit secrets or API keys
- Use environment variables for all sensitive data
- Regularly rotate API keys and tokens
- Review dependency security alerts
- Keep all dependencies up to date
- Monitor for unauthorized access

## Support

For deployment issues:
1. Check this guide
2. Review workflow logs
3. Check Railway status page
4. Contact DevOps team
5. Create issue with details

---

**Last Updated:** February 2026  
**Maintained by:** Darshan Pania