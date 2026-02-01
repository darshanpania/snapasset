# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline implemented for SnapAsset.

## Overview

The SnapAsset CI/CD pipeline is designed to ensure code quality, security, and reliable deployments through automated testing, analysis, and deployment workflows.

## Pipeline Architecture

```
Commit/PR → Code Quality → Build & Test → Security Scan → Deploy
             ├─ Linting         ├─ Matrix       ├─ CodeQL      ├─ Staging
             ├─ Formatting      │  Builds       ├─ Audit       └─ Production
             └─ Type Check      ├─ Unit Tests   └─ OWASP
                                └─ E2E Tests
```

## Workflows

### 1. Enhanced CI Pipeline (`ci-enhanced.yml`)

**Trigger:** Push to main/develop, Pull Requests

**Jobs:**
- **Code Quality:** ESLint, Prettier, npm audit
- **Build & Test:** Matrix builds across Node.js versions (18, 20, 21) and OSes (Ubuntu, Windows, macOS)
- **Security Scan:** npm audit, OWASP dependency check
- **Bundle Analysis:** Size analysis and visualization
- **Performance Test:** Lighthouse CI audits
- **Notification:** Status updates

**Features:**
- ✅ Parallel job execution
- ✅ Dependency caching
- ✅ Artifact uploads
- ✅ Continue-on-error for non-critical checks

### 2. CodeQL Security Analysis (`codeql-analysis.yml`)

**Trigger:** Push, PR, Weekly schedule

**Purpose:** Automated security vulnerability scanning using GitHub's CodeQL

**Features:**
- Security-extended queries
- Quality analysis
- Automated vulnerability detection

### 3. Release Automation (`release.yml`)

**Trigger:** Push to main, Manual dispatch

**Purpose:** Automated semantic versioning and release creation

**Features:**
- ✅ Semantic versioning (major.minor.patch)
- ✅ Automated CHANGELOG generation
- ✅ GitHub Release creation
- ✅ Release artifact uploads
- ✅ NPM publishing (optional)

**Commit Message Convention:**
```
feat: New feature (minor version bump)
fix: Bug fix (patch version bump)
perf: Performance improvement (patch version bump)
BREAKING CHANGE: Breaking change (major version bump)
docs: Documentation changes (no version bump)
chore: Maintenance tasks (no version bump)
```

### 4. Dependency Updates (`dependency-update.yml`)

**Trigger:** Weekly schedule, Manual dispatch

**Purpose:** Automated dependency updates and security patches

**Features:**
- ✅ Weekly dependency checks
- ✅ Automated PR creation
- ✅ Security vulnerability fixes
- ✅ Build verification

**Dependabot Configuration:**
- Weekly npm dependency updates
- Weekly GitHub Actions updates
- Grouped minor/patch updates
- Auto-reviewers assigned

### 5. Deployment Workflows

#### Staging Deployment (`deploy-staging.yml`)
**Trigger:** Push to develop

**Environment:** https://staging.snapasset.app

**Process:**
1. Build with staging configuration
2. Deploy to Railway staging environment
3. Run smoke tests
4. Send deployment notification

#### Production Deployment (`deploy-production.yml`)
**Trigger:** Release published

**Environment:** https://snapasset.app

**Process:**
1. Full test suite execution
2. Production build
3. Backup point creation
4. Deploy to Railway production
5. Deployment verification
6. Rollback on failure

#### PR Preview (`pr-preview.yml`)
**Trigger:** Pull request opened/updated

**Purpose:** Create preview deployments for PRs

**Features:**
- ✅ Automatic preview URL generation
- ✅ PR comment with preview link
- ✅ Netlify integration

### 6. Performance Monitoring (`performance-monitoring.yml`)

**Trigger:** Every 6 hours, Manual dispatch

**Purpose:** Continuous performance monitoring

**Metrics:**
- Lighthouse scores
- Bundle size tracking
- Performance budgets
- Core Web Vitals

### 7. Accessibility Testing (`accessibility-test.yml`)

**Trigger:** Pull requests

**Purpose:** Ensure WCAG compliance

**Tools:**
- Pa11y for automated accessibility testing
- Axe for accessibility rule checking

## Configuration Files

### `.releaserc.json`
Semantic release configuration for automated versioning and changelog generation.

### `.prettierrc.json` & `.prettierignore`
Code formatting standards configuration.

### `.size-limit.json`
Bundle size limits and monitoring configuration.

### `.github/dependabot.yml`
Automated dependency update configuration.

## Environment Variables

### Required Secrets

#### GitHub
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

#### npm (Optional)
- `NPM_TOKEN` - For npm package publishing

#### Railway (Deployment)
- `RAILWAY_TOKEN` - Railway API token for deployments

#### Netlify (PR Previews)
- `NETLIFY_AUTH_TOKEN` - Netlify authentication token
- `NETLIFY_SITE_ID` - Netlify site identifier

#### Application Secrets

**Staging:**
- `STAGING_API_URL`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`

**Production:**
- `PRODUCTION_API_URL`
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`

## Setting Up Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each required secret with its value

## Branch Strategy

```
main (production)
  ├─ develop (staging)
  │   ├─ feature/* (feature branches)
  │   ├─ fix/* (bug fix branches)
  │   └─ hotfix/* (hotfix branches)
```

### Workflow:
1. Create feature branch from `develop`
2. Open PR to `develop` for staging deployment
3. Merge to `develop` triggers staging deployment
4. Create release from `develop` to `main`
5. Merge to `main` triggers production deployment

## Monitoring and Alerts

### Built-in Notifications
- Pipeline status in PR comments
- Deployment status notifications
- Security vulnerability alerts
- Dependency update notifications

### External Monitoring (Recommended)
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Google Analytics** - Usage analytics
- **Uptimerobot** - Uptime monitoring

## Performance Budgets

| Metric | Target | Maximum |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | 2.5s |
| Largest Contentful Paint | < 2.5s | 4.0s |
| Total Bundle Size | < 400KB | 500KB |
| CSS Bundle Size | < 40KB | 50KB |
| Lighthouse Performance | > 90 | > 85 |

## Rollback Procedures

### Automatic Rollback
Production deployment workflow includes automatic rollback on failure.

### Manual Rollback

1. **GitHub Release Rollback:**
   ```bash
   # Revert to previous release
   git revert <commit-sha>
   git push origin main
   ```

2. **Railway Rollback:**
   - Go to Railway dashboard
   - Select previous deployment
   - Click "Redeploy"

3. **Emergency Rollback:**
   ```bash
   # Force push previous commit
   git reset --hard <previous-commit-sha>
   git push -f origin main
   ```

## Troubleshooting

### Common Issues

#### Pipeline Fails on Build
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

#### Deployment Fails
- Verify all environment variables are set
- Check Railway/Netlify service status
- Review deployment logs

#### Tests Fail
- Run tests locally: `npm run build`
- Check for environment-specific issues
- Review test logs

#### Security Scan Fails
- Review vulnerability reports
- Update vulnerable dependencies
- Add exceptions for false positives (with justification)

## Best Practices

### Commit Messages
- Use conventional commit format
- Be descriptive but concise
- Reference issue numbers

### Pull Requests
- Keep PRs focused and small
- Ensure all checks pass before review
- Request reviews from team members
- Test preview deployments

### Deployments
- Always deploy to staging first
- Monitor staging for issues
- Schedule production deployments during low-traffic periods
- Have rollback plan ready

### Security
- Review Dependabot PRs promptly
- Address security vulnerabilities immediately
- Keep dependencies up to date
- Never commit secrets

## Maintenance

### Weekly Tasks
- Review and merge Dependabot PRs
- Check performance metrics
- Review security scan results

### Monthly Tasks
- Review and update performance budgets
- Audit unused dependencies
- Review and optimize workflows

### Quarterly Tasks
- Update Node.js versions in matrix builds
- Review and update documentation
- Evaluate new tools and practices

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Railway Documentation](https://docs.railway.app/)

## Support

For issues or questions:
1. Check this documentation
2. Review workflow logs
3. Create an issue in the repository
4. Contact the DevOps team

---

**Last Updated:** February 2026  
**Maintained by:** Darshan Pania  
**Version:** 1.0.0