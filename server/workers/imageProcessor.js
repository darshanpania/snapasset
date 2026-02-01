/**
 * Image Generation Job Processor
 * Handles AI image generation and platform-specific resizing
 */

import OpenAI from 'openai'
import sharp from 'sharp'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import logger from '../utils/logger.js'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Platform presets
const platformPresets = {
  'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
  'twitter-post': { width: 1200, height: 675, name: 'Twitter Post' },
  'facebook-post': { width: 1200, height: 630, name: 'Facebook Post' },
  'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post' },
  'youtube-thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail' },
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  })
  return Buffer.from(response.data)
}

/**
 * Resize image to platform specifications
 */
async function resizeImage(imageBuffer, width, height) {
  return await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toBuffer()
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(userId, generationId, platform, imageBuffer) {
  const fileName = `${platform.id}.png`
  const filePath = `${userId}/${generationId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('generated-images')
    .getPublicUrl(filePath)

  return {
    path: filePath,
    url: urlData.publicUrl,
  }
}

/**
 * Save image metadata to database
 */
async function saveImageMetadata(generationId, platform, imageInfo) {
  const { data, error } = await supabase
    .from('generated_images')
    .insert({
      generation_id: generationId,
      platform_id: platform.id,
      platform_name: platform.name,
      width: platform.width,
      height: platform.height,
      file_size: imageInfo.size,
      storage_path: imageInfo.path,
      url: imageInfo.url,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update generation status in database
 */
async function updateGenerationStatus(generationId, status, errorMessage = null) {
  const updateData = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  const { error } = await supabase
    .from('generations')
    .update(updateData)
    .eq('id', generationId)

  if (error) throw error
}

/**
 * Main image generation processor
 */
export async function processImageGeneration(job) {
  const { userId, generationId, prompt, platforms, imageType = 'vivid' } = job.data

  logger.info('Starting image generation', {
    jobId: job.id,
    userId,
    generationId,
    platforms: platforms?.length || 0,
  })

  try {
    // Update status to processing
    await updateGenerationStatus(generationId, 'processing')
    job.progress(10)

    // Step 1: Generate image with DALL-E
    logger.info('Generating image with DALL-E', { jobId: job.id, prompt })
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: imageType,
    })

    const generatedImageUrl = response.data[0].url
    logger.info('Image generated successfully', { jobId: job.id, url: generatedImageUrl })
    job.progress(40)

    // Step 2: Download generated image
    logger.info('Downloading generated image', { jobId: job.id })
    const originalImage = await downloadImage(generatedImageUrl)
    job.progress(50)

    // Step 3: Process each platform
    const results = []
    const platformList = platforms || Object.keys(platformPresets)
    const progressPerPlatform = 40 / platformList.length

    for (const [index, platformId] of platformList.entries()) {
      const platform = platformPresets[platformId]
      if (!platform) {
        logger.warn('Unknown platform skipped', { platformId })
        continue
      }

      logger.info('Processing platform', { jobId: job.id, platform: platform.name })

      // Resize image
      const resizedImage = await resizeImage(
        originalImage,
        platform.width,
        platform.height
      )

      // Upload to storage
      const uploadInfo = await uploadToStorage(
        userId,
        generationId,
        { id: platformId, ...platform },
        resizedImage
      )

      // Save metadata
      const imageData = await saveImageMetadata(
        generationId,
        { id: platformId, ...platform },
        {
          ...uploadInfo,
          size: resizedImage.length,
        }
      )

      results.push(imageData)

      // Update progress
      const currentProgress = 50 + (index + 1) * progressPerPlatform
      job.progress(Math.round(currentProgress))
    }

    // Step 4: Mark as completed
    await updateGenerationStatus(generationId, 'completed')
    job.progress(100)

    logger.info('Image generation completed', {
      jobId: job.id,
      generationId,
      imagesGenerated: results.length,
    })

    return {
      success: true,
      generationId,
      images: results,
      totalImages: results.length,
    }
  } catch (error) {
    logger.error('Image generation failed', {
      jobId: job.id,
      generationId,
      error: error.message,
      stack: error.stack,
    })

    // Update status to failed
    await updateGenerationStatus(generationId, 'failed', error.message)

    throw error
  }
}

export default processImageGeneration