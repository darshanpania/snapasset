# Security Guide

Security best practices for SnapAsset API.

## Authentication

### JWT Tokens

**Validation:**
```javascript
import jwt from 'jsonwebtoken';

async function validateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        code: 'UNAUTHORIZED',
      });
    }
    
    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  }
}
```

**Best Practices:**
- ✅ Always verify tokens server-side
- ✅ Check token expiration
- ✅ Use short-lived access tokens (1 hour)
- ✅ Implement token refresh
- ✅ Revoke tokens on logout

### API Keys

```javascript
// For service-to-service auth
const validApiKeys = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
]);

function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !validApiKeys.has(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'UNAUTHORIZED',
    });
  }
  
  next();
}
```

## Input Validation

### Sanitize Input

```javascript
import validator from 'validator';

function validateJobInput(data) {
  // Validate UUID
  if (!validator.isUUID(data.userId, 4)) {
    throw new Error('Invalid user ID format');
  }
  
  // Sanitize prompt
  const prompt = validator.trim(data.prompt);
  const sanitized = validator.escape(prompt);
  
  // Length validation
  if (sanitized.length < 10 || sanitized.length > 1000) {
    throw new Error('Prompt must be 10-1000 characters');
  }
  
  return { ...data, prompt: sanitized };
}
```

### Prevent Injection

```javascript
// Never use string concatenation in SQL
// Use parameterized queries
const { data } = await supabase
  .from('generations')
  .select('*')
  .eq('user_id', userId); // Safe

// NOT: WHERE user_id = '${userId}' // Unsafe!
```

## Rate Limiting

### Implementation

```javascript
import rateLimit from 'express-rate-limit';

// IP-based
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// User-based (more accurate)
import RedisStore from 'rate-limit-redis';

const userLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:user:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    // Premium users get higher limits
    return req.user?.isPremium ? 100 : 20;
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

## Data Protection

### Encryption

```javascript
// Encrypt sensitive data
import crypto from 'crypto';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

### Secure Headers

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://storage.supabase.co'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## CORS

### Secure Configuration

```javascript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Secrets Management

### Environment Variables

**Never commit:**
- ❌ API keys
- ❌ Database passwords
- ❌ JWT secrets
- ❌ Service credentials

**Use:**
- ✅ .env files (gitignored)
- ✅ Railway/Vercel env vars
- ✅ AWS Secrets Manager
- ✅ HashiCorp Vault

### Rotation

```bash
# Rotate API keys regularly
# 1. Generate new key
# 2. Update environment
# 3. Redeploy
# 4. Revoke old key after 24 hours
```

## Job Security

### User Isolation

```javascript
// Ensure users can only access their own jobs
router.get('/api/jobs/:jobId', validateAuth, async (req, res) => {
  const job = await imageGenerationQueue.getJob(req.params.jobId);
  
  // Verify ownership
  if (job.data.userId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own jobs',
      code: 'FORBIDDEN',
    });
  }
  
  res.json(job);
});
```

### Prompt Sanitization

```javascript
// Remove potentially harmful content
function sanitizePrompt(prompt) {
  // Remove URLs
  prompt = prompt.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove email addresses
  prompt = prompt.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');
  
  // Limit length
  prompt = prompt.substring(0, 1000);
  
  return prompt.trim();
}
```

## Redis Security

### Authentication

```bash
# In redis.conf
requirepass your-strong-password

# Bind to specific IP
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

### TLS Encryption

```javascript
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: true,
  },
});
```

## Audit Logging

```javascript
// Log all job creations
router.post('/api/jobs', async (req, res) => {
  const job = await createJob(req.body);
  
  // Audit log
  logger.info('Job created', {
    jobId: job.id,
    userId: req.user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });
  
  res.json(job);
});
```

## Security Checklist

### Development
- [ ] Use .env for secrets
- [ ] Never commit credentials
- [ ] Validate all inputs
- [ ] Sanitize user data
- [ ] Use parameterized queries
- [ ] Enable CORS properly
- [ ] Add rate limiting
- [ ] Implement authentication

### Production
- [ ] Use HTTPS only
- [ ] Strong Redis password
- [ ] Rotate API keys regularly
- [ ] Monitor for suspicious activity
- [ ] Enable audit logging
- [ ] Keep dependencies updated
- [ ] Run security scans
- [ ] Set up alerts
- [ ] Backup regularly
- [ ] Test disaster recovery

## Vulnerability Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## Incident Response

### Security Incident Checklist

1. **Detect**
   - Monitor logs for unusual activity
   - Check error rates
   - Review failed login attempts

2. **Respond**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Recover**
   - Restore from backup
   - Patch vulnerabilities
   - Rotate all secrets

4. **Review**
   - Analyze incident
   - Update security measures
   - Document lessons learned

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@snapasset.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix

We'll respond within 24 hours.

## Support

- Security questions: security@snapasset.com
- General support: support@snapasset.com