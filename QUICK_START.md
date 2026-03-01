# SnapAsset - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites

- Node.js 18+ installed
- OpenAI API account ([Get one here](https://platform.openai.com/))
- 10 minutes of time

---

## Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

---

## Step 2: Get Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Click on "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add $5-10 credit to your account for testing

---

## Step 3: Configure Environment Variables

### Frontend `.env`

Create a file named `.env` in the root directory:

```env
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
VITE_API_URL=http://localhost:3001
```

### Backend `server/.env`

Create a file named `.env` in the `server` directory:

```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=sk-your-actual-key-here
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_KEY=placeholder-key
ALLOWED_ORIGINS=http://localhost:5173
```

**⚠️ Important:** Replace `sk-your-actual-key-here` with your real OpenAI API key!

---

## Step 4: Start the Servers

Open **two terminal windows**:

### Terminal 1 - Start Backend

```bash
cd server
npm run dev
```

You should see:

```
🚀 SnapAsset API Server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
```

### Terminal 2 - Start Frontend

```bash
npm run dev
```

You should see:

```
VITE ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## Step 5: Test It Out!

1. **Open your browser** to http://localhost:5173

2. **Enter a prompt**, for example:

   ```
   A serene mountain landscape at sunset with vibrant orange and purple colors
   ```

3. **Select platforms** - click on 2-3 platform cards:
   - Instagram Post
   - Twitter Post
   - Facebook Post

4. **Click "Generate Images"**

5. **Wait 15-30 seconds** ⏳
   - DALL-E generates the image (~15s)
   - Sharp resizes it for each platform (~1-2s each)

6. **View your results!** 🎉
   - Click images to preview in full screen
   - Download individual images
   - Download all at once

---

## ✅ Verification Checklist

Before you start, verify:

- [ ] Node.js version 18+ (`node --version`)
- [ ] npm is installed (`npm --version`)
- [ ] OpenAI API key is valid and has credits
- [ ] Both `.env` files are created
- [ ] Both servers are running without errors
- [ ] Frontend opens at http://localhost:5173
- [ ] Backend responds at http://localhost:3001/health

---

## 🧪 Quick Test Commands

Test backend health:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "openaiConfigured": true,
  ...
}
```

Test platforms endpoint:

```bash
curl http://localhost:3001/api/platforms
```

---

## 🎯 What You Can Do Now

1. **Generate Images**
   - Enter any text prompt
   - Select multiple platforms
   - Get perfectly sized images for each

2. **Try Different Prompts**
   - "Modern minimalist logo with geometric shapes"
   - "Professional product photo on white background"
   - "Abstract digital art with flowing colors"

3. **Explore Platform Presets**
   - 9 different social media platforms
   - Different aspect ratios
   - Optimized dimensions

4. **Download & Use**
   - Individual downloads
   - Bulk download all
   - Ready to use images

---

## 💰 Cost Awareness

- Each generation = **$0.04** (DALL-E 3 standard)
- Generating for 5 platforms = Still just **$0.04**
  - You generate ONE image with DALL-E
  - Then resize it locally (free)
- $5 = ~125 generations

---

## 🐛 Troubleshooting

### "OpenAI API key not configured"

- Check `server/.env` has `OPENAI_API_KEY=sk-...`
- Restart backend server after adding key

### "Rate limit exceeded"

- OpenAI free tier has limits
- Add credits to your OpenAI account
- Wait a few minutes and try again

### Frontend can't connect to backend

- Check backend is running on port 3001
- Verify CORS settings in `server/.env`
- Check `VITE_API_URL` in frontend `.env`

### Images not displaying

- Check browser console for errors
- Verify API response in Network tab
- Try generating fewer platforms (1-2 first)

### Server crashes

- Check OpenAI API key is valid
- Verify you have account credits
- Check server logs for specific errors

---

## 📖 Next Steps

Once you have it working:

1. **Read IMPLEMENTATION.md** for detailed documentation
2. **Review the code** to understand the architecture
3. **Customize presets** - add your own platform dimensions
4. **Integrate Supabase Storage** - save images permanently
5. **Add authentication** - protect your API
6. **Deploy to production** - Railway, Vercel, etc.

---

## 🎨 Pro Tips

### Better Prompts

- Be specific about style and mood
- Include color preferences
- Mention composition details
- Specify lighting conditions

### Platform Selection

- Start with 1-2 platforms for faster testing
- Instagram Post (1:1) is most versatile
- Twitter Header (3:1) is most unique

### Performance

- First generation is slowest (~20-30s)
- Subsequent ones may be faster
- More presets = longer processing time

---

## 📞 Need Help?

1. Check **IMPLEMENTATION.md** for detailed docs
2. Review server logs for errors
3. Test with curl commands
4. Check OpenAI Platform status
5. Create an issue on GitHub

---

## 🎉 You're Ready!

You now have a fully functional AI-powered image generator that can create perfectly-sized assets for 9 different social media platforms!

Start generating amazing images! 🚀

---

Built with ❤️ by Darshan Pania
