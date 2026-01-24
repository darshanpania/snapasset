import { jest } from '@jest/globals'
import { mockImageBuffer } from './sharp.js'

// Mock axios for image downloads
export const mockAxios = jest.fn().mockResolvedValue({
  data: mockImageBuffer,
  status: 200,
  statusText: 'OK',
})

export function mockAxiosError(error = 'Network error') {
  mockAxios.mockRejectedValueOnce(new Error(error))
}

export function resetAxiosMock() {
  mockAxios.mockClear()
  mockAxios.mockResolvedValue({
    data: mockImageBuffer,
    status: 200,
  })
}