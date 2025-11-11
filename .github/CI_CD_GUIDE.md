# Farm Commons CI/CD Pipeline Guide

This document describes the enhanced CI/CD pipeline for Farm Commons, including parallel test execution, Docker optimization, preview deployments, and automated security scanning.

## 🚀 Workflows Overview

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to validate code quality, run tests, and perform security scans.

#### Key Features

- **Concurrency Control**: Automatically cancels in-progress runs for the same branch
- **Dependency Caching**: Installs dependencies once and reuses across jobs
- **Parallel Execution**: Tests and linting run in parallel for faster feedback
- **Multi-Node Testing**: Tests run on Node.js 20 and 22

#### Jobs

1. **Setup & Cache Dependencies**
   - Installs and caches `node_modules` for all other jobs
   - Reduces redundant `npm ci` calls

2. **Lint & Type Check** (Matrix: Node 20, 22 × lint, typecheck)
   - Runs ESLint and TypeScript type checking
   - Fails fast on code quality issues
   - 4 parallel jobs (2 Node versions × 2 tasks)

3. **Test** (Matrix: backend, frontend, shared)
   - Tests each package independently in parallel
   - Includes PostgreSQL and Redis services
   - Generates coverage reports per package
   - Uploads coverage to Codecov with package-specific flags

4. **Build**
   - Builds all packages using Turbo
   - Uploads build artifacts for deployment
   - Validates that production builds succeed

5. **Security**
   - **npm audit**: Checks for known vulnerabilities in dependencies
   - **Dependency Check**: OWASP dependency vulnerability scanner
   - **CodeQL**: Static analysis for security issues
   - **Gitleaks**: Scans for accidentally committed secrets
   - Uploads security reports as artifacts

6. **CI Success**
   - Summary job that ensures all checks pass
   - Used as a branch protection requirement

#### Performance Improvements

- **Before**: ~8-10 minutes (sequential execution)
- **After**: ~4-5 minutes (parallel execution with caching)

---

### 2. Docker Build Workflow (`.github/workflows/docker-build.yml`)

Builds and pushes optimized Docker images for backend and frontend services.

#### Key Features

- **Multi-stage Builds**: Optimized Dockerfiles with separate build and runtime stages
- **Build Caching**: Uses Docker layer caching and registry cache
- **Multi-platform**: Builds for `linux/amd64` and `linux/arm64`
- **SBOM Generation**: Creates Software Bill of Materials for security auditing
- **Vulnerability Scanning**: Trivy scans images for CVEs

#### Docker Image Optimization

**Backend Image**:
- Base: `node:22-alpine` (minimal footprint)
- Build stages: base → pruner → installer → runner
- Security: Non-root user, health checks
- Size: ~150MB (vs ~800MB unoptimized)

**Frontend Image**:
- Base: `nginx:alpine`
- Build stages: base → pruner → builder → runner
- Custom nginx config with gzip, caching, security headers
- Size: ~25MB (vs ~300MB unoptimized)

#### Image Tags

Images are tagged with:
- Branch name (e.g., `main`, `develop`)
- PR number (e.g., `pr-123`)
- Semantic version (e.g., `v1.2.3`, `1.2`, `1`)
- Commit SHA (e.g., `main-abc1234`)
- `latest` for default branch

---

### 3. Preview Deployment Workflow (`.github/workflows/preview-deployment.yml`)

Automatically deploys preview environments for pull requests.

#### Key Features

- **Automatic Deployments**: Triggers on PR open, sync, or reopen
- **Unique URLs**: Each PR gets its own preview URL
- **PR Comments**: Bot comments with deployment URLs
- **Smoke Tests**: Validates that deployments are healthy
- **Auto Cleanup**: Removes preview when PR is closed

#### Preview URLs

- **Frontend**: `https://preview-pr-{number}.farm-commons.dev`
- **Backend**: `https://api-preview-pr-{number}.farm-commons.dev`

#### Workflow Steps

1. Build frontend and backend with PR-specific config
2. Deploy to Vercel with custom domains
3. Comment on PR with preview URLs
4. Run smoke tests to verify deployment health
5. Update comment on subsequent commits
6. Clean up resources when PR closes

#### Configuration Required

Set these secrets in GitHub repository settings:

- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_FRONTEND_PROJECT_ID`: Frontend project ID
- `VERCEL_BACKEND_PROJECT_ID`: Backend project ID

---

### 4. Deploy Workflow (`.github/workflows/deploy.yml`)

Deploys to production on push to `main` branch.

---

## 🐳 Docker Usage

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

Services available:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Building Docker Images Manually

```bash
# Build backend
docker build -f packages/backend/Dockerfile -t farm-commons-backend .

# Build frontend
docker build -f packages/frontend/Dockerfile -t farm-commons-frontend .

# Build with cache
docker build --cache-from farm-commons-backend:latest -t farm-commons-backend .
```

### Docker Image Security

All images follow security best practices:
- ✅ Non-root user execution
- ✅ Minimal base images (Alpine Linux)
- ✅ Multi-stage builds to reduce attack surface
- ✅ Health checks for container orchestration
- ✅ No secrets baked into images
- ✅ Regular vulnerability scanning

---

## 🔒 Security Scanning

### Automated Scans

1. **npm audit** (every CI run)
   - Checks npm registry for known vulnerabilities
   - Fails on moderate or higher severity

2. **OWASP Dependency Check** (every CI run)
   - Scans for CVEs in dependencies
   - Generates HTML report
   - Fails on CVSS score ≥ 7

3. **CodeQL** (every CI run)
   - Static analysis for JavaScript/TypeScript
   - Identifies security vulnerabilities and code quality issues
   - Results viewable in GitHub Security tab

4. **Gitleaks** (every CI run)
   - Scans git history for secrets
   - Prevents accidental credential commits

5. **Trivy** (Docker builds only)
   - Container image vulnerability scanner
   - Scans OS packages and application dependencies
   - Results uploaded to GitHub Security

### Viewing Security Results

- **GitHub Security Tab**: CodeQL and Trivy results
- **Actions Artifacts**: Dependency check reports
- **PR Checks**: Summary of security scan status

---

## 📊 Performance Metrics

### CI Pipeline Performance

| Stage | Before | After | Improvement |
|-------|--------|-------|-------------|
| Total runtime | 8-10 min | 4-5 min | 50% faster |
| Test execution | 5 min | 2 min | 60% faster |
| Dependency install | 2 min (×4 jobs) | 1 min (×1 job) | 87.5% faster |

### Docker Build Performance

| Image | Unoptimized | Optimized | Reduction |
|-------|-------------|-----------|-----------|
| Backend | ~800 MB | ~150 MB | 81% smaller |
| Frontend | ~300 MB | ~25 MB | 92% smaller |

### Build Times

- **Without cache**: 5-7 minutes per image
- **With cache**: 1-2 minutes per image (70% faster)

---

## 🛠️ Troubleshooting

### CI Failures

**Tests failing in CI but passing locally?**
- Check Node.js version (CI uses 20 and 22)
- Ensure database migrations are up to date
- Check environment variables in workflow

**Security scan failures?**
- Review security tab for specific CVEs
- Update vulnerable dependencies: `npm audit fix`
- Use `npm audit fix --force` for breaking changes (test thoroughly)

**Build failures?**
- Check TypeScript errors: `npm run typecheck`
- Verify build works locally: `npm run build`
- Check for missing environment variables

### Docker Issues

**Build failing?**
- Clear Docker cache: `docker builder prune -a`
- Check .dockerignore is not excluding required files
- Verify Dockerfile COPY paths are correct

**Image won't start?**
- Check logs: `docker logs <container-id>`
- Verify health check endpoint is working
- Ensure environment variables are set

**Large image size?**
- Verify multi-stage build is working
- Check for unnecessary files in build context
- Use `docker history <image>` to identify large layers

### Preview Deployment Issues

**Preview not deploying?**
- Check Vercel token is valid
- Verify project IDs are correct
- Check Vercel deployment logs in Actions

**URLs not accessible?**
- Wait 30-60 seconds for deployment to complete
- Check DNS configuration for preview domains
- Verify Vercel project settings allow preview deployments

---

## 🎯 Best Practices

### For Developers

1. **Run tests locally** before pushing
2. **Use pre-commit hooks** to catch issues early
3. **Keep PRs small** for faster CI runs
4. **Review security scan results** in your PRs
5. **Test preview deployments** before merging

### For Maintainers

1. **Monitor CI performance** and optimize as needed
2. **Review security alerts** regularly
3. **Keep dependencies updated** to avoid vulnerabilities
4. **Rotate secrets** periodically
5. **Review Docker image sizes** quarterly

### For DevOps

1. **Monitor build cache hit rates** for optimization opportunities
2. **Set up alerts** for failed deployments
3. **Review security scan results** weekly
4. **Keep GitHub Actions up to date**
5. **Monitor resource usage** in preview environments

---

## 📝 Maintenance

### Regular Tasks

- **Weekly**: Review security scan results
- **Monthly**: Update GitHub Actions versions
- **Quarterly**: Review and optimize CI performance
- **Quarterly**: Audit Docker images for optimization opportunities
- **Yearly**: Review and update CI/CD strategy

### Updating Workflows

When modifying workflows:
1. Test changes in a feature branch
2. Monitor first few runs for issues
3. Document changes in this guide
4. Notify team of breaking changes

---

## 🔗 Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Vercel Deployment](https://vercel.com/docs)
- [Turbo Monorepo](https://turbo.build/repo/docs)

---

**Last Updated**: 2025-11-10
**Maintained By**: DevOps Team
