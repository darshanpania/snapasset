import { jest } from '@jest/globals'

// Mock DALL-E generated image URL
export const mockDallEImageUrl = 'https://example.com/dalle-generated-image.png'

// Mock OpenAI client
export const mockOpenAI = {
  images: {
    generate: jest.fn().mockResolvedValue({
      data: [
        {
          url: mockDallEImageUrl,
          revised_prompt: 'A beautiful landscape with mountains',
        },
      ],
    }),
  },
}

// Mock OpenAI module
export function mockOpenAIModule() {
  return jest.fn().mockImplementation(() => mockOpenAI)
}