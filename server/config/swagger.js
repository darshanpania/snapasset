import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SnapAsset API',
      version: '1.0.0',
      description:
        'AI-powered image generation and optimization API. Generate stunning images with DALL-E and automatically resize them for all major social media platforms.',
      contact: {
        name: 'Darshan Pania',
        email: 'support@snapasset.com',
        url: 'https://snapasset.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.snapasset.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Jobs',
        description: 'Job management endpoints for image generation',
      },
      {
        name: 'Real-time',
        description: 'Real-time updates via Server-Sent Events',
      },
      {
        name: 'Queue',
        description: 'Queue management and monitoring',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from Supabase authentication',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication',
        },
      },
      schemas: {
        Job: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              example: 'gen-1234567890-abc123',
            },
            status: {
              type: 'string',
              enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
              example: 'active',
            },
            progress: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              example: 45,
            },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                prompt: { type: 'string' },
                platforms: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            result: {
              type: 'object',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid request',
            },
            message: {
              type: 'string',
              example: 'Missing required field: prompt',
            },
            code: {
              type: 'string',
              example: 'INVALID_REQUEST',
            },
          },
        },
        Platform: {
          type: 'string',
          enum: [
            'instagram-post',
            'instagram-story',
            'twitter-post',
            'twitter-header',
            'facebook-post',
            'facebook-cover',
            'linkedin-post',
            'youtube-thumbnail',
          ],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                message: 'Invalid or expired token',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 60,
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Internal server error',
                message: 'Something went wrong. Please try again later.',
                code: 'INTERNAL_ERROR',
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;