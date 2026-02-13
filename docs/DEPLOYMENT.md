# SnapAsset API Deployment Guide

Guide for deploying SnapAsset API to production.

## Table of Contents

- [Railway Deployment](#railway-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Redis Setup](#redis-setup)
- [Monitoring & Scaling](#monitoring--scaling)

## Railway Deployment

### Prerequisites

- Railway account
- GitHub repository connected
- Supabase project
- OpenAI API key

### Steps

1. **Create New Project**
   ```bash
   railway init
   ```

2. **Add Redis Service**
   - Go to Railway dashboard
   - Click "New" → "Database" → "Add Redis"
   - Note the connection details

3. **Configure Environment Variables**
   
   In Railway dashboard, add:
   ```
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   OPENAI_API_KEY=sk-your-key
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   ALLOWED_ORIGINS=https://snapasset.com,https://www.snapasset.com
   ```

4. **Configure Build**
   
   Railway automatically detects Node.js and uses:
   - Build command: `npm install`
   - Start command: `npm start`

5. **Add Worker Service**
   
   Create a new service for the worker:
   - Same repository
   - Start command: `npm run worker`
   - Same environment variables

6. **Deploy**
   
   ```bash
   git push origin main
   ```
   
   Railway automatically deploys on push.

### Custom Domain

1. Go to Settings → Domains
2. Add custom domain: `api.snapasset.com`
3. Update DNS records
4. SSL automatically provisioned

### Scaling

**API Server:**
- Horizontal: Add more replicas in Railway
- Vertical: Increase memory/CPU

**Worker:**
- Scale to 2-5 instances based on load
- Monitor queue depth

## Docker Deployment

### Build Image

```bash
# Build
docker build -t snapasset-api:latest .

# Tag for registry
docker tag snapasset-api:latest your-registry/snapasset-api:latest

# Push
docker push your-registry/snapasset-api:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
  
  api:
    image: snapasset-api:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    env_file:
      - .env
    depends_on:
      - redis
  
  worker:
    image: snapasset-api:latest
    command: node workers/imageWorker.js
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    env_file:
      - .env
    depends_on:
      - redis
    deploy:
      replicas: 2

volumes:
  redis_data:
```

### Run

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale workers
docker-compose up -d --scale worker=5

# Stop
docker-compose down
```

## Manual Deployment

### On Ubuntu/Debian Server

1. **Install Dependencies**
   
   ```bash
   # Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Redis
   sudo apt-get install -y redis-server
   sudo systemctl start redis
   sudo systemctl enable redis
   
   # PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone Repository**
   
   ```bash
   git clone https://github.com/darshanpania/snapasset.git
   cd snapasset/server
   npm install
   ```

3. **Configure Environment**
   
   ```bash
   cp .env.example .env
   nano .env
   # Add your credentials
   ```

4. **Start with PM2**
   
   ```bash
   # Start API server
   pm2 start index.js --name snapasset-api
   
   # Start worker (2 instances)
   pm2 start workers/imageWorker.js --name snapasset-worker -i 2
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   
   ```nginx
   server {
     listen 80;
     server_name api.snapasset.com;
     
     location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     }
     
     # SSE specific config
     location /api/sse {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Connection '';
       proxy_buffering off;
       proxy_cache off;
       chunked_transfer_encoding off;
     }
   }
   ```

6. **SSL with Let's Encrypt**
   
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.snapasset.com
   ```

## Environment Configuration

### Production Environment

```env
# Server
NODE_ENV=production
PORT=3001
API_URL=https://api.snapasset.com

# Security
ALLOWED_ORIGINS=https://snapasset.com,https://www.snapasset.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-service-key

# OpenAI
OPENAI_API_KEY=sk-your-production-key

# Redis (Railway)
REDIS_HOST=your-railway-redis.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
JOB_RATE_LIMIT_MAX=20
```

### Security Checklist

- [ ] Use strong Redis password
- [ ] Enable Redis AUTH
- [ ] Use HTTPS only
- [ ] Set secure CORS origins
- [ ] Enable Helmet security headers
- [ ] Use environment variables (never commit secrets)
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Regular security updates

## Redis Setup

### Railway Redis

1. Add Redis plugin in Railway
2. Connect to your service
3. Use provided environment variables

### External Redis (Redis Cloud)

1. Create account at redis.com
2. Create new database
3. Get connection details
4. Add to environment:
   ```
   REDIS_HOST=redis-xxxxx.redis.cloud.redislabs.com
   REDIS_PORT=xxxxx
   REDIS_PASSWORD=your-password
   ```

### Local Redis

```bash
# Install
sudo apt-get install redis-server

# Configure
sudo nano /etc/redis/redis.conf
# Set: requirepass your-password

# Restart
sudo systemctl restart redis

# Test
redis-cli -a your-password ping
```

## Monitoring & Scaling

### Health Checks

```bash
# Check API health
curl https://api.snapasset.com/health

# Check queue stats
curl https://api.snapasset.com/api/queue/stats
```

### Logging

**PM2 Logs:**
```bash
pm2 logs snapasset-api
pm2 logs snapasset-worker
```

**Log Rotation:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring Tools

**Recommended:**
- **Railway Metrics** - Built-in monitoring
- **Sentry** - Error tracking
- **LogDNA/Datadog** - Log aggregation
- **New Relic** - APM
- **UptimeRobot** - Uptime monitoring

### Performance Monitoring

```javascript
// Add to server
import prometheus from 'prom-client';

const register = new prometheus.Registry();

// Job metrics
const jobCounter = new prometheus.Counter({
  name: 'jobs_created_total',
  help: 'Total number of jobs created',
  registers: [register]
});

const jobDuration = new prometheus.Histogram({
  name: 'job_duration_seconds',
  help: 'Job processing duration',
  registers: [register]
});

// Expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Auto-Scaling

**Railway:**
- Auto-scales based on CPU/memory
- Configure in railway.json:
  ```json
  {
    "deploy": {
      "numReplicas": 2,
      "sleepApplication": false
    }
  }
  ```

**Docker/Kubernetes:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: snapasset-worker
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: snapasset-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Troubleshooting

### API Not Responding

```bash
# Check process
pm2 status

# View logs
pm2 logs snapasset-api --lines 100

# Restart
pm2 restart snapasset-api
```

### Worker Not Processing

```bash
# Check worker status
pm2 status snapasset-worker

# Check Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# View worker logs
pm2 logs snapasset-worker --lines 100

# Restart workers
pm2 restart snapasset-worker
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD

# Check Redis memory
redis-cli info memory

# Clear Redis (use with caution)
redis-cli FLUSHALL
```

### High Memory Usage

```bash
# Check memory
pm2 status
free -h

# Increase PM2 memory limit
pm2 start index.js --max-memory-restart 1G

# Monitor
pm2 monit
```

## Backup & Recovery

### Redis Backup

```bash
# Create backup
redis-cli --rdb /backup/dump.rdb

# Restore
cp /backup/dump.rdb /var/lib/redis/dump.rdb
sudo systemctl restart redis
```

### Application Backup

```bash
# Backup code
git clone https://github.com/darshanpania/snapasset.git

# Backup .env
cp .env .env.backup

# Backup logs
tar -czf logs-backup.tar.gz logs/
```

## Rollback

### Railway

1. Go to deployments
2. Select previous successful deployment
3. Click "Redeploy"

### PM2

```bash
# Pull previous version
git checkout previous-tag
npm install
pm2 restart all
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Redis connected and tested
- [ ] Supabase connected
- [ ] OpenAI API key valid
- [ ] SSL certificate installed
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Health checks passing
- [ ] Worker processes running
- [ ] Load testing completed
- [ ] Documentation updated

## Support

For deployment issues:
- GitHub Issues: https://github.com/darshanpania/snapasset/issues
- Email: support@snapasset.com