# SnapAsset

> AI-powered image generation tool for creating perfectly-sized assets for multiple platforms

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/snapasset)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 🚀 Overview

SnapAsset is a modern web application that simplifies the process of generating AI-powered images optimized for multiple platforms. Whether you need assets for social media, app stores, or web platforms, SnapAsset handles image generation, resizing, and optimization automatically.

## ✨ Features

- 🎨 **AI Image Generation** - Powered by OpenAI DALL-E 3
- 📱 **20+ Platform Presets** - Instagram, Twitter, Facebook, LinkedIn, iOS, Android, and more
- ⚡ **Fast Processing** - Built with React + Vite for lightning-fast performance
- 🔒 **Secure Authentication** - Multiple auth methods via Supabase (email, Google, GitHub, Discord)
- ☁️ **Cloud Storage** - Automatic image storage with CDN-backed URLs
- 🚢 **One-Click Deploy** - Deploy to Railway in under 5 minutes
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🧪 **Fully Tested** - 124+ tests with 80%+ coverage
- 📊 **Health Monitoring** - Built-in health checks and metrics

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Next-generation frontend tooling
- **React Router** - Client-side routing
- **Supabase Client** - Database and auth integration

### Backend
- **Express.js** - Fast, minimalist web framework
- **Node.js 18** - JavaScript runtime
- **Sharp** - High-performance image processing
- **OpenAI SDK** - DALL-E 3 integration

### Database & Services
- **Supabase** - PostgreSQL database, authentication, and storage
- **OpenAI** - AI image generation
- **Railway** - Deployment platform

### Testing
- **Vitest** - Frontend testing
- **React Testing Library** - Component testing
- **Jest** - Backend testing
- **Supertest** - API testing

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([app.supabase.com](https://app.supabase.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com)) (optional)
- Railway account ([railway.app](https://railway.app)) (for deployment)

## 🚦 Getting Started

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/darshanpania/snapasset.git
cd snapasset

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env
cp server/.env.example server/.env
# Edit both .env files with your credentials

# 4. Run development servers
npm run dev  # Terminal 1 - Frontend (port 5173)
cd server && npm run dev  # Terminal 2 - Backend (port 3001)
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

## 🚂 Deploy to Railway

### Option 1: One-Click Deploy (Easiest)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/snapasset)

1. Click button above
2. Add environment variables (Supabase credentials)
3. Deploy! ✅

### Option 2: GitHub Integration

1. Fork/clone this repository
2. Create new project on [Railway](https://railway.app/new)
3. Select "Deploy from GitHub repo"
4. Choose `snapasset` repository
5. Add environment variables (see [.env.railway.example](./.env.railway.example))
6. Deploy automatically!

### Option 3: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-key
railway variables set ALLOWED_ORIGINS=https://your-app.railway.app

# Deploy
railway up
```

**📚 Full deployment guide:** [docs/RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md)  
**⚡ Quick start:** [docs/DEPLOYMENT_QUICK_START.md](./docs/DEPLOYMENT_QUICK_START.md)

## 🔐 Environment Variables

### Required

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-public-key

# CORS
ALLOWED_ORIGINS=https://your-app.railway.app

# Application
NODE_ENV=production
```

### Optional

```bash
# OpenAI (for AI image generation)
OPENAI_API_KEY=sk-...

# Monitoring
SENTRY_DSN=https://...
LOGROCKET_APP_ID=...

# Performance
REDIS_URL=redis://...
```

**Complete list:** See [.env.railway.example](./.env.railway.example)

## 🏗️ Project Structure

```
snapasset/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Testing & validation
│       └── railway-deploy.yml     # Railway deployment
├── docs/
│   ├── RAILWAY_DEPLOYMENT.md      # Complete deployment guide
│   ├── DEPLOYMENT_QUICK_START.md  # 5-minute quick start
│   ├── DEPLOYMENT_ARCHITECTURE.md # Architecture overview
│   └── DEPLOYMENT_CHECKLIST.md    # Pre/post deployment checklist
├── scripts/
│   └── deploy.sh                  # Deployment validation script
├── server/
│   ├── middleware/
│   │   └── monitoring.js          # Monitoring & logging
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   ├── index.js                   # Server entry point
│   └── package.json               # Backend dependencies
├── src/
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   └── ...                    # Other components
│   ├── contexts/
│   │   └── AuthContext.jsx        # Auth state management
│   ├── services/
│   │   └── supabase.js            # Supabase client
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # Entry point
├── railway.json                   # Railway configuration
├── nixpacks.toml                  # Build configuration
├── railway-template.json          # One-click deploy template
└── package.json                   # Frontend dependencies
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
npm run test:frontend

# Backend tests
cd server && npm test

# Coverage report
npm run test:coverage
```

**Test Stats:**
- 73+ frontend tests
- 51+ backend tests
- 124+ total tests
- 80%+ code coverage

## 📊 Health Checks

Once deployed, monitor your application:

```bash
# Basic health
curl https://your-app.railway.app/health

# Detailed health (system metrics)
curl https://your-app.railway.app/health/detailed

# Readiness check
curl https://your-app.railway.app/ready

# Liveness check
curl https://your-app.railway.app/live
```

## 📁 Available Scripts

### Frontend
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server (nodemon)
- `npm start` - Start production server
- `npm test` - Run backend tests

### Deployment
- `chmod +x scripts/deploy.sh` - Make deploy script executable
- `./scripts/deploy.sh` - Run deployment validation

## 🔄 Continuous Deployment

Push to main branch = automatic deployment to Railway!

```bash
git add .
git commit -m "feat: new feature"
git push origin main
# Railway automatically deploys! 🚀
```

**GitHub Actions:**
- ✅ Runs tests on PRs
- ✅ Validates build
- ✅ Deploys to Railway
- ✅ Runs health checks
- ✅ Creates deployment summary

## 🌐 Platform Presets

SnapAsset supports 20+ platform presets:

**Social Media:**
- Instagram (Post, Story, Profile)
- Twitter/X (Post, Header, Profile)
- Facebook (Post, Cover, Profile)
- LinkedIn (Post, Banner, Profile)
- TikTok (Video thumbnail)
- YouTube (Thumbnail, Banner, Profile)

**App Stores:**
- iOS App Icon (various sizes)
- Android App Icon (various densities)

**Web:**
- Favicon (multiple sizes)
- Open Graph images
- Twitter Cards

## 🏥 Monitoring

### Built-in Monitoring

- **Request tracking** - Unique ID per request
- **Performance monitoring** - Response time tracking
- **Error logging** - Detailed error context
- **Health metrics** - System statistics
- **Security logging** - Suspicious activity detection

### External Monitoring (Optional)

- **Sentry** - Error tracking and alerting
- **LogRocket** - Session replay and debugging
- **Railway Metrics** - CPU, memory, network usage

## 🔒 Security

- ✅ **Helmet** - Security headers
- ✅ **CORS** - Configurable cross-origin requests
- ✅ **Environment Protection** - Secrets not exposed
- ✅ **HTTPS** - Enforced in production
- ✅ **Row Level Security** - Database-level access control
- ✅ **Authentication** - Supabase Auth with multiple providers
- ✅ **Input Validation** - Request validation and sanitization
- ✅ **Security Logging** - Attack pattern detection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add AmazingFeature'`)
5. Push to branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Ensure all tests pass
- Add meaningful commit messages

## 📝 Roadmap

- [x] Basic image generation interface
- [x] Platform preset selection
- [x] User authentication (Supabase)
- [x] Database schema and storage
- [x] Testing infrastructure
- [x] Railway deployment configuration
- [ ] Background job processing (Issue #6)
- [ ] API documentation (Issue #12)
- [ ] Project management features
- [ ] Usage analytics dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React** - [react.dev](https://react.dev/)
- **Vite** - [vitejs.dev](https://vitejs.dev/)
- **Express** - [expressjs.com](https://expressjs.com/)
- **Supabase** - [supabase.com](https://supabase.com/)
- **Railway** - [railway.app](https://railway.app/)
- **OpenAI** - [openai.com](https://openai.com/)
- **Sharp** - [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/)

## 📚 Documentation

- [Railway Deployment Guide](./docs/RAILWAY_DEPLOYMENT.md)
- [Quick Start Guide](./docs/DEPLOYMENT_QUICK_START.md)
- [Deployment Architecture](./docs/DEPLOYMENT_ARCHITECTURE.md)
- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)

## 📊 Status

- **Build:** ✅ Passing
- **Tests:** ✅ 124+ tests, 80%+ coverage
- **Deployment:** ✅ Railway-ready
- **Documentation:** ✅ Complete

## 📧 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/darshanpania/snapasset/issues)
- **Discussions**: [Ask questions](https://github.com/darshanpania/snapasset/discussions)
- **Railway Discord**: [Get deployment help](https://discord.gg/railway)
- **Supabase Discord**: [Database support](https://discord.supabase.com)

---

Made with ❤️ by [Darshan Pania](https://github.com/darshanpania)

**Star the repo ⭐ if you find it useful!**
