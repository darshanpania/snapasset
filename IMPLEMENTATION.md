# SnapAsset - Core Implementation Guide

## 🎉 What's Been Implemented

This implementation includes the core functionality for SnapAsset, an AI-powered multi-platform image generator.

### ✅ Frontend Features

#### 1. **Main Application (`src/App.jsx`)**
- Central application logic
- State management for prompt, presets, results, and loading states
- Error handling and user feedback
- Integration between all components

#### 2. **Prompt Input Component (`src/components/PromptInput.jsx`)**
- Rich textarea for image description
- Character counter (1000 char limit)
- Example prompts with one-click insertion
- Tips for better AI generation results
- Keyboard shortcuts (Ctrl/Cmd + Enter to generate)

#### 3. **Preset Selector Component (`src/components/PresetSelector.jsx`)**
- 9 platform presets (Instagram, Twitter, Facebook, LinkedIn, YouTube, Pinterest)
- Visual preset cards with icons and dimensions
- Platform filtering (All, Instagram, Twitter, Facebook, etc.)
- Multi-select functionality
- Bulk select/clear actions
- Display of aspect ratios and dimensions

#### 4. **Results Grid Component (`src/components/ResultsGrid.jsx`)**
- Responsive grid layout for generated images
- Individual image download
- Bulk download all images
- Image preview modal with full-screen view
- Metadata display (dimensions, aspect ratio, platform)
- Hover effects and transitions

#### 5. **API Service (`src/services/api.js`)**
- Frontend API client
- POST request to `/api/generate` endpoint
- Error handling and user-friendly messages
- Configurable API URL via environment variables

### ✅ Backend Features

#### 1. **Express Server (`server/index.js`)**
- Express.js server setup
- CORS configuration
- Security middleware (Helmet)
- Request logging (Morgan)
- Health check endpoint
- API documentation endpoint
- Supabase integration (ready for storage)
- Comprehensive error handling

#### 2. **Image Routes (`server/routes/images.js`)**
- `POST /api/generate` - Generate images from text prompt
- `POST /api/images/upload` - Upload images (placeholder)
- `GET /api/platforms` - Get available platform presets
- Input validation
- File upload handling with Multer
- Error handling with appropriate status codes

#### 3. **Image Service (`server/services/imageService.js`)**
- **DALL-E 3 Integration**: Generate base images using OpenAI's DALL-E 3 API
- **Sharp Image Processing**: Resize and optimize images for each platform
- **Platform Presets**: 9 pre-configured social media and web platforms
- **Image Download**: Fetch generated images from DALL-E
- **Base64 Conversion**: Convert processed images to data URLs for frontend display
- **Batch Processing**: Generate multiple sizes from a single AI-generated image

#### 4. **Middleware (`server/middleware/errorHandler.js`)**
- Global error handler
- Multer error handling (file size, type validation)
- 404 not found handler
- Development vs production error responses

#### 5. **Logger Utility (`server/utils/logger.js`)**
- Custom logging utility
- Formatted log messages with timestamps
- Different log levels (info, warn, error, debug)
- Development-only debug logs

---

## 🛠️ Technical Implementation Details

### Frontend Architecture

**State Management:**
```javascript
- prompt: String - User's image description
- selectedPresets: Array - Selected platform IDs
- results: Array - Generated images with metadata
- isGenerating: Boolean - Loading state
- error: String - Error messages
```

**Component Communication:**
- Parent component (App) manages all state
- Child components receive props and callbacks
- One-way data flow pattern

**Styling:**
- Modular CSS per component
- Responsive design with media queries
- CSS animations and transitions
- Gradient backgrounds and modern UI

### Backend Architecture

**Layered Structure:**
```
Routes → Services → External APIs
   ↓         ↓
Middleware  Utils
```

**Image Generation Flow:**
1. Receive prompt and preset IDs from frontend
2. Validate input data
3. Generate base image using DALL-E 3 (1024x1024)
4. Download generated image
5. Process image for each preset using Sharp:
   - Resize to target dimensions
   - Optimize with PNG compression
   - Convert to base64 data URL
6. Return array of processed images

**Error Handling:**
- Try-catch blocks at all async operations
- Specific error messages for different failure types
- Status codes: 400 (validation), 429 (rate limit), 503 (service unavailable)
- Development mode includes stack traces

---

## 🚀 Setup Instructions

### Prerequisites
```bash
Node.js >= 18.0.0
npm or yarn
OpenAI API key (for DALL-E 3)
```

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 2. Configure Environment Variables

**Frontend (`.env`):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:3001
```

**Backend (`server/.env`):**
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=sk-your-openai-api-key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account or sign in
3. Navigate to API Keys section
4. Create new secret key
5. Copy key to `server/.env`

**Note:** DALL-E 3 API pricing:
- Standard quality: $0.040 per image
- HD quality: $0.080 per image

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

---

## 📦 Dependencies Added

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.3",
  "@supabase/supabase-js": "^2.39.3"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "dotenv": "^16.4.1",
  "openai": "^4.26.0",      // NEW: DALL-E API
  "sharp": "^0.33.2",        // NEW: Image processing
  "axios": "^1.6.5",         // NEW: HTTP requests
  "multer": "^1.4.5-lts.1",  // NEW: File uploads
  "@supabase/supabase-js": "^2.39.3"
}
```

---

## 🧪 Testing the Implementation

### Test the Backend

**1. Health Check:**
```bash
curl http://localhost:3001/health
```

**2. Get Platforms:**
```bash
curl http://localhost:3001/api/platforms
```

**3. Generate Images:**
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "presets": ["instagram-post", "twitter-post"]
  }'
```

### Test the Frontend

1. Open http://localhost:5173
2. Enter a prompt (e.g., "A futuristic city skyline at night")
3. Select one or more platform presets
4. Click "Generate Images"
5. Wait for generation (15-30 seconds)
6. View results and download images

---

## 🎯 Platform Presets Included

| Platform | Preset | Dimensions | Aspect Ratio |
|----------|--------|------------|--------------|
| Instagram | Post | 1080×1080 | 1:1 |
| Instagram | Story | 1080×1920 | 9:16 |
| Twitter | Post | 1200×675 | 16:9 |
| Twitter | Header | 1500×500 | 3:1 |
| Facebook | Post | 1200×630 | 1.91:1 |
| Facebook | Cover | 820×312 | 2.63:1 |
| LinkedIn | Post | 1200×627 | 1.91:1 |
| YouTube | Thumbnail | 1280×720 | 16:9 |
| Pinterest | Pin | 1000×1500 | 2:3 |

---

## 🔍 API Endpoints

### `GET /health`
Health check endpoint
```json
{
  "status": "ok",
  "uptime": 123.45,
  "supabaseConnected": true,
  "openaiConfigured": true
}
```

### `GET /api/platforms`
Get available platform presets
```json
{
  "success": true,
  "platforms": [...],
  "count": 9
}
```

### `POST /api/generate`
Generate images from prompt

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "presets": ["instagram-post", "twitter-post"]
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "A beautiful sunset over mountains",
  "images": [
    {
      "preset": {...},
      "url": "data:image/png;base64,...",
      "size": 245678,
      "timestamp": "2026-01-24T14:30:00Z"
    }
  ],
  "count": 2
}
```

---

## 🚧 Known Limitations & Future Work

### Current Implementation
- ✅ AI image generation with DALL-E 3
- ✅ Multi-platform image resizing
- ✅ Base64 data URLs for instant display
- ✅ Error handling and validation

### Not Yet Implemented
- ❌ Supabase Storage integration (images are not persisted)
- ❌ User authentication
- ❌ Image history/gallery
- ❌ Custom dimension input
- ❌ Image upload and resize (without AI)
- ❌ Batch processing queue
- ❌ Rate limiting
- ❌ Usage analytics

### Recommendations for Next Steps

1. **Implement Supabase Storage** (Issue #9)
   - Save generated images to cloud storage
   - Return permanent URLs instead of base64
   - Implement automatic cleanup

2. **Add Authentication** (Issue #7)
   - User registration/login
   - Protected routes
   - User-specific image galleries

3. **Add Testing** (Issues #10, #11)
   - Unit tests for services
   - Integration tests for API
   - E2E tests for user flows

4. **Implement Rate Limiting**
   - Prevent API abuse
   - User quotas
   - Cost management

---

## 💡 Usage Tips

### Writing Good Prompts

**Good:**
- "A modern minimalist logo with geometric shapes in blue and white"
- "Professional product photography of a coffee mug on white background"
- "Abstract digital art with flowing purple and pink gradients"

**Avoid:**
- Too vague: "An image"
- Too complex: Multiple unrelated subjects
- Inappropriate content

### Best Practices

1. **Be Specific**: Include details about style, colors, mood
2. **Consider the Platform**: Horizontal for Twitter, Square for Instagram
3. **Test Iteratively**: Refine prompts based on results
4. **Monitor Costs**: Each generation costs $0.04-$0.08
5. **Save Good Prompts**: Build a library of effective prompts

---

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in `server/.env`
- Key must start with `sk-`
- Verify key is active on OpenAI platform

### "Failed to generate images"
- Check OpenAI account has credits
- Verify internet connection
- Check API status: https://status.openai.com/
- Review server logs for detailed errors

### Images not displaying
- Check browser console for errors
- Verify API URL in frontend `.env`
- Ensure CORS is properly configured
- Check base64 data URL format

### Slow generation
- DALL-E 3 typically takes 10-20 seconds
- Processing 5+ presets adds 5-10 seconds
- Consider implementing queue system for better UX

---

## 📊 Performance Considerations

### Current Performance
- DALL-E generation: ~15 seconds
- Image processing per preset: ~1-2 seconds
- Total time for 5 presets: ~20-25 seconds

### Optimization Opportunities
1. Implement caching for repeated prompts
2. Use job queue for async processing
3. Stream processing status to frontend
4. Implement image CDN
5. Use WebP format for smaller files

---

## 🔒 Security Notes

- API keys stored in environment variables (not in code)
- CORS configured for specific origins
- Helmet.js for security headers
- Input validation on all endpoints
- File size limits (10MB)
- File type validation

---

## 📝 Code Quality

- **ES6+ Features**: Async/await, arrow functions, destructuring
- **Modular Structure**: Separate concerns into services/routes/middleware
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Structured logging throughout
- **Comments**: JSDoc comments on all functions
- **Naming**: Clear, descriptive variable and function names

---

## 🎨 UI/UX Features

- Responsive design (mobile-friendly)
- Loading states with spinner
- Error messages with icons
- Example prompts for guidance
- Keyboard shortcuts
- Image preview modal
- Hover effects and animations
- Download progress feedback

---

## 📖 Additional Resources

- [OpenAI DALL-E API Docs](https://platform.openai.com/docs/guides/images)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Hooks Guide](https://react.dev/reference/react)

---

## 👨‍💻 Developer Notes

This implementation provides a solid foundation for SnapAsset. The code is structured for easy extension and maintenance. Key architectural decisions:

1. **Separation of Concerns**: Routes, services, and middleware are clearly separated
2. **Error First**: All async operations properly handle errors
3. **Scalability**: Structure supports adding features like queues, caching, storage
4. **Developer Experience**: Clear logging, error messages, and documentation
5. **Production Ready**: Environment-based configuration, security headers, CORS

Feel free to extend and modify based on your specific needs!

---

Built with ❤️ by Darshan Pania
