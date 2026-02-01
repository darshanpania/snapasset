import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { createClient } from '@supabase/supabase-js';
import { swaggerSpec } from './config/swagger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import jobsRouter from './routes/jobs.js';
import sseRouter from './routes/sse.js';
import queueRouter from './routes/queue.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️  Supabase credentials not configured. Some features will be limited.');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     supabase:
 *                       type: boolean
 *                     redis:
 *                       type: boolean
 *                     openai:
 *                       type: boolean
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      supabase: !!supabase,
      redis: !!process.env.REDIS_HOST,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'SnapAsset API',
    version: '1.0.0',
    description: 'AI-powered image generation and optimization',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      jobs: '/api/jobs',
      sse: '/api/sse',
      queue: '/api/queue',
    },
    links: {
      github: 'https://github.com/darshanpania/snapasset',
      postman: '/api-docs/postman',
    },
  });
});

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/sse', sseRouter);
app.use('/api/queue', queueRouter);

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SnapAsset API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

// Serve OpenAPI JSON
app.get('/api-docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Generate Postman collection
app.get('/api-docs/postman', (req, res) => {
  const postmanCollection = {
    info: {
      name: 'SnapAsset API',
      description: swaggerSpec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Health Check',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/health',
            host: ['{{baseUrl}}'],
            path: ['health'],
          },
        },
      },
      {
        name: 'Create Job',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              userId: '550e8400-e29b-41d4-a716-446655440000',
              prompt: 'A beautiful sunset over mountains',
              platforms: ['instagram-post', 'twitter-post'],
              options: {
                quality: 'hd',
                style: 'vivid',
              },
            }, null, 2),
          },
          url: {
            raw: '{{baseUrl}}/api/jobs',
            host: ['{{baseUrl}}'],
            path: ['api', 'jobs'],
          },
        },
      },
      {
        name: 'Get Job Status',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/jobs/{{jobId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'jobs', '{{jobId}}'],
          },
        },
      },
      {
        name: 'Get Queue Stats',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/queue/stats',
            host: ['{{baseUrl}}'],
            path: ['api', 'queue', 'stats'],
          },
        },
      },
    ],
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001',
        type: 'string',
      },
      {
        key: 'jobId',
        value: 'your-job-id-here',
        type: 'string',
      },
    ],
  };

  res.json(postmanCollection);
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 SnapAsset API Server`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Postman: http://localhost:${PORT}/api-docs/postman`);
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set');
  }
  if (!supabase) {
    console.warn('⚠️  Warning: Supabase not configured');
  }
  if (!process.env.REDIS_HOST) {
    console.warn('⚠️  Warning: Redis not configured - job queue will use memory');
  }
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;