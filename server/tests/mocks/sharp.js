import { jest } from '@jest/globals'

// Mock processed image buffer
export const mockImageBuffer = Buffer.from('mock-image-data')

// Mock Sharp chain
const createMockSharpChain = () => ({
  resize: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
  toFile: jest.fn().mockResolvedValue({ size: 250000 }),
})

// Mock Sharp function
export const mockSharp = jest.fn().mockImplementation(() => createMockSharpChain())

// Reset mock
export function resetSharpMock() {
  mockSharp.mockClear()
  mockSharp.mockImplementation(() => createMockSharpChain())
}