# SnapAsset

> Image generation wrapper for creating perfectly-sized assets for various platforms

## 🚀 Overview

SnapAsset is a modern web application that simplifies the process of generating optimized images for multiple platforms. Whether you need assets for social media, app stores, or web platforms, SnapAsset handles resizing and optimization automatically.

## ✨ Features

- 🎨 **Multi-platform Support** - Generate assets for Instagram, Twitter, Facebook, iOS, Android, and more
- ⚡ **Fast Processing** - Built with React + Vite for lightning-fast performance
- 🔒 **Secure Authentication** - Powered by Supabase Auth
- ☁️ **Cloud Storage** - Automatic image storage with Supabase Storage
- 🚢 **Easy Deployment** - One-click deploy to Railway
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Next-generation frontend tooling
- **CSS Modules** - Scoped styling

### Backend
- **Express.js** - Fast, minimalist web framework
- **Node.js** - JavaScript runtime

### Database & Auth
- **Supabase** - PostgreSQL database, authentication, and storage

### Deployment
- **Railway** - Platform for deploying and scaling apps

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Railway account ([railway.app](https://railway.app)) (for deployment)

## 🚦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/darshanpania/snapasset.git
cd snapasset
```

### 2. Install dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Set up environment variables

#### Frontend (.env)
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (server/.env)
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add your configuration:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=development
```

### 4. Run the development servers

#### Terminal 1 - Frontend
```bash
npm run dev
```

#### Terminal 2 - Backend
```bash
cd server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## 🏗️ Project Structure

```
snapasset/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   ├── services/           # API and service integrations
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   ├── App.css             # Global styles
│   └── main.jsx            # Entry point
├── server/
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── index.js            # Server entry point
│   └── package.json        # Backend dependencies
├── .env.example            # Frontend environment template
├── .gitignore              # Git ignore rules
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite configuration
├── railway.json            # Railway deployment config
└── README.md               # This file
```

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and keys
3. Set up Storage buckets for image uploads
4. Configure authentication providers as needed

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will automatically deploy on push to main branch

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 🧪 Testing

Testing setup coming soon. Planned frameworks:
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

## 🚀 Deployment

### Railway (Recommended)

1. Push your code to GitHub
2. Connect repository to Railway
3. Configure environment variables
4. Deploy automatically on push to main

### Manual Deployment

```bash
# Build frontend
npm run build

# Start backend with built frontend
cd server
NODE_ENV=production npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Backend with [Express](https://expressjs.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Railway](https://railway.app/)

## 📧 Contact

Darshan Pania - [@darshanpania](https://github.com/darshanpania)

Project Link: [https://github.com/darshanpania/snapasset](https://github.com/darshanpania/snapasset)

---

Made with ❤️ by Darshan Pania