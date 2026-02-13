import OpenAI from 'openai';
import sharp from 'sharp';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (supabaseUrl && supabaseKey && /^https?:\/\//i.test(supabaseUrl)) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  logger.warn('Supabase not configured in imageService — storage/DB features disabled');
}

// Platform presets with exact dimensions
const PLATFORM_PRESETS = {
  'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
  'twitter-post': { width: 1200, height: 675, name: 'Twitter Post' },
  'twitter-header': { width: 1500, height: 500, name: 'Twitter Header' },
  'facebook-post': { width: 1200, height: 630, name: 'Facebook Post' },
  'facebook-cover': { width: 820, height: 312, name: 'Facebook Cover' },
  'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post' },
  'youtube-thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail' },
  'pinterest-pin': { width: 1000, height: 1500, name: 'Pinterest Pin' },
};

/**
 * Generate image using DALL-E 3
 */
export async function generateWithDallE(prompt, options = {}) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    };
  } catch (error) {
    logger.error('DALL-E generation error:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Download image from URL
 */
export async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Resize and optimize image for specific platform
 */
export async function resizeImage(imageBuffer, platform) {
  try {
    const preset = PLATFORM_PRESETS[platform];
    if (!preset) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const resizedBuffer = await sharp(imageBuffer)
      .resize(preset.width, preset.height, {
        fit: 'cover',
        position: 'center',
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();

    return {
      buffer: resizedBuffer,
      width: preset.width,
      height: preset.height,
      size: resizedBuffer.length,
    };
  } catch (error) {
    throw new Error(`Image resize failed: ${error.message}`);
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadToStorage(imageBuffer, path, contentType = 'image/png') {
  try {
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(path, imageBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    throw new Error(`Upload to storage failed: ${error.message}`);
  }
}

/**
 * Save generation metadata to database
 */
export async function saveGeneration(userId, generationData) {
  try {
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        prompt: generationData.prompt,
        image_type: generationData.imageType || 'photo',
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to save generation: ${error.message}`);
  }
}

/**
 * Save generated image metadata
 */
export async function saveGeneratedImage(generationId, imageData) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        generation_id: generationId,
        platform_id: imageData.platformId,
        platform_name: imageData.platformName,
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.fileSize,
        storage_path: imageData.storagePath,
        url: imageData.url,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to save image metadata: ${error.message}`);
  }
}

/**
 * Get platform presets as an array
 */
export function getPlatformPresets() {
  return Object.entries(PLATFORM_PRESETS).map(([id, preset]) => ({
    id,
    ...preset,
  }));
}

/**
 * Generate images from a prompt for multiple platform presets
 */
export async function generateImagesFromPrompt(prompt, presetIds) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Generate the base image with DALL-E
  const generated = await generateWithDallE(prompt);

  // Download the generated image
  const imageBuffer = await downloadImage(generated.url);

  // Resize for each requested platform
  const results = await Promise.all(
    presetIds.map(async (presetId) => {
      const preset = PLATFORM_PRESETS[presetId];
      if (!preset) {
        logger.warn(`Unknown preset: ${presetId}, skipping`);
        return null;
      }

      const resized = await resizeImage(imageBuffer, presetId);
      const base64 = resized.buffer.toString('base64');

      return {
        platform: presetId,
        platformName: preset.name,
        width: resized.width,
        height: resized.height,
        size: resized.size,
        image: `data:image/png;base64,${base64}`,
        revisedPrompt: generated.revisedPrompt,
      };
    })
  );

  return results.filter(Boolean);
}

export default {
  generateWithDallE,
  downloadImage,
  resizeImage,
  uploadToStorage,
  saveGeneration,
  saveGeneratedImage,
  generateImagesFromPrompt,
  getPlatformPresets,
  PLATFORM_PRESETS,
};