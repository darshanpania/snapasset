# API Versioning

SnapAsset API versioning strategy and guidelines.

## Current Version

**Version:** 1.0.0  
**Release Date:** January 24, 2026  
**Status:** Stable

## Versioning Strategy

### Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Format

**URL-based versioning:**
```
https://api.snapasset.com/v1/jobs
https://api.snapasset.com/v2/jobs
```

**Current:** Version is implicit (v1)
```
https://api.snapasset.com/api/jobs  # Same as v1
```

## Version History

### v1.0.0 (Current) - January 2026

**Features:**
- Job queue system with Bull and Redis
- Image generation with DALL-E 3
- 8 platform presets
- Real-time updates via SSE
- Rate limiting
- Comprehensive API documentation

**Endpoints:**
- `POST /api/jobs` - Create job
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/jobs` - List jobs
- `POST /api/jobs/:jobId/retry` - Retry job
- `DELETE /api/jobs/:jobId/cancel` - Cancel job
- `GET /api/sse/jobs/:jobId` - Real-time updates
- `GET /api/queue/stats` - Queue statistics
- `POST /api/queue/pause` - Pause queue
- `POST /api/queue/resume` - Resume queue
- `POST /api/queue/clean` - Clean queue

## Breaking Changes Policy

### What is a Breaking Change?

- Removing an endpoint
- Removing a field from response
- Changing field type
- Changing authentication method
- Changing rate limits (lower)
- Changing error codes

### What is NOT a Breaking Change?

- Adding new endpoints
- Adding new fields to response
- Adding new optional parameters
- Changing rate limits (higher)
- Bug fixes
- Performance improvements

## Deprecation Policy

### Deprecation Timeline

1. **Announce** - 3 months before removal
2. **Mark as deprecated** - Add `Deprecated` header
3. **Document migration** - Provide migration guide
4. **Remove** - After 6 months minimum

### Deprecated Endpoint Headers

```http
HTTP/1.1 200 OK
Deprecated: true
Sunset: Sat, 24 Jul 2026 00:00:00 GMT
Link: <https://api.snapasset.com/docs/migration>; rel="deprecation"
```

### Example Deprecation Notice

```json
{
  "warning": "This endpoint is deprecated and will be removed on July 24, 2026",
  "migration": "Use POST /v2/jobs instead",
  "documentation": "https://api.snapasset.com/docs/migration"
}
```

## Migration Guides

### Future: v1 to v2 (When Available)

**Changed Endpoints:**

| v1 Endpoint | v2 Endpoint | Changes |
|-------------|-------------|----------|
| `POST /api/jobs` | `POST /v2/jobs` | TBD |

**Migration Steps:**

1. Review [migration guide](https://api.snapasset.com/docs/v1-to-v2)
2. Update API calls to v2 endpoints
3. Test in staging environment
4. Deploy to production
5. Monitor for errors

## Backward Compatibility

### Supporting Old Versions

- v1 will be supported for minimum 12 months after v2 release
- Security patches applied to all supported versions
- Bug fixes backported when critical

### Version Support Matrix

| Version | Status | Support Until | Security Updates |
|---------|--------|---------------|------------------|
| v1.0.0 | Current | TBD | Yes |
| v0.x.x | Deprecated | July 2026 | Critical only |

## Best Practices

### For API Consumers

1. **Always specify version** in production:
   ```javascript
   const API_BASE = 'https://api.snapasset.com/v1';
   ```

2. **Handle deprecation warnings**:
   ```javascript
   const response = await fetch(url);
   if (response.headers.get('Deprecated')) {
     console.warn('Using deprecated endpoint:', url);
     // Plan migration
   }
   ```

3. **Test with new versions early**:
   ```javascript
   // Test v2 in development
   const baseUrl = process.env.NODE_ENV === 'development'
     ? 'https://api.snapasset.com/v2'
     : 'https://api.snapasset.com/v1';
   ```

4. **Subscribe to changelog**:
   - Watch GitHub repository
   - Subscribe to mailing list
   - Check `/api/changelog` endpoint

### For API Maintainers

1. **Avoid breaking changes** in minor/patch versions
2. **Document all changes** in CHANGELOG.md
3. **Provide migration guides** for major versions
4. **Support old versions** for reasonable time
5. **Communicate early** about deprecations

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for detailed version history.

## Support

- Version questions: support@snapasset.com
- Migration help: https://github.com/darshanpania/snapasset/discussions