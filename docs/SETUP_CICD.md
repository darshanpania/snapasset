# CI/CD Pipeline Setup Guide

This guide walks you through setting up the enhanced CI/CD pipeline for SnapAsset.

## 🚀 Quick Start

The CI/CD pipeline is already configured! Just follow these steps to activate it:

### 1. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add the following secrets:

#### Required for Deployments
```
RAILWAY_TOKEN             # Your Railway API token
```

#### Required for Production
```
PRODUCTION_API_URL               # Production API URL
PRODUCTION_SUPABASE_URL          # Production Supabase URL
PRODUCTION_SUPABASE_ANON_KEY     # Production Supabase anonymous key
```

#### Required for Staging
```
STAGING_API_URL                  # Staging API URL
STAGING_SUPABASE_URL             # Staging Supabase URL
STAGING_SUPABASE_ANON_KEY        # Staging Supabase anonymous key
```

#### Optional (for PR previews)
```
NETLIFY_AUTH_TOKEN               # Netlify authentication token
NETLIFY_SITE_ID                  # Netlify site ID
```

#### Optional (for npm publishing)
```
NPM_TOKEN                        # npm token for package publishing
```

### 2. Install Dependencies

After merging this PR, run:

```bash
npm install
```

This will install all the new CI/CD related packages.

### 3. Configure GitHub Environments

1. Go to **Settings → Environments**
2. Create two environments:
   - `staging`
   - `production`
3. For production, add protection rules:
   - Required reviewers
   - Wait timer (optional)
   - Deployment branches: only `main`

## 📋 What's Included

### Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| **Enhanced CI** | Code quality, testing, security | Push, PR |
| **CodeQL Analysis** | Security scanning | Push, PR, Weekly |
| **Dependency Updates** | Automated updates | Weekly, Manual |
| **Release Automation** | Semantic versioning | Push to main |
| **Deploy Staging** | Staging deployment | Push to develop |
| **Deploy Production** | Production deployment | Release |
| **PR Preview** | Preview deployments | PRs |
| **Performance Monitoring** | Performance checks | Every 6 hours |
| **Accessibility Testing** | A11y compliance | PRs |

### Configuration Files

- `.releaserc.json` - Semantic release configuration
- `.prettierrc.json` - Code formatting rules
- `.prettierignore` - Files to skip formatting
- `.size-limit.json` - Bundle size limits
- `.github/dependabot.yml` - Dependency updates

### Documentation

- `docs/CICD_PIPELINE.md` - Complete pipeline documentation
- `docs/DEPLOYMENT_GUIDE.md` - Deployment procedures
- `docs/SETUP_CICD.md` - This setup guide

## 🔧 Configuration Steps

### Step 1: Railway Setup

1. Create a Railway account at https://railway.app
2. Create two services:
   - `snapasset-staging`
   - `snapasset-production`
3. Get your Railway API token:
   - Go to Account Settings → Tokens
   - Create a new token
   - Add it as `RAILWAY_TOKEN` in GitHub secrets

### Step 2: Netlify Setup (Optional, for PR Previews)

1. Create a Netlify account at https://netlify.com
2. Create a new site
3. Get your credentials:
   - Personal access token from User Settings → Applications
   - Site ID from Site Settings → General
4. Add them as GitHub secrets

### Step 3: Enable Dependabot

Dependabot is automatically configured! It will:
- Check for dependency updates weekly
- Create PRs for security updates
- Group minor and patch updates

No additional setup needed.

### Step 4: Branch Protection

Protect your main branches:

1. Go to **Settings → Branches**
2. Add rule for `main`:
   - Require pull request reviews
   - Require status checks (select the CI workflows)
   - Require conversation resolution
   - Include administrators
3. Add rule for `develop`:
   - Require status checks
   - Require conversation resolution

## 🎯 Usage

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update documentation"
   ```

3. Push and create a PR:
   ```bash
   git push origin feature/my-feature
   ```

4. PR checks will run automatically:
   - Code quality checks
   - Build and test
   - Security scans
   - Preview deployment

### Deploying to Staging

1. Merge your PR to `develop`:
   ```bash
   git checkout develop
   git merge feature/my-feature
   git push origin develop
   ```

2. Automatic staging deployment will trigger
3. Check https://staging.snapasset.app

### Deploying to Production

1. Merge `develop` to `main`:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. Semantic release will:
   - Analyze commits
   - Determine version bump
   - Generate changelog
   - Create GitHub release
   - Trigger production deployment

## 📊 Monitoring

### GitHub Actions

Monitor all workflows in the **Actions** tab:
- View running/completed workflows
- Check logs for failures
- Manually trigger workflows

### Railway Dashboard

Monitor deployments:
- View deployment logs
- Check resource usage
- Monitor errors
- Access environment variables

### Performance

Lighthouse CI runs automatically:
- On every PR
- Every 6 hours on production
- Check artifacts for detailed reports

## 🔒 Security

### Automated Security Checks

- **CodeQL:** Weekly security analysis
- **npm audit:** On every CI run
- **OWASP Dependency Check:** On every CI run
- **Dependabot:** Weekly dependency updates

### Handling Security Issues

1. Review security alerts in the Security tab
2. Dependabot will create PRs for vulnerabilities
3. Review and merge security updates promptly
4. For critical issues, create hotfix branches

## 🐛 Troubleshooting

### CI Fails

**Issue:** Build fails in CI but works locally

**Solutions:**
- Ensure all dependencies are in package.json
- Check Node.js version compatibility
- Review CI logs for specific errors
- Test with `npm ci` instead of `npm install`

### Deployment Fails

**Issue:** Deployment to Railway fails

**Solutions:**
- Check Railway service status
- Verify environment variables are set
- Check Railway logs for errors
- Ensure `RAILWAY_TOKEN` is valid

### Release Not Created

**Issue:** No release after merging to main

**Solutions:**
- Check commit messages follow conventional format
- Ensure commits include version-bumping changes
- Review release workflow logs
- Check `[skip ci]` is not in commit message

### Dependabot PRs Failing

**Issue:** Dependabot PRs fail CI checks

**Solutions:**
- Review the updated package
- Check for breaking changes
- Update code if needed
- May need to skip major version updates

## 🎨 Customization

### Adjusting CI Checks

Edit `.github/workflows/ci-enhanced.yml`:

```yaml
# Add/remove Node.js versions
matrix:
  node-version: [18, 20, 21]  # Modify this

# Adjust performance budgets
- name: Check bundle size
  run: npx size-limit  # Uses .size-limit.json
```

### Modifying Release Configuration

Edit `.releaserc.json`:

```json
{
  "branches": ["main"],  // Add more branches
  "plugins": [
    // Add/remove plugins
  ]
}
```

### Changing Deployment Triggers

Edit deployment workflows:

```yaml
on:
  push:
    branches: [develop]  # Change branch
  workflow_dispatch:     # Allow manual trigger
```

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## ✅ Verification Checklist

After setup, verify:

- [ ] All secrets are configured in GitHub
- [ ] Railway services are created and linked
- [ ] Branch protection rules are active
- [ ] Dependabot is enabled
- [ ] CI workflow runs successfully
- [ ] Test deployment to staging works
- [ ] Code quality checks pass
- [ ] Security scans complete

## 🆘 Getting Help

If you encounter issues:

1. Check the documentation in `docs/`
2. Review workflow logs in Actions tab
3. Check Railway deployment logs
4. Create an issue with:
   - Description of the problem
   - Relevant logs
   - Steps to reproduce
   - Expected vs actual behavior

## 🎉 Next Steps

After setup is complete:

1. ✅ Merge this PR
2. ✅ Run `npm install`
3. ✅ Configure secrets
4. ✅ Set up Railway services
5. ✅ Enable branch protection
6. ✅ Test the pipeline with a feature branch
7. ✅ Deploy to staging
8. ✅ Create your first release

---

**Questions?** Review the comprehensive documentation in `docs/CICD_PIPELINE.md`

**Ready to deploy?** Check out `docs/DEPLOYMENT_GUIDE.md`
