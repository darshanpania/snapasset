import { imageGenerationQueue } from '../config/queue.js';
import {
  generateWithDallE,
  downloadImage,
  resizeImage,
  uploadToStorage,
  saveGeneration,
  saveGeneratedImage,
  PLATFORM_PRESETS,
} from '../services/imageService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process image generation job
 */
imageGenerationQueue.process(async (job) => {
  const { userId, prompt, platforms, options } = job.data;
  const results = [];

  try {
    // Update job progress: Starting generation
    await job.progress(10);
    job.log('Starting DALL-E image generation...');

    // Step 1: Generate image with DALL-E
    const { url: dalleUrl, revisedPrompt } = await generateWithDallE(prompt, options);
    await job.progress(30);
    job.log('Image generated successfully');

    // Step 2: Download generated image
    const originalImage = await downloadImage(dalleUrl);
    await job.progress(40);
    job.log('Image downloaded');

    // Step 3: Save generation to database
    const generation = await saveGeneration(userId, {
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
      const { path, url } = await uploadToStorage(buffer, storagePath);

      // Save to database
      const savedImage = await saveGeneratedImage(generation.id, {
        platformId: platform,
        platformName: preset.name,
        width,
        height,
        fileSize: size,
        storagePath: path,
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

console.log('🎨 Image generation worker started');
console.log('📡 Waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await imageGenerationQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await imageGenerationQueue.close();
  process.exit(0);
});