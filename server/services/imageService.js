import OpenAI from 'openai';
import sharp from 'sharp';
import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const defaultOpenai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getOpenAIClient(apiKey) {
  if (apiKey) return new OpenAI({ apiKey });
  if (defaultOpenai) return defaultOpenai;
  throw new Error('No OpenAI API key available. Set OPENAI_API_KEY or provide a user key.');
}

// Platform presets with exact dimensions
export const PLATFORM_PRESETS = {
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

// Supported image generation models
export const IMAGE_MODELS = {
  'gpt-image-1': { name: 'GPT Image 1', sizes: ['1024x1024', '1024x1536', '1536x1024', 'auto'], qualities: ['low', 'medium', 'high', 'auto'], outputFormats: ['png', 'webp', 'jpeg'], backgrounds: ['transparent', 'opaque', 'auto'] },
  'gpt-image-1-mini': { name: 'GPT Image 1 Mini', sizes: ['1024x1024', '1024x1536', '1536x1024', 'auto'], qualities: ['low', 'medium', 'high', 'auto'], outputFormats: ['png', 'webp', 'jpeg'], backgrounds: ['transparent', 'opaque', 'auto'] },
  'dall-e-3': { name: 'DALL-E 3', sizes: ['1024x1024', '1024x1792', '1792x1024'], qualities: ['standard', 'hd'], styles: ['vivid', 'natural'] },
  'dall-e-2': { name: 'DALL-E 2', sizes: ['256x256', '512x512', '1024x1024'], qualities: ['standard'] },
};

// GPT image family shares the same param contract (b64_json output, same sizes/qualities/formats)
const GPT_IMAGE_MODELS = new Set(['gpt-image-1', 'gpt-image-1-mini']);

const DEFAULT_MODEL = 'dall-e-3';

/**
 * Generate image using OpenAI image generation API
 */
export async function generateWithDallE(prompt, options = {}, apiKey = null) {
  try {
    const client = getOpenAIClient(apiKey);
    const model = options.model || DEFAULT_MODEL;
    const modelConfig = IMAGE_MODELS[model] || IMAGE_MODELS[DEFAULT_MODEL];

    const params = {
      model,
      prompt,
      n: 1,
    };

    if (GPT_IMAGE_MODELS.has(model)) {
      params.size = options.size || 'auto';
      params.quality = options.quality || 'auto';
      if (options.outputFormat) params.output_format = options.outputFormat;
      if (options.background) params.background = options.background;
    } else {
      params.size = options.size || '1024x1024';
      params.quality = options.quality || 'standard';
      if (model === 'dall-e-3' && options.style) {
        params.style = options.style;
      }
    }

    const response = await client.images.generate(params);

    const result = { revisedPrompt: response.data[0].revised_prompt };
    if (response.data[0].url) {
      result.url = response.data[0].url;
    } else if (response.data[0].b64_json) {
      result.b64Buffer = Buffer.from(response.data[0].b64_json, 'base64');
    }
    return result;
  } catch (error) {
    logger.error('Image generation error:', error);
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
 * Upload image to storage via provider adapter
 */
export async function uploadToStorage(storageAdapter, imageBuffer, storagePath, contentType = 'image/png') {
  if (!storageAdapter) {
    throw new Error('Storage not configured — cannot upload');
  }
  try {
    const result = await storageAdapter.upload('generated-images', storagePath, imageBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });
    const url = storageAdapter.getPublicUrl('generated-images', storagePath);
    return {
      path: result.path || storagePath,
      url: typeof url === 'string' ? url : url.publicUrl || url,
    };
  } catch (error) {
    throw new Error(`Upload to storage failed: ${error.message}`);
  }
}

/**
 * Save generation metadata to database via provider adapter
 */
export async function saveGeneration(dbAdapter, userId, generationData) {
  if (!dbAdapter?.images) {
    throw new Error('Database not configured — cannot save generation');
  }
  try {
    return await dbAdapter.images.saveGeneration({
      user_id: userId,
      prompt: generationData.prompt,
      image_type: generationData.imageType || 'photo',
      status: 'completed',
    });
  } catch (error) {
    throw new Error(`Failed to save generation: ${error.message}`);
  }
}

/**
 * Save generated image metadata via provider adapter
 */
export async function saveGeneratedImage(dbAdapter, generationId, imageData) {
  if (!dbAdapter?.images) {
    throw new Error('Database not configured — cannot save image metadata');
  }
  try {
    return await dbAdapter.images.saveGeneratedImage({
      generation_id: generationId,
      platform_id: imageData.platformId,
      platform_name: imageData.platformName,
      width: imageData.width,
      height: imageData.height,
      file_size: imageData.fileSize,
      storage_path: imageData.storagePath,
      url: imageData.url,
    });
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
export async function generateImagesFromPrompt(prompt, presetIds, apiKey = null, options = {}) {
  if (!apiKey && !process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Generate the base image
  const generated = await generateWithDallE(prompt, options, apiKey);

  // Get image buffer (either from URL download or direct base64)
  const imageBuffer = generated.b64Buffer || await downloadImage(generated.url);

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