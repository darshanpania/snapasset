// Test data for backend tests

export const validPrompt = 'A beautiful sunset over mountains'

export const validPresets = [
  'instagram-post',
  'twitter-post',
  'facebook-post',
]

export const mockImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

export const mockGeneratedImageUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/test-image.png'

export const mockDallEResponse = {
  data: [
    {
      url: mockGeneratedImageUrl,
      revised_prompt: 'A beautiful sunset over mountains with vibrant colors',
    },
  ],
}

export const mockPreset = {
  id: 'instagram-post',
  name: 'Instagram Post',
  platform: 'Instagram',
  icon: '📷',
  width: 1080,
  height: 1080,
  aspectRatio: '1:1',
}

export const mockProcessedImage = {
  preset: mockPreset,
  url: 'data:image/png;base64,mockdata',
  size: 250000,
  timestamp: '2026-01-24T14:00:00Z',
}

export const invalidInputs = {
  emptyPrompt: '',
  whitespacePrompt: '   ',
  noPresets: [],
  nonArrayPresets: 'not-an-array',
  tooManyPresets: Array(11).fill('instagram-post'),
  invalidPreset: ['non-existent-preset'],
}

export const errorMessages = {
  promptRequired: 'Prompt is required and must be a non-empty string',
  presetsRequired: 'At least one preset must be selected',
  tooManyPresets: 'Maximum 10 presets allowed per request',
  noValidPresets: 'No valid presets provided',
  apiKeyMissing: 'OpenAI API key not configured',
  rateLimitExceeded: 'OpenAI rate limit exceeded',
}