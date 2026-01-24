import OpenAI from 'openai'
import sharp from 'sharp'
import axios from 'axios'
import logger from '../utils/logger.js'

// Initialize OpenAI client
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  logger.info('OpenAI client initialized')
} else {
  logger.warn('OpenAI API key not found')
}

// Platform presets with dimensions
const PLATFORM_PRESETS = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'Instagram',
    icon: '📷',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'Instagram',
    icon: '📱',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    platform: 'Twitter',
    icon: '🐦',
    width: 1200,
    height: 675,
    aspectRatio: '16:9'
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    platform: 'Twitter',
    icon: '🎨',
    width: 1500,
    height: 500,
    aspectRatio: '3:1'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    platform: 'Facebook',
    icon: '👥',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    platform: 'Facebook',
    icon: '🖼️',
    width: 820,
    height: 312,
    aspectRatio: '2.63:1'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    icon: '💼',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    icon: '📺',
    width: 1280,
    height: 720,
    aspectRatio: '16:9'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    platform: 'Pinterest',
    icon: '📌',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3'
  }
]

/**
 * Get all available platform presets
 * @returns {Array} Array of platform preset objects
 */
export function getPlatformPresets() {
  return PLATFORM_PRESETS
}

/**
 * Find a preset by ID
 * @param {string} presetId - The preset ID to find
 * @returns {Object|null} The preset object or null if not found
 */
export function getPresetById(presetId) {
  return PLATFORM_PRESETS.find(p => p.id === presetId) || null
}

/**
 * Generate image using DALL-E API
 * @param {string} prompt - Text prompt for image generation
 * @returns {Promise<string>} URL of generated image
 */
export async function generateImageWithDallE(prompt) {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    logger.info(`Calling DALL-E API with prompt: "${prompt.substring(0, 50)}..."`)
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated from DALL-E')
    }

    const imageUrl = response.data[0].url
    logger.info('DALL-E image generated successfully')
    
    return imageUrl
  } catch (error) {
    logger.error('DALL-E API error:', error)
    
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.')
    }
    
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key')
    }
    
    throw new Error(`Failed to generate image: ${error.message}`)
  }
}

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} Image buffer
 */
export async function downloadImage(url) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    })
    
    return Buffer.from(response.data)
  } catch (error) {
    logger.error('Error downloading image:', error)
    throw new Error(`Failed to download image: ${error.message}`)
  }
}

/**
 * Resize and optimize image using Sharp
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<Buffer>} Processed image buffer
 */
export async function processImage(imageBuffer, width, height) {
  try {
    logger.info(`Processing image to ${width}x${height}`)
    
    const processedImage = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality: 90,
        compressionLevel: 9
      })
      .toBuffer()
    
    logger.info(`Image processed successfully (${processedImage.length} bytes)`)
    return processedImage
  } catch (error) {
    logger.error('Error processing image:', error)
    throw new Error(`Failed to process image: ${error.message}`)
  }
}

/**
 * Convert buffer to base64 data URL
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimeType - MIME type (default: image/png)
 * @returns {string} Base64 data URL
 */
export function bufferToDataUrl(buffer, mimeType = 'image/png') {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

/**
 * Generate images from prompt for multiple presets
 * @param {string} prompt - Text prompt
 * @param {Array<string>} presetIds - Array of preset IDs
 * @returns {Promise<Array>} Array of processed images with metadata
 */
export async function generateImagesFromPrompt(prompt, presetIds) {
  try {
    // Validate presets
    const validPresets = presetIds
      .map(id => getPresetById(id))
      .filter(preset => preset !== null)
    
    if (validPresets.length === 0) {
      throw new Error('No valid presets provided')
    }

    logger.info(`Generating image for ${validPresets.length} presets`)
    
    // Step 1: Generate base image using DALL-E
    const baseImageUrl = await generateImageWithDallE(prompt)
    
    // Step 2: Download the generated image
    const baseImageBuffer = await downloadImage(baseImageUrl)
    
    // Step 3: Process image for each preset
    const processedImages = await Promise.all(
      validPresets.map(async (preset) => {
        try {
          const processedBuffer = await processImage(
            baseImageBuffer,
            preset.width,
            preset.height
          )
          
          // Convert to base64 data URL for frontend display
          const dataUrl = bufferToDataUrl(processedBuffer)
          
          return {
            preset: preset,
            url: dataUrl,
            size: processedBuffer.length,
            timestamp: new Date().toISOString()
          }
        } catch (error) {
          logger.error(`Error processing preset ${preset.id}:`, error)
          return null
        }
      })
    )
    
    // Filter out any failed processing
    const successfulImages = processedImages.filter(img => img !== null)
    
    if (successfulImages.length === 0) {
      throw new Error('Failed to process any images')
    }
    
    logger.info(`Successfully generated ${successfulImages.length} images`)
    return successfulImages
    
  } catch (error) {
    logger.error('Error in generateImagesFromPrompt:', error)
    throw error
  }
}