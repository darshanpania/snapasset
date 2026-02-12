# CI/CD Pipeline Setup

This document describes the enhanced CI/CD pipeline for SnapAsset.

## Overview

The CI/CD pipeline includes:

- **Automated Testing**: Multi-version Node.js testing across platforms
- **Code Quality Checks**: Linting, formatting, and bundle analysis
- **Security Scanning**: CodeQL, Snyk, and dependency audits
- **Performance Testing**: Lighthouse CI and load testing
- **Automated Releases**: Semantic versioning and changelog generation
- **Deployment**: Staging and production deployments with rollback
- **Notifications**: Slack notifications for deployment status

## Workflows

### 1. Test Suite (`.github/workflows/test.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Matrix Strategy**:
- Node.js versions: 18, 20, 21
- Operating systems: Ubuntu, Windows, macOS

**Features**:
- Dependency caching for faster builds
- Parallel test execution
- Build artifact upload

### 2. Code Quality (`.github/workflows/code-quality.yml`)

**Checks**:
- ESLint for code linting
- Prettier for code formatting
- Bundle size analysis
- TypeScript type checking

### 3. Security Scanning (`.github/workflows/security.yml`)

**Scans**:
- NPM security audit
- CodeQL analysis
- Dependency review for PRs
- Snyk vulnerability scanning

**Schedule**: Weekly on Mondays + on every push/PR

### 4. Performance Testing (`.github/workflows/performance.yml`)

**Tests**:
- Lighthouse CI for web vitals
- Load testing with k6
- Bundle analysis and visualization

### 5. Release (`.github/workflows/release.yml`)

**Features**:
- Semantic versioning
- Automated changelog generation
- GitHub release creation
- Build artifacts attachment
- Release notifications

**Triggered**: On push to `main` branch

### 6. Deploy to Staging (`.github/workflows/deploy-staging.yml`)

**Features**:
- Automatic deployment on `develop` branch push
- Environment-specific configuration
- Smoke tests after deployment
- Deployment notifications

**Environment**: `staging`

### 7. Deploy to Production (`.github/workflows/deploy-production.yml`)

**Features**:
- Triggered by version tags (v*.*.*)
- Full test suite execution
- Backup creation before deployment
- Health checks after deployment
- Automatic rollback on failure

**Environment**: `production`

## Setup Instructions

### 1. Required Secrets

Add these secrets to your GitHub repository:

```
# Deployment
RAILWAY_TOKEN=<your-railway-token>
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>

# Staging Environment
STAGING_API_URL=<staging-api-url>
STAGING_SUPABASE_URL=<staging-supabase-url>
STAGING_SUPABASE_ANON_KEY=<staging-supabase-key>

# Production Environment
PRODUCTION_API_URL=<production-api-url>
PRODUCTION_SUPABASE_URL=<production-supabase-url>
PRODUCTION_SUPABASE_ANON_KEY=<production-supabase-key>

# Security Scanning
SNYK_TOKEN=<your-snyk-token>

# Notifications
SLACK_WEBHOOK=<your-slack-webhook-url>
```

### 2. Enable Dependabot

Dependabot is configured to:
- Check for npm dependency updates weekly
- Check for GitHub Actions updates weekly
- Create PRs with version updates
- Limit open PRs to 10 for npm, 5 for actions

### 3. Configure Environments

Create two GitHub environments:

1. **staging**
   - No required reviewers
   - Auto-deploy on `develop` branch

2. **production**
   - Required reviewers (recommended)
   - Manual approval before deployment
   - Branch protection rules

### 4. Semantic Versioning

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: New feature (minor version bump)
fix: Bug fix (patch version bump)
chore: Maintenance (patch version bump)
docs: Documentation (patch version bump)
BREAKING CHANGE: Breaking change (major version bump)
```

### 5. Performance Monitoring

Lighthouse CI runs on every PR and push to main:
- Performance score
- Accessibility score
- Best practices score
- SEO score

Results are uploaded as artifacts and can be viewed in the Actions tab.

## Best Practices

### 1. Branch Strategy

```
main (production)
  └─ develop (staging)
       └─ feature/* (development)
```

### 2. Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Open PR to `develop`
4. Wait for all checks to pass
5. Get code review
6. Merge to `develop` (deploys to staging)
7. Test on staging
8. Create PR from `develop` to `main`
9. Merge to `main` (triggers release and production deployment)

### 3. Release Process

1. Merge to `main` triggers release workflow
2. Semantic Release analyzes commits
3. New version is calculated
4. Changelog is generated
5. Git tag is created
6. GitHub release is published
7. Production deployment is triggered
8. Notifications are sent

### 4. Rollback Process

If a deployment fails:

1. Automatic rollback is attempted
2. Notifications are sent
3. Manual rollback steps:
   ```bash
   # Revert the merge commit
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```

## Monitoring and Alerts

### 1. GitHub Actions

- View workflow runs in Actions tab
- Check logs for failures
- Download artifacts for analysis

### 2. Slack Notifications

Receive notifications for:
- Deployment successes
- Deployment failures
- New releases

### 3. Performance Metrics

- Lighthouse scores in PR comments
- Bundle size changes in PR comments
- Load test results in artifacts

## Troubleshooting

### Failed Tests

1. Check test logs in Actions tab
2. Run tests locally: `npm test`
3. Fix issues and push again

### Failed Deployments

1. Check deployment logs
2. Verify environment variables
3. Check service status (Railway/Vercel)
4. Roll back if necessary

### Security Alerts

1. Check Dependabot PRs
2. Review security advisories
3. Update dependencies
4. Test thoroughly

## Maintenance

### Weekly Tasks

- Review Dependabot PRs
- Check security scan results
- Monitor performance metrics

### Monthly Tasks

- Review and update workflows
- Check for new GitHub Actions versions
- Review and archive old releases

### Quarterly Tasks

- Audit all dependencies
- Review and update security policies
- Performance optimization review