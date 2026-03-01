# Changelog

All notable changes to SnapAsset will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-01

### Added

#### UI Design Polish

- Premium colorful branding with modern gradient design
- Light/dark theme toggle with system preference detection
- Toast notification system
- Settings page for user preferences and API key management

#### BYOK (Bring Your Own Key)

- Secure API key management via Settings page
- Server-side encryption for stored keys
- Multi-model image generation support

#### Local Mode

- Supabase-optional architecture with SQLite/filesystem/JWT fallback
- Local authentication mode for frontend
- Run the full stack without any external services

#### Docker Support

- Dockerized frontend with configurable ports
- Updated Docker Compose for full-stack orchestration
- `.dockerignore` to prevent native module conflicts

#### UX Improvements

- Redesigned login and signup flows
- Enhanced results grid with better image previews
- Real-time analytics updates
- Improved responsive layout

### Changed

- Bumped version to 2.0.0
- Refactored AuthContext for local/Supabase dual-mode support
- Simplified service layer code (AnalyticsService, ProjectService, imageService)

### Fixed

- Security improvements from CodeRabbit review (XSS prevention, input validation)
- Platform presets export for worker import compatibility

### Security

- API keys encrypted at rest with server-side encryption utility
- Hardened authentication flow for both Supabase and local modes

## [1.0.0] - 2026-01-24

### Added

#### Background Job Processing (Issue #6)

- ✅ Bull queue system with Redis support
- ✅ Concurrent job processing with workers
- ✅ Job status tracking and progress updates
- ✅ Automatic retry with exponential backoff (3 attempts)
- ✅ Job priority system
- ✅ Real-time updates via Server-Sent Events (SSE)
- ✅ Queue management endpoints (pause, resume, clean)
- ✅ Job monitoring and statistics
- ✅ Error handling and logging
- ✅ Graceful shutdown handling

#### API Documentation (Issue #12)

- ✅ Complete OpenAPI 3.0 specification
- ✅ Interactive Swagger UI at `/api-docs`
- ✅ Request/response examples for all endpoints
- ✅ Authentication documentation (Bearer token, API key)
- ✅ Error code reference with descriptions
- ✅ Rate limiting documentation
- ✅ API versioning strategy
- ✅ Postman collection generation
- ✅ SDK usage examples (JavaScript, Python)
- ✅ Migration guides

#### Infrastructure

- ✅ Docker support with Dockerfile
- ✅ Docker Compose with Redis
- ✅ GitHub Actions CI/CD workflow
- ✅ Jest test configuration
- ✅ Comprehensive test suite (51+ tests)
- ✅ Performance monitoring setup

#### Documentation

- ✅ API Guide (docs/API_GUIDE.md)
- ✅ Error Codes (docs/ERROR_CODES.md)
- ✅ Deployment Guide (docs/DEPLOYMENT.md)
- ✅ Performance Guide (docs/PERFORMANCE.md)
- ✅ Security Guide (docs/SECURITY.md)
- ✅ API Versioning (docs/API_VERSIONING.md)
- ✅ Quick Start (docs/QUICK_START.md)
- ✅ Server README (server/README.md)

#### Features

- ✅ 8 platform presets (Instagram, Twitter, Facebook, LinkedIn, YouTube)
- ✅ DALL-E 3 integration
- ✅ Sharp image processing
- ✅ Supabase Storage integration
- ✅ Rate limiting (100 req/15min, 20 jobs/hour)
- ✅ Structured logging with Winston
- ✅ Error tracking and reporting
- ✅ Health check endpoint

### Changed

- ♻️ Updated package.json with new dependencies
- ♻️ Enhanced error handling middleware
- ♻️ Improved logging system

### Fixed

- 🐛 Fixed memory leaks in SSE connections
- 🐛 Improved error messages

### Security

- 🔒 Added Helmet security headers
- 🔒 Implemented rate limiting
- 🔒 Added input validation
- 🔒 Secure Redis configuration
- 🔒 CORS configuration

## [0.1.0] - 2026-01-20

### Added

- ✅ Initial Express.js server setup
- ✅ Basic health check endpoint
- ✅ Supabase client configuration
- ✅ CORS and security middleware
- ✅ Environment configuration

## Roadmap

### v2.1.0 (Planned)

- [ ] Webhook notifications
- [ ] Batch job creation
- [ ] Job scheduling (delayed jobs)
- [ ] Custom platform presets
- [ ] Image templates
- [ ] Multiple AI providers

### v3.0.0 (Future)

- [ ] Video generation support
- [ ] Advanced image editing
- [ ] Collaboration features
- [ ] API marketplace
- [ ] GraphQL API

## Migration Guides

- [v0.1 to v1.0](./docs/migrations/v0.1-to-v1.0.md)

## Contributors

- Darshan Pania ([@darshanpania](https://github.com/darshanpania))

## Support

- GitHub Issues: https://github.com/darshanpania/snapasset/issues
- Documentation: http://localhost:3001/api-docs
- Email: support@snapasset.com

---

[2.0.0]: https://github.com/darshanpania/snapasset/releases/tag/v2.0.0
[1.0.0]: https://github.com/darshanpania/snapasset/releases/tag/v1.0.0
[0.1.0]: https://github.com/darshanpania/snapasset/releases/tag/v0.1.0
