import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { imageGenerationQueue } from '../config/queue.js';
import { createProviders } from '../providers/index.js';
import { decryptApiKey } from '../utils/encryption.js';
import {
  generateWithDallE,
  downloadImage,
  resizeImage,
  uploadToStorage,
  saveGeneration,
  saveGeneratedImage,
  PLATFORM_PRESETS,
} from '../services/imageService.js';

// Initialize providers for the worker process
let supabaseClient = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (supabaseUrl && supabaseServiceKey && /^https?:\/\//i.test(supabaseUrl)) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
}

const providers = createProviders({
  dbProvider: process.env.DB_PROVIDER,
  supabaseUrl,
  supabaseClient,
  jwtSecret: process.env.JWT_SECRET,
  dataDir: process.env.LOCAL_DATA_DIR || path.join(process.cwd(), 'data'),
});

/**
 * Process image generation job
 */
imageGenerationQueue.process(async (job) => {
  const { userId, prompt, platforms, options } = job.data;
  const results = [];

  try {
    // Resolve user's API key (user key > server fallback)
    let userApiKey = null;
    try {
      if (providers.db?.users?.getApiKey) {
        const keyData = await providers.db.users.getApiKey(userId);
        if (keyData?.encryptedKey) {
          userApiKey = decryptApiKey(keyData.encryptedKey);
        }
      }
    } catch (err) {
      job.log(`Warning: could not resolve user API key: ${err.message}`);
    }

    // Update job progress: Starting generation
    await job.progress(10);
    job.log('Starting DALL-E image generation...');

    // Step 1: Generate image with DALL-E (user key or server fallback)
    const dalleResult = await generateWithDallE(prompt, options, userApiKey);
    const revisedPrompt = dalleResult.revisedPrompt;
    await job.progress(30);
    job.log('Image generated successfully');

    // Step 2: Download generated image (or use base64 buffer directly)
    const originalImage = dalleResult.b64Buffer
      ? dalleResult.b64Buffer
      : await downloadImage(dalleResult.url);
    await job.progress(40);
    job.log('Image downloaded');

    // Step 3: Save generation to database
    const generation = await saveGeneration(providers.db, userId, {
      prompt: revisedPrompt || prompt,
      imageType: options?.imageType || 'photo',
    });
    await job.progress(50);

    // Step 4: Process each platform
    const totalPlatforms = platforms.length;
    const progressPerPlatform = 40 / totalPlatforms;

    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      const preset = PLATFORM_PRESETS[platform];

      if (!preset) {
        job.log(`Skipping unknown platform: ${platform}`);
        continue;
      }

      job.log(`Processing ${preset.name}...`);

      // Resize image
      const { buffer, width, height, size } = await resizeImage(originalImage, platform);

      // Upload to storage
      const fileName = `${platform}-${width}x${height}.png`;
      const storagePath = `${userId}/${generation.id}/${fileName}`;
      const { path: savedPath, url } = await uploadToStorage(
        providers.storage,
        buffer,
        storagePath
      );

      // Save to database
      const savedImage = await saveGeneratedImage(providers.db, generation.id, {
        platformId: platform,
        platformName: preset.name,
        width,
        height,
        fileSize: size,
        storagePath: savedPath,
        url,
      });

      results.push({
        platform: preset.name,
        url,
        width,
        height,
        size,
      });

      // Update progress
      const currentProgress = 50 + (i + 1) * progressPerPlatform;
      await job.progress(Math.round(currentProgress));
    }

    await job.progress(100);
    job.log('All images processed successfully');

    return {
      success: true,
      generationId: generation.id,
      images: results,
      revisedPrompt: revisedPrompt || prompt,
    };
  } catch (error) {
    job.log(`Error: ${error.message}`);
    throw error;
  }
});

console.log('Image generation worker started');
console.log('Waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  if (providers._sqlite) providers._sqlite.close();
  await imageGenerationQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  if (providers._sqlite) providers._sqlite.close();
  await imageGenerationQueue.close();
  process.exit(0);
});
